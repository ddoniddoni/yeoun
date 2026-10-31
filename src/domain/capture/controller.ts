import { assertGrainSeed, createGrainSeed } from '../filters/grainSeed';
import { cameraSettingsKey, copyCameraSettings, type CameraSettings } from '../filters/cameraSettings';
import { assertFlashMode, type PhotoFlashMode } from './flash';
import { copyExposure, type ExposureReading } from './metering';
import { localStampDate } from '../filters/retroControls';
export type Snapshot = Readonly<{
  id: string; settings: CameraSettings; position: 'front' | 'back'; capturedAt: string; grainSeed: number;
  flashMode: PhotoFlashMode; stampDate: number;
  sourceExposure?: ExposureReading;
}>;
export type ImportedPhotoInfo = Readonly<{ resized: boolean; flattened: boolean }>;
export type Draft = Readonly<{ sourceUri: string; width: number; height: number; orientation: string; mirrored: boolean;
  imported?: ImportedPhotoInfo }>;
export type SelectedPhoto = Readonly<{ uri: string }>;
export interface ImportPorts {
  pick(): Promise<SelectedPhoto | null>;
  prepare(photo: SelectedPhoto, snapshot: Snapshot): Promise<Draft>;
  release(photo: SelectedPhoto): Promise<void>;
}
export type Output = Readonly<{ uri: string; width: number; height: number; bytes: number }>;
export type SharePort = (output: Output, canPresent: () => boolean) => Promise<void>;
export type Phase = 'idle' | 'picking' | 'importing' | 'capturing' | 'rendering' | 'file-ready' | 'saving-gallery' | 'saved' | 'failed' | 'cancelled';
export type CaptureState = Readonly<{
  phase: Phase; output?: Output; message?: string; canRetryRender?: boolean;
  original?: Output; preparingOriginal?: boolean; originalError?: string;
  outputSettings?: CameraSettings; editing?: boolean; editError?: string;
  sharing?: boolean; shareError?: string;
  imported?: ImportedPhotoInfo;
}>;
export interface CapturePorts {
  capture(snapshot: Snapshot): Promise<Draft>;
  // Each positive revision must write a distinct file, never overwrite an accepted output.
  render(draft: Draft, snapshot: Snapshot, revision?: number): Promise<Output>;
  renderOriginal(draft: Draft, snapshot: Snapshot): Promise<Output>;
  save(output: Output): Promise<void>;
  remove(uri: string): Promise<void>;
}
// Owns source, export, optional comparison and one in-flight operation; no native objects in state.
export class CaptureController {
  state: CaptureState = { phase: 'idle' };
  private busy = false;
  private epoch = 0;
  private closed = false;
  private draft?: Draft;
  private snapshot?: Snapshot;
  private output?: Output;
  private original?: Output;
  private revision = 0;
  constructor(private ports: CapturePorts, private notify: (state: CaptureState) => void) {}
  private emit(state: CaptureState) {
    this.state = this.draft?.imported ? { ...state, imported: this.draft.imported } : state;
    if (!this.closed) this.notify(this.state);
  }
  interrupt() { this.epoch++; } // Native operations finish and release before their results are dropped.
  close() { this.closed = true; this.interrupt(); if (!this.busy) void this.clearFiles(); }
  private async clearFiles() {
    const uris = [this.draft?.sourceUri, this.output?.uri, this.original?.uri];
    this.draft = undefined; this.output = undefined; this.snapshot = undefined;
    this.original = undefined;
    this.revision = 0;
    await Promise.all(uris.filter((uri): uri is string => !!uri).map(uri => this.ports.remove(uri)));
  }
  async discard(): Promise<void> {
    if (this.busy || this.closed) return;
    this.busy = true;
    try { await this.clearFiles(); this.emit({ phase: 'idle' }); }
    finally { this.busy = false; }
  }
  async capture(settings: CameraSettings, position: 'front' | 'back', grainSeed = createGrainSeed(), flashMode: PhotoFlashMode = 'off', sourceExposure?: ExposureReading): Promise<void> {
    if (this.busy || this.closed || this.draft) return;
    this.busy = true;
    const epoch = this.epoch;
    try {
      assertGrainSeed(grainSeed);
      assertFlashMode(flashMode);
      const now = new Date();
      this.snapshot = Object.freeze({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        capturedAt: now.toISOString(), stampDate: localStampDate(now), position, grainSeed, flashMode,
        sourceExposure: sourceExposure ? copyExposure(sourceExposure) : undefined, settings: copyCameraSettings(settings) });
      this.emit({ phase: 'capturing' });
      this.draft = await this.ports.capture(this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'rendering' });
      this.output = await this.ports.render(this.draft, this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'file-ready', output: this.output, outputSettings: this.snapshot.settings });
    } catch (error) { this.emit({ phase: 'failed', message: String(error), canRetryRender: !!this.draft }); }
    finally { this.busy = false; if (this.closed) await this.clearFiles(); }
  }
  async importPhoto(settings: CameraSettings, ports: ImportPorts): Promise<void> {
    if (this.busy || this.closed || this.draft) return;
    this.busy = true;
    const epoch = this.epoch;
    let selected: SelectedPhoto | null = null;
    try {
      // The import date is not the original EXIF capture date. Stamping starts off.
      const frozenSettings = copyCameraSettings({ ...settings, dateStamp: false });
      this.emit({ phase: 'picking' });
      selected = await ports.pick();
      if (epoch !== this.epoch) { this.emit({ phase: 'cancelled' }); return; }
      if (!selected) { this.emit({ phase: 'idle' }); return; }
      const now = new Date();
      this.snapshot = Object.freeze({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        capturedAt: now.toISOString(), stampDate: localStampDate(now), position: 'back',
        grainSeed: createGrainSeed(), flashMode: 'off', settings: frozenSettings });
      this.emit({ phase: 'importing' });
      this.draft = await ports.prepare(selected, this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'rendering' });
      this.output = await this.ports.render(this.draft, this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'file-ready', output: this.output, outputSettings: this.snapshot.settings });
    } catch (error) {
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); }
      else this.emit({ phase: 'failed', message: this.draft ? '사진에 색감을 적용하지 못했어요. 보관한 사진으로 다시 시도해 주세요.'
        : error instanceof Error ? error.message : '사진을 가져오지 못했어요. 다시 골라 주세요.', canRetryRender: !!this.draft });
    } finally {
      // Picker cache ownership ends here; never delete a gallery asset or user-selected provider URI.
      try { if (selected) await ports.release(selected); }
      catch { console.warn('Picker cache cleanup failed; accepted photo retained.'); }
      finally { this.busy = false; if (this.closed) await this.clearFiles(); }
    }
  }
  async retryRender(): Promise<void> {
    if (this.busy || this.closed || !this.draft || !this.snapshot || this.output) return;
    this.busy = true;
    const epoch = this.epoch;
    try {
      this.emit({ phase: 'rendering' });
      this.output = await this.ports.render(this.draft, this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'file-ready', output: this.output, outputSettings: this.snapshot.settings });
    } catch (error) { this.emit({ phase: 'failed', message: String(error), canRetryRender: !!this.draft }); }
    finally { this.busy = false; if (this.closed) await this.clearFiles(); }
  }
  async prepareOriginal(): Promise<void> {
    if (this.busy || this.closed || !this.draft || !this.snapshot || !this.output || this.original ||
      this.state.outputSettings?.filterId === 'original' || this.state.outputSettings?.intensity === 0) return;
    this.busy = true;
    const epoch = this.epoch;
    this.emit({ ...this.state, preparingOriginal: true, originalError: undefined });
    try {
      const original = await this.ports.renderOriginal(this.draft, this.snapshot);
      if (epoch !== this.epoch) {
        await this.ports.remove(original.uri);
        this.emit({ ...this.state, preparingOriginal: false });
        return;
      }
      this.original = original;
      this.emit({ ...this.state, original, preparingOriginal: false });
    } catch {
      this.emit({ ...this.state, preparingOriginal: false,
        originalError: epoch === this.epoch ? '원본 비교를 준비하지 못했어요. 다시 시도해 주세요.' : undefined });
    } finally { this.busy = false; if (this.closed) await this.clearFiles(); }
  }
  async edit(settings: CameraSettings): Promise<boolean> {
    if (this.busy || this.closed || !this.draft || !this.snapshot || !this.output ||
      !this.state.outputSettings || this.state.phase === 'saved') return false;
    const currentSettings = this.state.outputSettings;
    this.busy = true;
    const epoch = this.epoch;
    let applied = false;
    this.emit({ ...this.state, editing: true, editError: undefined });
    try {
      const nextSettings = copyCameraSettings(settings);
      if (cameraSettingsKey(nextSettings) === cameraSettingsKey(currentSettings)) return true;
      // Keep the capture date, grain seed, camera position and exposure immutable.
      const nextSnapshot = Object.freeze({ ...this.snapshot, settings: nextSettings });
      const next = await this.ports.render(this.draft, nextSnapshot, ++this.revision);
      if (epoch !== this.epoch) {
        await this.ports.remove(next.uri);
        this.emit({ ...this.state, editError: '적용이 중단됐어요. 이전 사진을 유지했어요. 다시 적용해 주세요.' });
        return false;
      }
      const previous = this.output;
      this.output = next;
      applied = true;
      this.emit({ ...this.state, phase: 'file-ready', output: next, outputSettings: nextSettings,
        message: undefined, canRetryRender: undefined, shareError: undefined });
      // The accepted file is now owned by the controller; only the superseded file is removed.
      await this.ports.remove(previous.uri);
      return true;
    } catch {
      if (applied) console.warn('Previous photo cleanup failed; current result retained.');
      else this.emit({ ...this.state, editError: '색감을 적용하지 못했어요. 이전 사진은 유지돼요. 다시 시도해 주세요.' });
      return applied;
    } finally {
      this.busy = false;
      if (this.closed) await this.clearFiles();
      else this.emit({ ...this.state, editing: false });
    }
  }
  async save(): Promise<void> {
    if (this.busy || this.closed || !this.output || this.state.phase === 'saved') return;
    this.busy = true;
    try {
      this.emit({ ...this.state, phase: 'saving-gallery', output: this.output, message: undefined });
      await this.ports.save(this.output);
      this.emit({ ...this.state, phase: 'saved', output: this.output });
    } catch (error) {
      this.emit({ ...this.state, phase: 'failed', output: this.output, message: `저장 실패: ${String(error)}` });
    } finally { this.busy = false; if (this.closed) await this.clearFiles(); }
  }
  async share(present: SharePort): Promise<void> {
    if (this.busy || this.closed || !this.output) return;
    this.busy = true;
    const epoch = this.epoch;
    // Sharing does not change gallery success/failure, settings or the accepted output.
    this.emit({ ...this.state, sharing: true, shareError: undefined });
    try {
      await present(this.output, () => !this.closed && epoch === this.epoch);
      // Native completion does not prove delivery to a recipient. No success toast.
    } catch {
      if (epoch === this.epoch) this.emit({ ...this.state,
        shareError: '공유창을 열지 못했어요. 사진은 그대로 있어요. 다시 시도하거나 사진 저장을 이용해 주세요.' });
    } finally {
      this.busy = false;
      if (this.closed) await this.clearFiles();
      else this.emit({ ...this.state, sharing: false });
    }
  }
}
