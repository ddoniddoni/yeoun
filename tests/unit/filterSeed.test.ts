import schema from '../../spec/filters.schema.json';
import seed from '../../spec/filters.seed.json';
import { createFilterSeedValidator } from '../../scripts/lib/filterSeed';

const validate = createFilterSeedValidator(schema);

// Fixtures are JSON-only; each case owns a copy so the source draft stays intact.
function copySeed(): typeof seed {
  return JSON.parse(JSON.stringify(seed));
}

function expectIssue(input: unknown, kind: 'schema' | 'semantic', code: string, path: string) {
  expect(validate(input)).toEqual({
    ok: false,
    issues: expect.arrayContaining([expect.objectContaining({ kind, code, path })]),
  });
}

test('the nine authoring drafts are accepted without becoming renderable assets', () => {
  const result = validate(seed);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected a valid authoring seed');
  expect(result.data.filters).toHaveLength(9);
  expect(result.data.filters.every(filter => filter.status === 'design-draft' && filter.lut === null)).toBe(true);
});

test.each([{ input: null }, { input: [] }, { input: 'seed' }, { input: 42 }])('rejects a non-object root: $input', ({ input }) => {
  expectIssue(input, 'schema', 'type', '');
});

test('reports missing nested settings without supplying defaults', () => {
  const input = copySeed();
  const filter = input.filters[0]!;
  const incomplete = { ...input, filters: [{ ...filter, defaults: undefined }, ...input.filters.slice(1)] };
  expectIssue(incomplete, 'schema', 'required', '/filters/0/defaults');
  expect(incomplete.filters[0]!.defaults).toBeUndefined();
});

test('rejects unknown properties and escapes JSON Pointer segments', () => {
  const input = { ...copySeed(), 'a/b~c': true };
  expectIssue(input, 'schema', 'additionalProperties', '/a~1b~0c');
  expect(input['a/b~c']).toBe(true);
});

test('does not coerce numeric strings into settings', () => {
  const input = copySeed();
  const filter = input.filters[0]!;
  const defaults = { ...filter.defaults, intensity: '0.8' };
  const invalid = { ...input, filters: [{ ...filter, defaults }, ...input.filters.slice(1)] };
  expectIssue(invalid, 'schema', 'type', '/filters/0/defaults/intensity');
  expect(defaults.intensity).toBe('0.8');
});

test.each([NaN, Infinity, -Infinity])('rejects a non-finite setting (%s) before JSON serialization', value => {
  const input = copySeed();
  input.filters[0]!.defaults.intensity = value;
  expectIssue(input, 'schema', 'type', '/filters/0/defaults/intensity');
});

test.each(['intensity', 'grain', 'bloom'] as const)('enforces the normalized %s range', setting => {
  const input = copySeed();
  input.filters[0]!.defaults[setting] = 1.01;
  expectIssue(input, 'schema', 'maximum', `/filters/0/defaults/${setting}`);
  input.filters[0]!.defaults[setting] = -0.01;
  expectIssue(input, 'schema', 'minimum', `/filters/0/defaults/${setting}`);
});

test('accepts inclusive numeric bounds and an empty hue band list', () => {
  const input = copySeed();
  const filter = input.filters[0]!;
  filter.defaults = { intensity: 0, grain: 1, bloom: 0 };
  filter.authoring.exposureEv = -1;
  filter.authoring.saturation = 2;
  filter.authoring.shadowTintRgb = [-0.1, 0, 0.1];
  filter.authoring.hueBands = [];
  expect(validate(input).ok).toBe(true);
});

test('rejects out-of-range exposure and exclusive hue limits', () => {
  const input = copySeed();
  const authoring = input.filters[0]!.authoring;
  authoring.exposureEv = 1.01;
  authoring.hueBands = [{ centerDeg: 360, halfWidthDeg: 0, shiftDeg: 31, saturationMultiplier: 2.1 }];
  expectIssue(input, 'schema', 'maximum', '/filters/0/authoring/exposureEv');
  expectIssue(input, 'schema', 'exclusiveMaximum', '/filters/0/authoring/hueBands/0/centerDeg');
  expectIssue(input, 'schema', 'exclusiveMinimum', '/filters/0/authoring/hueBands/0/halfWidthDeg');
});

test('validates actual calendar dates', () => {
  expectIssue({ ...seed, createdAt: '2026-02-30' }, 'schema', 'format', '/createdAt');
  expect(validate({ ...seed, createdAt: '2028-02-29' }).ok).toBe(true);
});

