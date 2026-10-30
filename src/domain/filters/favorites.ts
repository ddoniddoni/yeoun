import { CAMERA_FILTERS, type CameraFilterId } from './cameraSettings';

export type FavoriteFilterId = Exclude<CameraFilterId, 'original'>;
export function isFavoriteFilterId(id: unknown): id is FavoriteFilterId {
  return typeof id === 'string' && id !== 'original' && CAMERA_FILTERS.some(filter => filter.id === id);
}

// Unknown IDs may belong to a newer catalog. Hide them without deleting their stored rows.
export function availableFavorites(ids: readonly unknown[]): readonly FavoriteFilterId[] {
  return Object.freeze([...new Set(ids.filter(isFavoriteFilterId))]);
}

export interface FavoritesRepository {
  list(): Promise<readonly FavoriteFilterId[]>;
  set(id: FavoriteFilterId, favorite: boolean): Promise<readonly FavoriteFilterId[]>;
}
export type FavoritesState = Readonly<{
  ids: readonly FavoriteFilterId[];
  phase: 'loading' | 'ready' | 'saving' | 'error';
  error?: string;
}>;

/** One app-session store. Confirmed disk state only; never changes camera settings. */
export class FavoritesStore {
  private state: FavoritesState = { ids: Object.freeze([]), phase: 'loading' };
  private listeners = new Set<() => void>();
  private pending = false;
  constructor(private repository: FavoritesRepository) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(state: FavoritesState) {
    this.state = Object.freeze(state);
    this.listeners.forEach(listener => listener());
  }
  load = async (): Promise<void> => {
    if (this.pending) return;
    this.pending = true;
    this.publish({ ids: this.state.ids, phase: 'loading' });
    try {
      const ids = await this.repository.list();
      this.publish({ ids: availableFavorites(ids), phase: 'ready' });
    } catch {
      this.publish({ ids: this.state.ids, phase: 'error', error: '즐겨찾기를 불러오지 못했어요.' });
    } finally { this.pending = false; }
  };
  toggle = async (id: CameraFilterId): Promise<'saved' | 'ignored' | 'failed'> => {
    if (this.pending || this.state.phase !== 'ready' || !isFavoriteFilterId(id)) return 'ignored';
    const ids = this.state.ids;
    this.pending = true;
    this.publish({ ids, phase: 'saving' });
    try {
      const saved = await this.repository.set(id, !ids.includes(id));
      this.publish({ ids: availableFavorites(saved), phase: 'ready' });
      return 'saved';
    } catch {
      // A failed/uncertain write must be re-read before another mutation, never shown as saved.
      this.publish({ ids, phase: 'error', error: '즐겨찾기 변경을 확인하지 못했어요. 다시 불러와 주세요.' });
      return 'failed';
    } finally { this.pending = false; }
  };
}
