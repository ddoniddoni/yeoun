import type { DraftFilter, FilterSeed } from './types.ts';

/** Every curated seed look is bundled; inclusion does not imply human color approval. */
export function bundledDraftFilters(seed: FilterSeed): readonly DraftFilter[] {
  return seed.filters;
}