test('does not accept a new schema or render contract version implicitly', () => {
  expectIssue({ ...seed, schemaVersion: 2 }, 'schema', 'const', '/schemaVersion');
  expectIssue({ ...seed, renderContractVersion: '0.2.0' }, 'semantic', 'unsupported-render-contract', '/renderContractVersion');
});

test('requires exactly nine filters and the fixed LUT layout', () => {
  expectIssue({ ...seed, filters: seed.filters.slice(1) }, 'schema', 'minItems', '/filters');
  expectIssue({ ...seed, lutContract: { ...seed.lutContract, size: 32 } }, 'schema', 'const', '/lutContract/size');
});

test('rejects completed asset data in an authoring draft', () => {
  const input = copySeed();
  const filter = input.filters[0]!;
  expectIssue({ ...input, filters: [{ ...filter, lut: 'look.png' }, ...input.filters.slice(1)] },
    'schema', 'type', '/filters/0/lut');
  expectIssue({ ...input, filters: [{ ...filter, status: 'approved' }, ...input.filters.slice(1)] },
    'schema', 'const', '/filters/0/status');
});

test('rejects duplicate filter IDs even when the total is still nine', () => {
  const input = copySeed();
  input.filters[1]!.id = input.filters[0]!.id;
  expectIssue(input, 'semantic', 'duplicate-filter-id', '/filters/1/id');
});

test('rejects duplicate and missing collections', () => {
  const input = copySeed();
  input.collections[1]!.id = 'light';
  expectIssue(input, 'semantic', 'duplicate-collection-id', '/collections/1/id');
  expectIssue(input, 'semantic', 'missing-collection', '/collections');
  expectIssue(input, 'semantic', 'missing-filter-collection', '/filters/3/collection');
});

test('enforces three filters per collection, beyond the total count', () => {
  const input = copySeed();
  input.filters[2]!.collection = 'time';
  input.filters[2]!.id = 'time-spring';
  expectIssue(input, 'semantic', 'collection-filter-count', '/filters');
});

test('checks filter ID prefixes against their actual collection', () => {
  const input = copySeed();
  input.filters[0]!.id = 'time-afternoon';
  expectIssue(input, 'semantic', 'filter-collection-mismatch', '/filters/0/id');
});

test('requires an existing representative in the same collection', () => {
  const input = copySeed();
  input.collections[0]!.representativeId = 'light-missing';
  expectIssue(input, 'semantic', 'missing-representative', '/collections/0/representativeId');
  input.collections[0]!.representativeId = 'time-summer';
  expectIssue(input, 'semantic', 'representative-collection-mismatch', '/collections/0/representativeId');
});

test('rejects repeated or decreasing tone curve x coordinates', () => {
  const input = copySeed();
  const curve = input.filters[0]!.authoring.toneCurve;
  curve[2]![0] = curve[1]![0]!;
  expectIssue(input, 'semantic', 'tone-curve-x-order', '/filters/0/authoring/toneCurve/2/0');
  curve[2]![0] = 0.1;
  expectIssue(input, 'semantic', 'tone-curve-x-order', '/filters/0/authoring/toneCurve/2/0');
});

test('accepts flat curve outputs, but rejects decreasing outputs', () => {
  const input = copySeed();
  const curve = input.filters[0]!.authoring.toneCurve;
  curve[2]![1] = curve[1]![1]!;
  expect(validate(input).ok).toBe(true);
  curve[2]![1] = 0;
  expectIssue(input, 'semantic', 'tone-curve-y-order', '/filters/0/authoring/toneCurve/2/1');
});

test('requires the curve to cover the full normalized input domain', () => {
  const input = copySeed();
  input.filters[0]!.authoring.toneCurve[0]![0] = 0.01;
  expectIssue(input, 'semantic', 'tone-curve-domain', '/filters/0/authoring/toneCurve');
});

test('reports malformed tuples as schema errors before semantic traversal', () => {
  const input = copySeed();
  input.filters[0]!.authoring.toneCurve[0] = [];
  expectIssue(input, 'schema', 'minItems', '/filters/0/authoring/toneCurve/0');
});

test('keeps previous error results stable and does not mutate valid input', () => {
  const previous = validate(null);
  const snapshot = JSON.stringify(previous);
  const input = copySeed();
  const before = JSON.stringify(input);
  expect(validate(input).ok).toBe(true);
  expect(JSON.stringify(input)).toBe(before);
  expect(JSON.stringify(previous)).toBe(snapshot);
});
