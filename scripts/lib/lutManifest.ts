import Ajv2020 from 'ajv/dist/2020.js';
import type { FilterSeed, LutContract } from '../../src/domain/filters/types.ts';
import { LUT_CONTRACT } from '../../src/rendering/reference/lutAtlas.ts';

// Version only the analytic authoring + atlas path, not a complete camera rendering engine.
export const LUT_ENGINE_VERSION = 'lut-authoring-0.1.0';
export const LUT_GENERATOR_VERSION = '1.0.0';
export type LutAsset = Readonly<{
  filterId: string;
  role: 'identity' | 'look';
  lookVersion: string;
  status: 'draft';
  path: string;
  sha256: string;
}>;
export type LutManifest = Readonly<{
  schemaVersion: 1;
  status: 'draft';
  renderContractVersion: '0.1.0';
  engineVersion: typeof LUT_ENGINE_VERSION;
  generatorVersion: typeof LUT_GENERATOR_VERSION;
  sourceSeedSha256: string;
  encoder: Readonly<{ pngjs: '7.0.0'; node: string; zlib: string }>;
  lutContract: LutContract;
  assets: readonly LutAsset[];
}>;

const hashSchema = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const manifestSchema = {
  type: 'object', additionalProperties: false,
  required: ['schemaVersion', 'status', 'renderContractVersion', 'engineVersion', 'generatorVersion',
    'sourceSeedSha256', 'encoder', 'lutContract', 'assets'],
  properties: {
    schemaVersion: { const: 1 }, status: { const: 'draft' }, renderContractVersion: { const: '0.1.0' },
    engineVersion: { const: LUT_ENGINE_VERSION }, generatorVersion: { const: LUT_GENERATOR_VERSION },
    sourceSeedSha256: hashSchema,
    encoder: {
      type: 'object', additionalProperties: false, required: ['pngjs', 'node', 'zlib'],
      properties: { pngjs: { const: '7.0.0' }, node: { type: 'string', minLength: 1 }, zlib: { type: 'string', minLength: 1 } },
    },
    lutContract: {
      type: 'object', additionalProperties: false, required: Object.keys(LUT_CONTRACT),
      properties: Object.fromEntries(Object.entries(LUT_CONTRACT).map(([key, value]) => [key, { const: value }])),
    },
    assets: {
      type: 'array', minItems: 4, maxItems: 4,
      items: {
        type: 'object', additionalProperties: false,
        required: ['filterId', 'role', 'lookVersion', 'status', 'path', 'sha256'],
        properties: {
          filterId: { type: 'string', pattern: '^(identity|(light|time|scene)-[a-z]+)$' },
          role: { enum: ['identity', 'look'] }, lookVersion: { const: '0.1.0-draft' }, status: { const: 'draft' },
          path: { type: 'string', pattern: '^luts/(identity|(light|time|scene)-[a-z]+)-[a-f0-9]{64}\\.png$' },
          sha256: hashSchema,
        },
      },
    },
  },
};
const ajv = new Ajv2020({ strict: true, allErrors: true, ownProperties: true });
const validateStructure = ajv.compile<LutManifest>(manifestSchema);

/** Manifest format and references only; checksum/PNG bytes are checked by validateLutBundle. */
export function assertLutManifest(input: unknown, seed: FilterSeed, seedHash: string): asserts input is LutManifest {
  if (!validateStructure(input)) {
    throw new Error(`Invalid LUT draft manifest: ${ajv.errorsText(validateStructure.errors, { dataVar: 'manifest' })}`);
  }
  if (input.sourceSeedSha256 !== seedHash || input.renderContractVersion !== seed.renderContractVersion) {
    throw new Error('Manifest does not match the source seed bytes or render contract');
  }
  const expected = new Map<string, string>([['identity', '0.1.0-draft']]);
  for (const collection of seed.collections) {
    const filter = seed.filters.find(item => item.id === collection.representativeId);
    if (!filter) throw new Error(`Missing representative ${collection.representativeId}`);
    expected.set(filter.id, filter.lookVersion);
  }
  const seen = new Set<string>();
  for (const asset of input.assets) {
    if (seen.has(asset.filterId) || expected.get(asset.filterId) !== asset.lookVersion) {
      throw new Error(`Duplicate, unexpected or mismatched LUT version: ${asset.filterId}`);
    }
    seen.add(asset.filterId);
    if (asset.role !== (asset.filterId === 'identity' ? 'identity' : 'look') ||
        asset.path !== `luts/${asset.filterId}-${asset.sha256}.png`) {
      throw new Error(`Invalid role or content-addressed path: ${asset.filterId}`);
    }
  }
  if (seen.size !== expected.size) throw new Error('Manifest must include identity and the three representatives');
}
