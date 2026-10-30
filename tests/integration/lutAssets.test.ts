/** @jest-environment node */
import { mkdtemp, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import type { FilterSeed } from '../../src/domain/filters/types';
import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';
import {
  buildLutBundle, decodeLutPng, encodeLutPng, loadLutSeed, sha256, validateLutBundle, writeLutBundle,
  type LutBundle,
} from '../../scripts/lib/lutAssets';
import { assertLutManifest } from '../../scripts/lib/lutManifest';

let seed: FilterSeed;
let seedHash: string;
let bundle: LutBundle;
let directory: string;

beforeAll(async () => {
  ({ seed, hash: seedHash } = await loadLutSeed(
    join(__dirname, '../../spec/filters.seed.json'), join(__dirname, '../../spec/filters.schema.json'),
  ));
  bundle = buildLutBundle(seed, seedHash);
});
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'yeoun-lut-assets-')); });
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

test('generates every curated look without promoting the seed or assets', () => {
  expect(bundle.manifest.assets.map(asset => asset.filterId)).toEqual([
    'identity', ...seed.filters.map(filter => filter.id),
  ]);
  expect(bundle.manifest.status).toBe('draft');
  expect(bundle.manifest.assets.every(asset => asset.status === 'draft')).toBe(true);
  expect(new Set(bundle.manifest.assets.map(asset => asset.sha256)).size).toBe(18);
  expect(seed.filters.every(filter => filter.status === 'design-draft' && filter.lut === null)).toBe(true);
  expect(() => assertLutManifest(bundle.manifest, seed, seedHash)).not.toThrow();
});

test('lossless PNG round trip preserves every raw byte and encoding is repeatable in one environment', () => {
  const atlas = createLutAtlas(input => input);
  const first = encodeLutPng(atlas);
  expect(encodeLutPng(atlas)).toEqual(first);
  expect(Buffer.from(decodeLutPng(first).pixels)).toEqual(Buffer.from(atlas.pixels));
});

test('rejects gamma metadata, duplicate headers, bad CRCs and trailing data', () => {
  const png = new PNG({ width: 210, height: 210 });
  png.gamma = 0.45455;
  expect(() => decodeLutPng(PNG.sync.write(png))).toThrow(/chunk: gAMA/);
  const bytes = encodeLutPng(createLutAtlas(input => input));
  const duplicateHeader = Buffer.concat([bytes.subarray(0, 33), bytes.subarray(8, 33), bytes.subarray(33)]);
  expect(() => decodeLutPng(duplicateHeader)).toThrow(/Duplicate/);
  const invalidCrc = Buffer.from(bytes);
  invalidCrc[29] = invalidCrc[29]! ^ 0xff;
  expect(() => decodeLutPng(invalidCrc)).toThrow();
  expect(() => decodeLutPng(Buffer.concat([bytes, Buffer.from([0])]))).toThrow(/ending/);
});

test('rejects wrong dimensions before PNG decoding', () => {
  const bytes = encodeLutPng(createLutAtlas(input => input));
  bytes.writeUInt32BE(100_000, 16);
  expect(() => decodeLutPng(bytes)).toThrow(/210x210/);
});

test('manifest rejects a stale seed, duplicate ID, altered contract and unsafe asset path', () => {
  expect(() => assertLutManifest(bundle.manifest, seed, '0'.repeat(64))).toThrow(/source seed/);
  const first = bundle.manifest.assets[0]!;
  expect(() => assertLutManifest({ ...bundle.manifest,
    assets: [first, first, ...bundle.manifest.assets.slice(2)],
  }, seed, seedHash)).toThrow(/Duplicate/);
  expect(() => assertLutManifest({ ...bundle.manifest,
    lutContract: { ...bundle.manifest.lutContract, inputSpace: 'linear-srgb' },
  }, seed, seedHash)).toThrow(/Invalid/);
  expect(() => assertLutManifest({ ...bundle.manifest,
    assets: [{ ...first, path: '../escape.png' }, ...bundle.manifest.assets.slice(1)],
  }, seed, seedHash)).toThrow(/Invalid/);
});

test('publishes a readable bundle; repeated identical writes preserve existing files', async () => {
  const path = await writeLutBundle(directory, bundle);
  const before = await readFile(path);
  await expect(writeLutBundle(directory, bundle)).resolves.toBe(path);
  expect(await readFile(path)).toEqual(before);
  expect(await validateLutBundle(path, seed, seedHash)).toEqual(bundle.manifest);
  expect((await readdir(join(directory, 'luts'))).sort()).toEqual(
    bundle.manifest.assets.map(asset => asset.path.slice('luts/'.length)).sort(),
  );
});

test('a changed manifest is refused without overwriting the earlier version', async () => {
  const path = await writeLutBundle(directory, bundle);
  const before = await readFile(path);
  const changed: LutBundle = { ...bundle, manifest: { ...bundle.manifest, sourceSeedSha256: '0'.repeat(64) } };
  await expect(writeLutBundle(directory, changed)).rejects.toThrow(/immutable/);
  expect(await readFile(path)).toEqual(before);
});

test('checksum damage and missing PNG files cannot be accepted', async () => {
  const path = await writeLutBundle(directory, bundle);
  const assetPath = join(directory, bundle.manifest.assets[0]!.path);
  await writeFile(assetPath, 'damaged PNG');
  await expect(validateLutBundle(path, seed, seedHash)).rejects.toThrow(/checksum/);
  await unlink(assetPath);
  await expect(validateLutBundle(path, seed, seedHash)).rejects.toThrow();
});

test('a valid checksum cannot hide broken padding', async () => {
  const atlas = createLutAtlas(input => input);
  atlas.pixels[0] = 200;
  const bytes = encodeLutPng(atlas);
  const hash = sha256(bytes);
  const asset = { ...bundle.manifest.assets[0]!, sha256: hash, path: `luts/identity-${hash}.png` };
  const altered = { manifest: { ...bundle.manifest, assets: [asset, ...bundle.manifest.assets.slice(1)] },
    files: new Map([...bundle.files, [asset.path, bytes]]) };
  const path = await writeLutBundle(directory, altered);
  await expect(validateLutBundle(path, seed, seedHash)).rejects.toThrow(/padding/);
});

test('an incomplete bundle never publishes a manifest', async () => {
  const files = new Map(bundle.files);
  files.delete(bundle.manifest.assets[3]!.path);
  await expect(writeLutBundle(directory, { ...bundle, files })).rejects.toThrow(/Missing/);
  await expect(readFile(join(directory, 'filter-manifest.json'))).rejects.toMatchObject({ code: 'ENOENT' });
});
