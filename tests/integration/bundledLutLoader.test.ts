import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import manifest from '../../assets/lut-drafts/lut-authoring-0.1.0/1836f20cbc08b2791bc3ba296e68a5f7914450059b60a231dbb6f37febdd681e/filter-manifest.json';
import { createBundledDraftLutLoader, loadDraftLutPipeline } from '../../src/rendering/adapters/bundledLutLoader';
import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';

// Metro's actual .lut packaging and native decode are separate device checks.
jest.mock('../../src/rendering/assets/bundledLuts', () => {
  const source = require('../../assets/lut-drafts/lut-authoring-0.1.0/1836f20cbc08b2791bc3ba296e68a5f7914450059b60a231dbb6f37febdd681e/filter-manifest.json');
  return {
    bundledLutManifest: source,
    bundledLutExpectation: { sourceSeedSha256: source.sourceSeedSha256,
      lookVersions: new Map(source.assets.map((asset: { filterId: string; lookVersion: string }) => [asset.filterId, asset.lookVersion])) },
    bundledLutModules: Object.fromEntries(source.assets.map((asset: { path: string }, index: number) => [asset.path, index + 1])),
  };
});
jest.mock('../../src/platform/files/lutAssets', () => ({ readBundledLutBytes: jest.fn(), digestLutBytes: jest.fn() }));
jest.mock('../../src/rendering/adapters/decodeLut', () => ({ decodeLutWithSkia: jest.fn() }));
jest.mock('../../src/rendering/adapters/lutSkia', () => ({ createSkiaLutPipeline: jest.fn() }));
const files = jest.requireMock<{ readBundledLutBytes: jest.Mock; digestLutBytes: jest.Mock }>('../../src/platform/files/lutAssets');
const decode = jest.requireMock<{ decodeLutWithSkia: jest.Mock }>('../../src/rendering/adapters/decodeLut').decodeLutWithSkia;
const createPipeline = jest.requireMock<{ createSkiaLutPipeline: jest.Mock }>('../../src/rendering/adapters/lutSkia').createSkiaLutPipeline;
const selection = { filterId: 'identity', lookVersion: '0.1.0-draft', engineVersion: manifest.engineVersion };

beforeEach(async () => {
  const png = await readFile(join(__dirname, '../../assets/lut-drafts', manifest.engineVersion, manifest.sourceSeedSha256, manifest.assets[0]!.path));
  files.readBundledLutBytes.mockResolvedValue(png);
  files.digestLutBytes.mockImplementation(async (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex'));
  decode.mockReturnValue(createLutAtlas(rgb => rgb));
});
afterEach(() => jest.resetAllMocks());

test('loads on demand, reuses validated CPU data and leaves native pipeline ownership with callers', async () => {
  const pipeline = { dispose: jest.fn() };
  createPipeline.mockReturnValue(pipeline);
  const loader = createBundledDraftLutLoader();
  expect(files.readBundledLutBytes).not.toHaveBeenCalled();
  expect(createPipeline).not.toHaveBeenCalled();
  const loaded = await loadDraftLutPipeline(loader, selection);
  expect(files.readBundledLutBytes).toHaveBeenCalledWith(1);
  expect(createPipeline).toHaveBeenCalledWith(createLutAtlas(rgb => rgb));
  expect(loaded).toMatchObject({ asset: { filterId: 'identity', status: 'draft' }, pipeline });
  await loader.load(selection);
  expect(files.readBundledLutBytes).toHaveBeenCalledTimes(1);
  loader.clearCache();
  expect(pipeline.dispose).not.toHaveBeenCalled();
  loaded.pipeline.dispose();
  expect(pipeline.dispose).toHaveBeenCalledTimes(1);
});

test('does not construct a shader from a bad checksum or stale selection', async () => {
  const loader = createBundledDraftLutLoader();
  await expect(loadDraftLutPipeline(loader, { ...selection, lookVersion: 'old' })).rejects.toThrow(/selection/);
  expect(files.readBundledLutBytes).not.toHaveBeenCalled();
  files.digestLutBytes.mockResolvedValue('0'.repeat(64));
  await expect(loadDraftLutPipeline(loader, selection)).rejects.toThrow(/checksum/);
  expect(decode).not.toHaveBeenCalled();
  expect(createPipeline).not.toHaveBeenCalled();
});

test('shader allocation failure does not discard a valid decoded LUT', async () => {
  const loader = createBundledDraftLutLoader();
  createPipeline.mockImplementationOnce(() => { throw new Error('compile'); });
  await expect(loadDraftLutPipeline(loader, selection)).rejects.toThrow('compile');
  createPipeline.mockReturnValue({ dispose: jest.fn() });
  await loadDraftLutPipeline(loader, selection);
  expect(files.readBundledLutBytes).toHaveBeenCalledTimes(1);
  expect(decode).toHaveBeenCalledTimes(1);
});
