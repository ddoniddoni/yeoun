export type AppearancePreference = 'system' | 'light' | 'dark';
export interface AppearanceRepository {
  read(): Promise<string | null>;
  write(raw: string): Promise<void>;
}
export function isAppearancePreference(value: unknown): value is AppearancePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}
export function parseAppearance(raw: string | null): AppearancePreference {
  if (raw === null) return 'system';
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('schemaVersion' in value) || value.schemaVersion !== 1
    || !('preference' in value) || !isAppearancePreference(value.preference)) throw new Error('APPEARANCE_FORMAT');
  return value.preference;
}
export function serializeAppearance(preference: AppearancePreference): string {
  if (!isAppearancePreference(preference)) throw new Error('APPEARANCE_PREFERENCE');
  return JSON.stringify({ schemaVersion: 1, preference });
}
export function resolveAppearance(preference: AppearancePreference, system: string | null | undefined): 'light' | 'dark' {
  return preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
}
export type AppearanceState = Readonly<{
  preference: AppearancePreference; loading: boolean; saving: boolean; error?: 'read' | 'write';
}>;

/** UI preference only: independent of camera settings, recipes and photo processing. */
export class AppearanceStore {
  private state: AppearanceState = Object.freeze({ preference: 'system', loading: true, saving: false });
  private reading = false;
  private loaded = false;
  private listeners = new Set<() => void>();
  constructor(private repository: AppearanceRepository) {}
  getSnapshot = () => this.state;
  getPreference = () => this.state.preference;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(change: Partial<AppearanceState>) {
    this.state = Object.freeze({ ...this.state, ...change });
    this.listeners.forEach(listener => listener());
  }
  load = async (): Promise<void> => {
    if (this.reading || this.loaded || this.state.saving) return;
    this.reading = true;
    this.publish({ loading: true, error: undefined });
    try {
      const preference = parseAppearance(await this.repository.read());
      this.loaded = true;
      this.publish({ preference, loading: false });
    } catch {
      // Leave unreadable/future data intact until an explicit selection.
      this.publish({ loading: false, error: 'read' });
    } finally { this.reading = false; }
  };
  select = async (preference: AppearancePreference): Promise<void> => {
    if (this.state.loading || this.state.saving || !isAppearancePreference(preference)) return;
    if (preference === this.state.preference && !this.state.error) return;
    this.loaded = true;
    // Show the chosen appearance immediately, but never imply it is saved before commit.
    this.publish({ preference, saving: true, error: undefined });
    try {
      await this.repository.write(serializeAppearance(preference));
      this.publish({ saving: false });
    } catch { this.publish({ saving: false, error: 'write' }); }
  };
}
