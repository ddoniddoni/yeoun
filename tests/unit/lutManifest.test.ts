import manifest from '../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/filter-manifest.json';
import { parseLutManifest } from '../../src/rendering/assets/lutManifest';

const expected = { sourceSeedSha256: manifest.sourceSeedSha256,
  lookVersions: new Map(manifest.assets.map(asset => [asset.filterId, asset.lookVersion])) };

test('returns an immutable manifest snapshot independent of the source JSON', () => {
  const input = { ...manifest, assets: manifest.assets.map(asset => ({ ...asset })), encoder: { ...manifest.encoder } };
  const parsed = parseLutManifest(input, expected);
  input.assets[0]!.sha256 = '0'.repeat(64);
  input.encoder.node = 'changed';
  expect(parsed).toEqual(manifest);
  for (const value of [parsed, parsed.assets, parsed.encoder, parsed.lutContract, ...parsed.assets]) expect(Object.isFrozen(value)).toBe(true);
});

test.each(['schemaVersion', 'renderContractVersion', 'engineVersion', 'generatorVersion', 'status'])(
  'rejects an unsupported %s', key => {
    expect(() => parseLutManifest({ ...manifest, [key]: 'unsupported' }, expected)).toThrow(/Invalid/);
  },
);

test('rejects stale seed, missing/extra fields, changed contract and mismatched representative versions', () => {
  expect(() => parseLutManifest(manifest, { ...expected, sourceSeedSha256: '0'.repeat(64) })).toThrow(/source seed/);
  expect(() => parseLutManifest({ ...manifest, extra: true }, expected)).toThrow(/fields/);
  expect(() => parseLutManifest({ ...manifest, encoder: { pngjs: '7.0.0', node: '26' } }, expected)).toThrow(/fields/);
  expect(() => parseLutManifest({ ...manifest, lutContract: { ...manifest.lutContract, inputSpace: 'linear-srgb' } }, expected)).toThrow(/contract/);
  const lookVersions = new Map(expected.lookVersions);
  lookVersions.set('light-afternoon', 'new-version');
  expect(() => parseLutManifest(manifest, { ...expected, lookVersions })).toThrow(/mismatched/);
});

test('rejects duplicate/missing entries, path traversal, wrong roles and invalid checksums', () => {
  const first = manifest.assets[0]!;
  expect(() => parseLutManifest({ ...manifest, assets: [first, first, ...manifest.assets.slice(2)] }, expected)).toThrow(/Duplicate/);
  expect(() => parseLutManifest({ ...manifest, assets: manifest.assets.slice(1) }, expected)).toThrow(/registered looks/);
  for (const patch of [{ path: '../escape.png' }, { role: 'look' }, { sha256: 'bad' }, { lookVersion: 'old' }, { status: 'approved' }]) {
    expect(() => parseLutManifest({ ...manifest, assets: [{ ...first, ...patch }, ...manifest.assets.slice(1)] }, expected)).toThrow(/Invalid/);
  }
});
