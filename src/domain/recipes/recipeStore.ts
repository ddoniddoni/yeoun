import { recipeName, serializeRecipe, type Recipe, type RecipeDraft, type RecipeFingerprint } from './recipe';
import type { CameraSettings } from '../filters/cameraSettings';

export interface RecipesRepository {
  list(): Promise<readonly Recipe[]>;
  create(draft: RecipeDraft): Promise<readonly Recipe[]>;
  rename(id: string, name: string): Promise<readonly Recipe[]>;
  remove(id: string): Promise<readonly Recipe[]>;
}
export type RecipesState = Readonly<{
  items: readonly Recipe[]; phase: 'loading' | 'ready' | 'saving' | 'error'; error?: string;
}>;
export type RecipeMutation = 'saved' | 'ignored' | 'failed';

/** Shared confirmed state; a failed or ambiguous write requires a reload before more writes. */
export class RecipesStore {
  private state: RecipesState = Object.freeze({ items: Object.freeze([]), phase: 'loading' });
  private listeners = new Set<() => void>();
  private pending = false;
  constructor(private repository: RecipesRepository, private fingerprint: RecipeFingerprint,
    private id: () => string, private now = () => new Date().toISOString()) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(state: RecipesState) {
    this.state = Object.freeze({ ...state, items: Object.freeze([...state.items]) });
    this.listeners.forEach(listener => listener());
  }
  load = async (): Promise<void> => {
    if (this.pending) return;
    this.pending = true;
    this.publish({ items: this.state.items, phase: 'loading' });
    try { this.publish({ items: await this.repository.list(), phase: 'ready' }); }
    catch { this.publish({ items: this.state.items, phase: 'error', error: '내 색감을 불러오지 못했어요. 다시 불러와 주세요' }); }
    finally { this.pending = false; }
  };
  private async mutate(write: () => Promise<readonly Recipe[]>): Promise<RecipeMutation> {
    if (this.pending || this.state.phase !== 'ready') return 'ignored';
    this.pending = true;
    const items = this.state.items;
    this.publish({ items, phase: 'saving' });
    try {
      this.publish({ items: await write(), phase: 'ready' });
      return 'saved';
    } catch {
      this.publish({ items, phase: 'error', error: '변경을 확인하지 못했어요. 다시 불러와 저장된 목록을 확인해 주세요' });
      return 'failed';
    } finally { this.pending = false; }
  }
  create = (name: string, settings: CameraSettings): Promise<RecipeMutation> => {
    // Snapshot synchronously before an asynchronous database write can begin.
    const cleanName = recipeName(name), payload = serializeRecipe(settings, this.fingerprint);
    return this.mutate(() => this.repository.create({ id: this.id(), name: cleanName, payload, createdAt: this.now() }));
  };
  rename = (id: string, name: string): Promise<RecipeMutation> => {
    const cleanName = recipeName(name);
    return this.mutate(() => this.repository.rename(id, cleanName));
  };
  remove = (id: string): Promise<RecipeMutation> => this.mutate(() => this.repository.remove(id));
}
