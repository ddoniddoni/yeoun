import { createHash, randomUUID } from 'node:crypto';
import { link, lstat, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { PNG } from 'pngjs';
import type { FilterSeed, Rgb } from '../../src/domain/filters/types.ts';
import { createAuthoringTransform } from '../../src/rendering/reference/authoring.ts';
import { assertLutAtlasStructure, createLutAtlas, LUT_CONTRACT, type LutAtlas } from '../../src/rendering/reference/lutAtlas.ts';
import { createFilterSeedValidator } from './filterSeed.ts';
import { assertLutManifest, LUT_ENGINE_VERSION, LUT_GENERATOR_VERSION, type LutAsset, type LutManifest } from './lutManifest.ts';

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function loadLutSeed(seedPath: string, schemaPath: string): Promise<{ seed: FilterSeed; hash: string }> {
  const bytes = await readFile(seedPath);
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const result = createFilterSeedValidator(schema)(JSON.parse(bytes.toString('utf8')));
  if (!result.ok) throw new Error(result.issues.map(issue => `${issue.path || '/'}: ${issue.message}`).join('\n'));
  return { seed: result.data, hash: sha256(bytes) };
}

export function encodeLutPng(atlas: LutAtlas): Buffer {
  if (atlas.width !== 210 || atlas.height !== 210 || atlas.pixels.length !== 210 * 210 * 4) {
    throw new Error('Cannot encode an incorrectly sized LUT atlas');
  }
  const png = new PNG({ width: atlas.width, height: atlas.height });
  png.data = Buffer.from(atlas.pixels);
  // Raw data texture: no gamma adjustment and no gAMA/iCCP/sRGB display metadata.
  png.gamma = 0;
  return PNG.sync.write(png, { bitDepth: 8, colorType: 6, inputColorType: 6, inputHasAlpha: true,
    filterType: 4, deflateLevel: 9, deflateStrategy: 3 });
}

export function decodeLutPng(bytes: Buffer): LutAtlas {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  // Bound dimensions before decompression; do not let a corrupt manifest choose image allocation size.
  if (bytes.length < 33 || bytes.length > 1_000_000 || !bytes.subarray(0, 8).equals(signature) ||
      bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR' ||
      bytes.readUInt32BE(16) !== 210 || bytes.readUInt32BE(20) !== 210 ||
      bytes[24] !== 8 || bytes[25] !== 6 || bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] !== 0) {
    throw new Error('Expected a non-interlaced 210x210 RGBA8 PNG under 1 MB');
  }
  let cursor = 8;
  let ended = false;
  let hasImageData = false;
  while (cursor + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(cursor);
    const kind = bytes.toString('ascii', cursor + 4, cursor + 8);
    if (cursor + length + 12 > bytes.length) throw new Error('Truncated PNG chunk');
    if (!['IHDR', 'IDAT', 'IEND'].includes(kind)) throw new Error(`Unexpected LUT PNG chunk: ${kind}`);
    if (kind === 'IHDR' && cursor !== 8) throw new Error('Duplicate PNG header');
    if (kind === 'IDAT') hasImageData = true;
    cursor += length + 12;
    if (kind === 'IEND') { ended = hasImageData && length === 0 && cursor === bytes.length; break; }
  }
  if (!ended) throw new Error('Invalid PNG ending');
  const decoded = PNG.sync.read(bytes, { checkCRC: true });
  return { width: decoded.width, height: decoded.height, pixels: decoded.data };
}

export type LutBundle = Readonly<{ manifest: LutManifest; files: ReadonlyMap<string, Buffer> }>;

