import { cameraSettingsKey, copyCameraSettings, type CameraSettings } from './cameraSettings';
import { defaultRememberedCamera, parseCameraMemory, serializeCameraMemory, type RememberedCamera, type SettingsFingerprint } from './cameraMemory';

export interface CameraMemoryRepository {
  read(): Promise<string | null>;
  write(raw: string): Promise<void>;
}
export type CameraMemoryState = Readonly<{
  startup: 'loading' | 'failed' | 'ready'; camera: RememberedCamera;
  remember: boolean | null; saving: boolean; switching: boolean; error?: string;
}>;

/** Camera-only working settings. Result editing and recovery never write into this store. */
export class CameraMemoryStore {
  private state: CameraMemoryState = Object.freeze({ startup: 'loading', camera: defaultRememberedCamera(),
    remember: null, saving: false, switching: false });
  private listeners = new Set<() => void>();
  private loading = false;
  private suspended = false;
  private queued: string | undefined;
  private drainPromise: Promise<void> | undefined;
  constructor(private repository: CameraMemoryRepository, private fingerprint: SettingsFingerprint) {}
  getSnapshot = () => this.state;
  getStartup = () => this.state.startup;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(change: Partial<CameraMemoryState>) {
    this.state = Object.freeze({ ...this.state, ...change });
    this.listeners.forEach(listener => listener());
  }
  load = async (): Promise<void> => {
    if (this.loading || this.state.startup === 'ready') return;
    this.loading = true;
    this.publish({ startup: 'loading', error: undefined });
    try {
      const value = parseCameraMemory(await this.repository.read(), this.fingerprint);
      this.suspended = false;
      this.publish({ startup: 'ready', remember: value.remember,
        camera: value.remember ? value.camera : defaultRememberedCamera() });
    } catch {
      this.suspended = true;
      this.publish({ startup: 'failed', remember: null,
        error: '보관한 촬영 설정을 읽지 못했어요. 현재 설정을 기억할지 다시 선택해 주세요' });
    } finally { this.loading = false; }
  };
  useDefaults = () => {
    if (this.state.startup !== 'failed' || this.loading) return;
    // No write: preserve an unsupported or unreadable record until explicit user choice.
    this.publish({ startup: 'ready', camera: defaultRememberedCamera() });
  };
  setSettings = (settings: CameraSettings): boolean => {
    if (this.state.startup !== 'ready' || this.state.switching) return false;
    const next = copyCameraSettings(settings);
    if (cameraSettingsKey(next) === cameraSettingsKey(this.state.camera.settings)) return false;
    this.publish({ camera: Object.freeze({ ...this.state.camera, settings: next }) });
    this.saveLatest();
    return true;
  };
  toggleGrid = () => {
    if (this.state.startup !== 'ready' || this.state.switching) return;
    this.publish({ camera: Object.freeze({ ...this.state.camera, grid: !this.state.camera.grid }) });
    this.saveLatest();
  };
  private saveLatest() {
    if (this.state.remember !== true || this.suspended) return;
    try {
      this.queued = serializeCameraMemory({ remember: true, camera: this.state.camera }, this.fingerprint);
    } catch { this.failAutomaticSave(); return; }
    // Start on the next microtask; retain only the latest snapshot awaiting a write.
    if (!this.drainPromise) this.drainPromise = Promise.resolve().then(() => this.drain());
  }
  private failAutomaticSave() {
    this.suspended = true; this.queued = undefined;
    this.publish({ error: '마지막 설정을 저장하지 못했어요. 현재 촬영은 계속할 수 있어요' });
  }
  private async drain(): Promise<void> {
    this.publish({ saving: true });
    try {
      while (this.queued !== undefined && !this.suspended) {
        const raw = this.queued; this.queued = undefined;
        await this.repository.write(raw);
      }
    } catch { this.failAutomaticSave(); }
    finally {
      this.drainPromise = undefined;
      this.publish({ saving: false });
    }
  }
  setRemember = async (remember: boolean): Promise<void> => {
    if (this.state.startup !== 'ready' || this.state.switching) return;
    this.publish({ switching: true });
    try {
      // An older enabled snapshot must never run after the user's disable operation.
      await this.drainPromise;
      const value = remember ? { remember: true as const, camera: this.state.camera } : { remember: false as const };
      await this.repository.write(serializeCameraMemory(value, this.fingerprint));
      this.suspended = false;
      this.publish({ remember, error: undefined });
    } catch {
      this.suspended = true; this.queued = undefined;
      this.publish({ remember: null, error: '설정 기억 변경을 확인하지 못했어요. 다시 선택해 주세요' });
    } finally { this.publish({ switching: false }); }
  };
}
