import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import manifest from '../../assets/lut-drafts/lut-authoring-0.1.0/c8ea7f44914526b054178910ff80954d4707e9b7e0a3f00f8df7f3d2c08c6969/filter-manifest.json';
import { createBundledDraftLutLoader, loadDraftLutPipeline } from '../../src/rendering/adapters/bundledLutLoader';
import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';
import retainedManifest from '../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/filter-manifest.json';

// Metro's actual .lut packaging and native decode are separate device checks.
jest.mock('../../src/rendering/assets/bundledLuts', () => {
  const source = require('../../assets/lut-drafts/lut-authoring-0.1.0/c8ea7f44914526b054178910ff80954d4707e9b7e0a3f00f8df7f3d2c08c6969/filter-manifest.json');
  return {
    bundledLutManifest: source,
    bundledLutExpectation: { sourceSeedSha256: source.sourceSeedSha256,
      lookVersions: new Map(source.assets.map((asset: { filterId: string; lookVersion: string }) => [asset.filterId, asset.lookVersion])) },
    bundledLutModules: Object.fromEntries(source.assets.map((asset: { path: string }, index: number) => [asset.path, index + 1])),
  };
});
jest.mock('../../src/platform/files/lutAssets', () => ({ readBundledLutBytes: jest.fn(), digestLutBytes: jest.fn() }));
jest.mock('../../src/rendering/assets/retainedLuts', () => {
  const source = require('../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/filter-manifest.json');
  const assets = source.assets.filter((asset: { filterId: string }) => ['identity', 'portrait-clear', 'food-cafe', 'retro-travel'].includes(asset.filterId));
  return {
    retainedLutManifest: { ...source, assets },
    retainedLutExpectation: { sourceSeedSha256: source.sourceSeedSha256,
      lookVersions: new Map(assets.map((asset: { filterId: string; lookVersion: string }) => [asset.filterId, asset.lookVersion])) },
    retainedLutModules: Object.fromEntries(assets.map((asset: { path: string }, index: number) => [asset.path, index + 101])),
  };
});
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

test.each(['portrait-clear', 'food-cafe', 'retro-travel'])(
  'keeps old and new %s bytes distinct and clears both caches', async filterId => {
    const current = manifest.assets.find(asset => asset.filterId === filterId)!;
    const previous = retainedManifest.assets.find(asset => asset.filterId === filterId)!;
    const currentBytes = await readFile(join(__dirname, '../../assets/lut-drafts', manifest.engineVersion, manifest.sourceSeedSha256, current.path));
    const oldBytes = await readFile(join(__dirname, '../../assets/lut-drafts', retainedManifest.engineVersion, retainedManifest.sourceSeedSha256, previous.path));
    files.readBundledLutBytes.mockImplementation(async (moduleId: number) => moduleId >= 101 ? oldBytes : currentBytes);
    const loader = createBundledDraftLutLoader();
    const now = { filterId, lookVersion: current.lookVersion, engineVersion: manifest.engineVersion };
    const old = { ...now, lookVersion: previous.lookVersion };
    expect((await loader.load(old)).asset.sha256).toBe(previous.sha256);
    expect((await loader.load(now)).asset.sha256).toBe(current.sha256);
    expect(current.sha256).not.toBe(previous.sha256);
    await loader.load(old); await loader.load(now);
    expect(files.readBundledLutBytes).toHaveBeenCalledTimes(2);
    loader.clearCache();
    await loader.load(old); await loader.load(now);
    expect(files.readBundledLutBytes).toHaveBeenCalledTimes(4);
  },
);