export function buildLutBundle(seed: FilterSeed, seedHash: string): LutBundle {
  const assets: LutAsset[] = [];
  const files = new Map<string, Buffer>();
  const add = (filterId: string, lookVersion: string, role: 'identity' | 'look', transform: (input: Rgb) => Rgb) => {
    const png = encodeLutPng(createLutAtlas(transform));
    const hash = sha256(png);
    const path = `luts/${filterId}-${hash}.png`;
    files.set(path, png);
    assets.push({ filterId, lookVersion, role, status: 'draft', path, sha256: hash });
  };
  add('identity', '0.1.0-draft', 'identity', input => input);
  for (const collection of seed.collections) {
    const filter = seed.filters.find(item => item.id === collection.representativeId);
    if (!filter) throw new Error(`Missing representative: ${collection.representativeId}`);
    add(filter.id, filter.lookVersion, 'look', createAuthoringTransform(filter.authoring));
  }
  const manifest: LutManifest = {
    schemaVersion: 1, status: 'draft', renderContractVersion: '0.1.0', engineVersion: LUT_ENGINE_VERSION,
    generatorVersion: LUT_GENERATOR_VERSION, sourceSeedSha256: seedHash,
    encoder: { pngjs: '7.0.0', node: process.versions.node, zlib: process.versions.zlib },
    lutContract: LUT_CONTRACT, assets,
  };
  assertLutManifest(manifest, seed, seedHash);
  return { manifest, files };
}

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

async function existingBytes(path: string, maximumBytes = 1_000_000): Promise<Buffer | undefined> {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > maximumBytes) {
      throw new Error(`Expected a regular file of at most ${maximumBytes} bytes: ${path}`);
    }
    return await readFile(path);
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return undefined;
    throw error;
  }
}

async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Expected a real directory: ${path}`);
}

/** Publish a complete file without replacing an existing version, including on concurrent calls. */
async function writeOnce(path: string, bytes: Buffer): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    try { await link(temporary, path); }
    catch (error) {
      if (!hasCode(error, 'EEXIST')) throw error;
      const existing = await existingBytes(path);
      if (!existing?.equals(bytes)) throw new Error(`Refusing to replace existing LUT asset: ${path}`);
    }
  } finally {
    await unlink(temporary).catch(error => { if (!hasCode(error, 'ENOENT')) throw error; });
  }
}

export async function writeLutBundle(outputDirectory: string, bundle: LutBundle): Promise<string> {
  const manifestPath = join(outputDirectory, 'filter-manifest.json');
  const manifestBytes = Buffer.from(JSON.stringify(bundle.manifest, null, 2) + '\n');
  const existing = await existingBytes(manifestPath, 100_000);
  if (existing && !existing.equals(manifestBytes)) {
    throw new Error('Output already contains a different manifest. Choose a new output directory; existing versions are immutable.');
  }
  await ensureDirectory(outputDirectory);
  await ensureDirectory(join(outputDirectory, 'luts'));
  for (const asset of bundle.manifest.assets) {
    if (!/^[a-f0-9]{64}$/.test(asset.sha256) ||
        asset.path !== `luts/${asset.filterId}-${asset.sha256}.png` ||
        !/^(identity|(light|time|scene)-[a-z]+)$/.test(asset.filterId)) {
      throw new Error('Refusing an invalid LUT output path');
    }
    const bytes = bundle.files.get(asset.path);
    if (!bytes || sha256(bytes) !== asset.sha256) throw new Error(`Missing or mismatched PNG bytes: ${asset.filterId}`);
    await writeOnce(join(outputDirectory, asset.path), bytes);
  }
  // Commit marker comes last: partial PNG writes never publish a ready manifest.
  await writeOnce(manifestPath, manifestBytes);
  return manifestPath;
}

export async function validateLutBundle(manifestPath: string, seed: FilterSeed, seedHash: string): Promise<LutManifest> {
  const manifestBytes = await existingBytes(manifestPath, 100_000);
  if (!manifestBytes) throw new Error('Missing LUT manifest');
  const manifest: unknown = JSON.parse(manifestBytes.toString('utf8'));
  assertLutManifest(manifest, seed, seedHash);
  const root = dirname(manifestPath);
  const directory = await lstat(join(root, 'luts'));
  if (!directory.isDirectory() || directory.isSymbolicLink()) throw new Error('LUT directory must not be a symlink');
  for (const asset of manifest.assets) {
    const path = join(root, asset.path);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 1_000_000) throw new Error(`Invalid LUT file: ${asset.path}`);
    const bytes = await readFile(path);
    if (sha256(bytes) !== asset.sha256) throw new Error(`LUT checksum mismatch: ${asset.path}`);
    assertLutAtlasStructure(decodeLutPng(bytes));
  }
  return manifest;
}
