/** @jest-environment node */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import manifest from '../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/filter-manifest.json';
import { decodeLutPng } from '../../scripts/lib/lutAssets';
import { createLutAssetLoader, type LutSelection } from '../../src/rendering/assets/lutLoader';
import { assertLutPngContainer } from '../../src/rendering/assets/lutPng';
import { createLutAtlas, type LutAtlas } from '../../src/rendering/reference/lutAtlas';

const root = join(__dirname, '../../assets/lut-drafts', manifest.engineVersion, manifest.sourceSeedSha256);
const expected = { sourceSeedSha256: manifest.sourceSeedSha256,
  lookVersions: new Map(manifest.assets.map(asset => [asset.filterId, asset.lookVersion])) };
const selection: LutSelection = { filterId: 'identity', lookVersion: '0.1.0-draft', engineVersion: manifest.engineVersion };
let bytes: Uint8Array;
beforeAll(async () => { bytes = await readFile(join(root, manifest.assets[0]!.path)); });
function reference(input: Uint8Array): LutAtlas {
  const atlas = decodeLutPng(Buffer.from(input));
  return { ...atlas, pixels: Uint8Array.from(atlas.pixels) };
}
function setup() {
  const ports = {
    read: jest.fn(async () => bytes),
    sha256: jest.fn(async (input: Uint8Array) => createHash('sha256').update(input).digest('hex')),
    decode: jest.fn(reference),
  };
  return { ports, loader: createLutAssetLoader(manifest, expected, ports) };
}

test('raw packaged copies equal canonical PNGs and load all eight registered assets', async () => {
  const seed = await readFile(join(__dirname, '../../spec/filters.seed.json'));
  expect(createHash('sha256').update(seed).digest('hex')).toBe(manifest.sourceSeedSha256);
  const { ports, loader } = setup();
  ports.read.mockImplementation(async () => bytes);
  for (const asset of manifest.assets) {
    const png = await readFile(join(root, asset.path));
    const raw = await readFile(join(root, asset.path.replace(/\.png$/, '.lut')));
    expect(raw).toEqual(png);
    ports.read.mockResolvedValueOnce(raw);
    const loaded = await loader.load({ filterId: asset.filterId, lookVersion: asset.lookVersion, engineVersion: manifest.engineVersion });
    expect(loaded.asset.sha256).toBe(asset.sha256);
    expect(loaded.asset.status).toBe('draft');
    expect(loaded.atlas).toEqual(reference(png));
  }
});

test('deduplicates concurrent loads and isolates caller data from the cache', async () => {
  const { ports, loader } = setup();
  const [first, second] = await Promise.all([loader.load(selection), loader.load(selection)]);
  expect(ports.read).toHaveBeenCalledTimes(1);
  expect(ports.sha256).toHaveBeenCalledTimes(1);
  expect(ports.decode).toHaveBeenCalledTimes(1);
  first.atlas.pixels.fill(0);
  expect((await loader.load(selection)).atlas.pixels).toEqual(second.atlas.pixels);
  expect(first.atlas.pixels.buffer).not.toBe(second.atlas.pixels.buffer);
  loader.clearCache();
  await loader.load(selection);
  expect(ports.read).toHaveBeenCalledTimes(2);
});

test('owns exactly the typed-array view before asynchronous hashing', async () => {
  const { ports, loader } = setup();
  const storage = new Uint8Array(bytes.length + 16);
  storage.set(bytes, 8);
  ports.read.mockResolvedValue(storage.subarray(8, -8));
  ports.sha256.mockImplementation(async input => {
    expect(input.byteOffset).toBe(0);
    expect(input.buffer.byteLength).toBe(bytes.length);
    storage.fill(0);
    return createHash('sha256').update(input).digest('hex');
  });
  expect((await loader.load(selection)).atlas).toEqual(reference(bytes));
});

test.each([{ filterId: 'original' }, { lookVersion: 'stale' }, { engineVersion: 'stale' }])(
  'rejects an unknown selection before I/O: %o', async patch => {
    const { ports, loader } = setup();
    await expect(loader.load({ ...selection, ...patch })).rejects.toThrow(/selection/);
    expect(ports.read).not.toHaveBeenCalled();
  },
);

test('does not decode mismatched files and retries after checksum/read failures', async () => {
  const { ports, loader } = setup();
  ports.read.mockRejectedValueOnce(new Error('missing file'));
  await expect(loader.load(selection)).rejects.toThrow('missing file');
  ports.sha256.mockResolvedValueOnce('0'.repeat(64));
  await expect(loader.load(selection)).rejects.toThrow(/checksum/);
  expect(ports.decode).not.toHaveBeenCalled();
  await expect(loader.load(selection)).resolves.toMatchObject({ asset: { filterId: 'identity' } });
  expect(ports.read).toHaveBeenCalledTimes(3);
});

test('failed decode or damaged atlas cannot populate the successful cache', async () => {
  const { ports, loader } = setup();
  ports.decode.mockImplementationOnce(() => { throw new Error('decode'); });
  await expect(loader.load(selection)).rejects.toThrow('decode');
  const atlas = createLutAtlas(rgb => rgb);
  atlas.pixels[3] = 0;
  ports.decode.mockReturnValueOnce(atlas);
  await expect(loader.load(selection)).rejects.toThrow(/alpha/);
  await expect(loader.load(selection)).resolves.toMatchObject({ asset: { filterId: 'identity' } });
  expect(ports.read).toHaveBeenCalledTimes(3);
});

test('an old failure after clearCache cannot evict a newer successful load', async () => {
  const { ports, loader } = setup();
  let rejectOld!: (reason: Error) => void;
  ports.read.mockReturnValueOnce(new Promise<Uint8Array>((_resolve, reject) => { rejectOld = reject; }));
  const oldResult = loader.load(selection).catch(error => error);
  loader.clearCache();
  await loader.load(selection);
  rejectOld(new Error('old request failed'));
  expect(await oldResult).toEqual(new Error('old request failed'));
  await loader.load(selection);
  expect(ports.read).toHaveBeenCalledTimes(2);
});

test('PNG guard rejects malformed headers, CRC, trailing data and truncation before decode', () => {
  for (const offset of [16, 24, 25, 28, 29]) {
    const corrupt = Uint8Array.from(bytes);
    corrupt[offset] = corrupt[offset]! ^ 1;
    expect(() => assertLutPngContainer(corrupt)).toThrow();
  }
  expect(() => assertLutPngContainer(bytes.subarray(0, -1))).toThrow();
  expect(() => assertLutPngContainer(new Uint8Array([...bytes, 0]))).toThrow(/ending/);
});
