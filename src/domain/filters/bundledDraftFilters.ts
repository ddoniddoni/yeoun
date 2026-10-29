import type { DraftFilter, FilterSeed } from './types.ts';

/** Original collections keep their representatives; the user-requested scope adds four retro drafts. */
export function bundledDraftFilters(seed: FilterSeed): readonly DraftFilter[] {
  const ids = new Set(seed.collections.map(collection => collection.representativeId));
  return seed.filters.filter(filter => ids.has(filter.id) || filter.collection === 'retro');
}
