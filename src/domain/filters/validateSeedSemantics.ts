import { COLLECTION_IDS, type CollectionId, type DraftFilter, type FilterSeed, type FilterSeedIssue } from './types.ts';

export const SUPPORTED_RENDER_CONTRACT_VERSION = '0.1.0';

/** Only call after the authoring JSON Schema has accepted the input's structure. */
export function validateSeedSemantics(seed: FilterSeed): readonly FilterSeedIssue[] {
  const issues: FilterSeedIssue[] = [];
  const report = (code: string, path: string, message: string) => {
    issues.push({ kind: 'semantic', code, path, message });
  };

  if (seed.renderContractVersion !== SUPPORTED_RENDER_CONTRACT_VERSION) {
    report('unsupported-render-contract', '/renderContractVersion',
      `지원하는 렌더링 계약은 ${SUPPORTED_RENDER_CONTRACT_VERSION}입니다.`);
  }

  const collectionIds = new Set<CollectionId>();
  seed.collections.forEach((collection, index) => {
    if (collectionIds.has(collection.id)) {
      report('duplicate-collection-id', `/collections/${index}/id`, '컬렉션 ID가 중복되었습니다.');
    }
    collectionIds.add(collection.id);
  });
  for (const id of COLLECTION_IDS) {
    if (!collectionIds.has(id)) {
      report('missing-collection', '/collections', `${id} 컬렉션이 필요합니다.`);
    }
  }

  const filtersById = new Map<string, DraftFilter>();
  const counts: Record<CollectionId, number> = { light: 0, time: 0, scene: 0, retro: 0, portrait: 0, food: 0 };
  seed.filters.forEach((filter, index) => {
    const path = `/filters/${index}`;
    if (filtersById.has(filter.id)) {
      report('duplicate-filter-id', `${path}/id`, '필터 ID가 중복되었습니다.');
    } else {
      filtersById.set(filter.id, filter);
    }
    counts[filter.collection] += 1;
    if (!collectionIds.has(filter.collection)) {
      report('missing-filter-collection', `${path}/collection`, '필터가 참조한 컬렉션이 없습니다.');
    }
    if (!filter.id.startsWith(`${filter.collection}-`)) {
      report('filter-collection-mismatch', `${path}/id`, '필터 ID 접두사와 컬렉션이 다릅니다.');
    }

    const curve = filter.authoring.toneCurve;
    // The interpolation domain must cover every encoded channel value in [0, 1].
    if (curve[0][0] !== 0 || curve[5][0] !== 1) {
      report('tone-curve-domain', `${path}/authoring/toneCurve`, '톤 곡선의 첫 x는 0, 마지막 x는 1이어야 합니다.');
    }
    curve.forEach(([x, y], pointIndex) => {
      const previous = curve[pointIndex - 1];
      if (!previous) return;
      if (x <= previous[0]) {
        report('tone-curve-x-order', `${path}/authoring/toneCurve/${pointIndex}/0`,
          '톤 곡선 x는 이전 점보다 커야 합니다.');
      }
      if (y < previous[1]) {
        report('tone-curve-y-order', `${path}/authoring/toneCurve/${pointIndex}/1`,
          '톤 곡선 y는 이전 점보다 작을 수 없습니다.');
      }
    });
  });

  for (const id of COLLECTION_IDS) {
    const expected = id === 'retro' ? 4 : id === 'portrait' || id === 'food' ? 2 : 3;
    if (counts[id] !== expected) {
      report('collection-filter-count', '/filters', `${id} 컬렉션에는 필터가 정확히 ${expected}개 필요합니다.`);
    }
  }
  seed.collections.forEach((collection, index) => {
    const representative = filtersById.get(collection.representativeId);
    const path = `/collections/${index}/representativeId`;
    if (!representative) {
      report('missing-representative', path, '대표 필터 ID가 필터 목록에 없습니다.');
    } else if (representative.collection !== collection.id) {
      report('representative-collection-mismatch', path, '대표 필터는 해당 컬렉션에 속해야 합니다.');
    }
  });
  return issues;
}
