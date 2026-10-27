import type { FilterSeed } from '../../src/domain/filters/types.ts';
import { parseLutManifest, type LutManifest } from '../../src/rendering/assets/lutManifest.ts';
export { LUT_ENGINE_VERSION, LUT_GENERATOR_VERSION, type LutAsset, type LutManifest } from '../../src/rendering/assets/lutManifest.ts';

/** CLI seed linkage; the format parser is shared with the mobile loader without Ajv/Node imports. */
export function assertLutManifest(input: unknown, seed: FilterSeed, seedHash: string): asserts input is LutManifest {
  const lookVersions = new Map<string, string>([['identity', '0.1.0-draft']]);
  for (const collection of seed.collections) {
    const filter = seed.filters.find(item => item.id === collection.representativeId);
    if (!filter) throw new Error(`Missing representative ${collection.representativeId}`);
    lookVersions.set(filter.id, filter.lookVersion);
  }
  const manifest = parseLutManifest(input, { sourceSeedSha256: seedHash, lookVersions });
  if (manifest.renderContractVersion !== seed.renderContractVersion) {
    throw new Error('Manifest does not match the source seed render contract');
  }
}
