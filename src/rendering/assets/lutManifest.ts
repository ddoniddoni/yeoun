import { LUT_CONTRACT } from '../reference/lutAtlas.ts';
import type { LutContract } from '../../domain/filters/types.ts';

// Authoring/atlas version, distinct from the Skia backend version.
export const LUT_ENGINE_VERSION = 'lut-authoring-0.1.0';
export const LUT_GENERATOR_VERSION = '1.0.0';
export type LutAsset = Readonly<{
  filterId: string; role: 'identity' | 'look'; lookVersion: string;
  status: 'draft'; path: string; sha256: string;
}>;
export type LutManifest = Readonly<{
  schemaVersion: 1; status: 'draft'; renderContractVersion: '0.1.0';
  engineVersion: typeof LUT_ENGINE_VERSION; generatorVersion: typeof LUT_GENERATOR_VERSION;
  sourceSeedSha256: string;
  encoder: Readonly<{ pngjs: '7.0.0'; node: string; zlib: string }>;
  lutContract: LutContract; assets: readonly LutAsset[];
}>;
export type LutManifestExpectation = Readonly<{
  sourceSeedSha256: string;
  lookVersions: ReadonlyMap<string, string>;
}>;

function object(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid LUT manifest ${label}`);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(record, key))) {
    throw new Error(`Invalid LUT manifest fields: ${label}`);
  }
  return record;
}
function string(value: unknown, pattern: RegExp, label: string): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error(`Invalid LUT manifest ${label}`);
  return value;
}
const hashPattern = /^[a-f0-9]{64}$/;

/** Pure, shared parser for CLI and mobile. Returns a frozen snapshot, not the caller's JSON. */
export function parseLutManifest(value: unknown, expected: LutManifestExpectation): LutManifest {
  const input = object(value, ['schemaVersion', 'status', 'renderContractVersion', 'engineVersion',
    'generatorVersion', 'sourceSeedSha256', 'encoder', 'lutContract', 'assets'], 'root');
  if (input.schemaVersion !== 1 || input.status !== 'draft' || input.renderContractVersion !== '0.1.0' ||
      input.engineVersion !== LUT_ENGINE_VERSION || input.generatorVersion !== LUT_GENERATOR_VERSION) {
    throw new Error('Invalid or unsupported LUT manifest version/status');
  }
  const seedHash = string(input.sourceSeedSha256, hashPattern, 'seed hash');
  if (seedHash !== expected.sourceSeedSha256) throw new Error('Manifest does not match the source seed bytes');
  const encoder = object(input.encoder, ['pngjs', 'node', 'zlib'], 'encoder');
  if (encoder.pngjs !== '7.0.0') throw new Error('Invalid LUT encoder version');
  const node = string(encoder.node, /[\s\S]+/, 'node version');
  const zlib = string(encoder.zlib, /[\s\S]+/, 'zlib version');
  const contract = object(input.lutContract, Object.keys(LUT_CONTRACT), 'lutContract');
  if (Object.entries(LUT_CONTRACT).some(([key, expectedValue]) => contract[key] !== expectedValue)) {
    throw new Error('Invalid LUT atlas contract');
  }
  if (!Array.isArray(input.assets) || input.assets.length !== expected.lookVersions.size || expected.lookVersions.size < 2 ||
      expected.lookVersions.get('identity') !== '0.1.0-draft') {
    throw new Error('Manifest must include identity and exactly the registered looks');
  }
  const seen = new Set<string>();
  const assets = input.assets.map((item: unknown): LutAsset => {
    const asset = object(item, ['filterId', 'role', 'lookVersion', 'status', 'path', 'sha256'], 'asset');
    const filterId = string(asset.filterId, /^(identity|(light|time|scene|retro)-[a-z]+)$/, 'filter ID');
    const sha256 = string(asset.sha256, hashPattern, 'checksum');
    if ((asset.lookVersion !== '0.1.0-draft' && asset.lookVersion !== '0.2.0-draft' && asset.lookVersion !== '0.3.0-draft' && asset.lookVersion !== '0.4.0-draft' && asset.lookVersion !== '0.5.0-draft') || asset.status !== 'draft') {
      throw new Error('Invalid LUT look version/status');
    }
    if (seen.has(filterId) || expected.lookVersions.get(filterId) !== asset.lookVersion) {
      throw new Error(`Duplicate, unexpected or mismatched LUT version: ${filterId}`);
    }
    seen.add(filterId);
    const role = filterId === 'identity' ? 'identity' : 'look';
    const path = `luts/${filterId}-${sha256}.png`;
    if (asset.role !== role || asset.path !== path) throw new Error(`Invalid role or content-addressed path: ${filterId}`);
    return Object.freeze({ filterId, sha256, path, role, lookVersion: asset.lookVersion, status: asset.status });
  });
  return Object.freeze({
    schemaVersion: 1, status: 'draft', renderContractVersion: '0.1.0',
    engineVersion: LUT_ENGINE_VERSION, generatorVersion: LUT_GENERATOR_VERSION, sourceSeedSha256: seedHash,
    encoder: Object.freeze({ pngjs: '7.0.0', node, zlib }), lutContract: LUT_CONTRACT, assets: Object.freeze(assets),
  });
}
