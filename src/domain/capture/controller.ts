import { ENGINE_VERSION, LOOK_VERSION, matrixFor, type TestLook } from '../filters/testFilter';
export type Snapshot = Readonly<{
  id: string; look: TestLook; matrix: readonly number[]; engineVersion: string;
  lookVersion: string; position: 'front' | 'back'; capturedAt: string;
}>;
export type Draft = Readonly<{ sourceUri: string; width: number; height: number; orientation: string; mirrored: boolean }>;
export type Output = Readonly<{ uri: string; width: number; height: number; bytes: number }>;
export type Phase = 'idle' | 'capturing' | 'rendering' | 'file-ready' | 'saving-gallery' | 'saved' | 'failed' | 'cancelled';
export type CaptureState = Readonly<{ phase: Phase; output?: Output; message?: string; canRetryRender?: boolean }>;
export interface CapturePorts {
  capture(snapshot: Snapshot): Promise<Draft>;
  render(draft: Draft, snapshot: Snapshot): Promise<Output>;
  save(output: Output): Promise<void>;
  remove(uri: string): Promise<void>;
}
// Owns one draft, one export and one in-flight operation; no native objects in state.
export class CaptureController {
  state: CaptureState = { phase: 'idle' };
  private busy = false;
  private epoch = 0;
  private closed = false;
  private draft?: Draft;
  private snapshot?: Snapshot;
  private output?: Output;
  constructor(private ports: CapturePorts, private notify: (state: CaptureState) => void) {}
  private emit(state: CaptureState) { this.state = state; if (!this.closed) this.notify(state); }
  interrupt() { this.epoch++; } // Native operations finish and release before their results are dropped.
  close() { this.closed = true; this.interrupt(); if (!this.busy) void this.clearFiles(); }
  private async clearFiles() {
    const uris = [this.draft?.sourceUri, this.output?.uri];
    this.draft = undefined; this.output = undefined; this.snapshot = undefined;
    await Promise.all(uris.filter((uri): uri is string => !!uri).map(uri => this.ports.remove(uri)));
  }
  async discard(): Promise<void> {
    if (this.busy) return;
    await this.clearFiles(); this.emit({ phase: 'idle' });
  }
  async capture(look: TestLook, position: 'front' | 'back'): Promise<void> {
    if (this.busy || this.closed || this.draft) return;
    this.busy = true;
    const epoch = this.epoch;
    this.snapshot = Object.freeze({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      capturedAt: new Date().toISOString(), look, position,
      matrix: Object.freeze(matrixFor(look)), engineVersion: ENGINE_VERSION, lookVersion: LOOK_VERSION });
    try {
      this.emit({ phase: 'capturing' });
      this.draft = await this.ports.capture(this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'rendering' });
      this.output = await this.ports.render(this.draft, this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'file-ready', output: this.output });
    } catch (error) { this.emit({ phase: 'failed', message: String(error), canRetryRender: !!this.draft }); }
    finally { this.busy = false; if (this.closed) await this.clearFiles(); }
  }
  async retryRender(): Promise<void> {
    if (this.busy || this.closed || !this.draft || !this.snapshot || this.output) return;
    this.busy = true;
    const epoch = this.epoch;
    try {
      this.emit({ phase: 'rendering' });
      this.output = await this.ports.render(this.draft, this.snapshot);
      if (epoch !== this.epoch) { await this.clearFiles(); this.emit({ phase: 'cancelled' }); return; }
      this.emit({ phase: 'file-ready', output: this.output });
    } catch (error) { this.emit({ phase: 'failed', message: String(error), canRetryRender: !!this.draft }); }
    finally { this.busy = false; if (this.closed) await this.clearFiles(); }
  }
  async save(): Promise<void> {
    if (this.busy || this.closed || !this.output || this.state.phase === 'saved') return;
    this.busy = true;
    try {
      this.emit({ phase: 'saving-gallery', output: this.output });
      await this.ports.save(this.output);
      this.emit({ phase: 'saved', output: this.output });
    } catch (error) {
      this.emit({ phase: 'failed', output: this.output, message: `저장 실패: ${String(error)}` });
    } finally { this.busy = false; if (this.closed) await this.clearFiles(); }
  }
}
