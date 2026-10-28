import { clampExposure, type ExposureRange, type ExposureReading, type ExposureUnit, type UnitPoint } from './metering';

export type MeteringState = Readonly<{
  deviceId: string; ready: boolean; busy: boolean; exposure?: number; range?: ExposureRange;
  unit?: ExposureUnit;
  focusSupported?: boolean; focusPoint?: UnitPoint; message?: string; error?: string;
}>;
export interface MeteringPort {
  range?: ExposureRange;
  unit: ExposureUnit;
  focusSupported: boolean;
  resetFocus(): Promise<void>;
  focus(point: UnitPoint): Promise<void>;
  setExposure(value: number): Promise<number>;
}

/** Serializes native changes, including resume, and drops obsolete completion messages. */
export class MeteringSession {
  state: MeteringState;
  private epoch = 0;
  private tail: Promise<void> = Promise.resolve();
  private port?: MeteringPort;
  constructor(private deviceId: string, private notify: (state: MeteringState) => void) {
    this.state = { deviceId, ready: false, busy: false };
  }
  private emit(state: MeteringState) { this.state = state; this.notify(state); }
  stop(notify = true) {
    this.epoch++; this.port = undefined;
    const state = { deviceId: this.deviceId, ready: false, busy: false };
    if (notify) this.emit(state); else this.state = state;
  }
  start(factory: () => MeteringPort): Promise<void> {
    const epoch = ++this.epoch;
    this.port = undefined;
    this.emit({ deviceId: this.deviceId, ready: false, busy: true, message: '초점·노출 준비 중…' });
    this.tail = this.tail.then(async () => {
      if (epoch !== this.epoch) return;
      try {
        const port = factory();
        if (port.focusSupported) await port.resetFocus();
        if (epoch !== this.epoch) return;
        const exposure = port.range ? await port.setExposure(0) : 0;
        if (epoch !== this.epoch) return;
        this.port = port;
        this.emit({ deviceId: this.deviceId, ready: true, busy: false, exposure,
          range: port.range, unit: port.unit, focusSupported: port.focusSupported });
      } catch {
        if (epoch === this.epoch) this.emit({ deviceId: this.deviceId, ready: false, busy: false,
          error: '초점·노출을 준비하지 못했어요. 다시 연결해 주세요.' });
      }
    });
    return this.tail;
  }
  private change(kind: 'focus' | 'exposure', operation: (port: MeteringPort) => Promise<number | undefined>, point?: UnitPoint): Promise<void> {
    const port = this.port;
    if (!port || !this.state.ready || this.state.busy) return Promise.resolve();
    const epoch = this.epoch;
    this.emit({ ...this.state, busy: true, error: undefined, focusPoint: point,
      message: kind === 'focus' ? '초점을 맞추고 있어요…' : '노출을 적용하고 있어요…' });
    this.tail = this.tail.then(async () => {
      if (epoch !== this.epoch) return;
      try {
        const exposure = await operation(port);
        if (epoch !== this.epoch) return;
        this.emit({ ...this.state, busy: false, exposure: exposure ?? this.state.exposure,
          message: kind === 'focus' ? '초점 요청 완료 · 잠시 후 자동 초점으로 돌아가요.' : undefined });
      } catch {
        if (epoch !== this.epoch) return;
        this.emit({ ...this.state, busy: false, message: undefined, focusPoint: undefined,
          ready: kind === 'focus', exposure: kind === 'focus' ? this.state.exposure : undefined,
          error: kind === 'focus' ? '초점을 맞추지 못했어요. 다른 위치를 눌러 주세요.'
            : '노출을 확인하지 못했어요. 다시 연결하면 기본 밝기로 돌아가요.' });
      }
    });
    return this.tail;
  }
  focus(point: UnitPoint) {
    if (!this.state.focusSupported) return Promise.resolve();
    return this.change('focus', async port => { await port.focus(point); return undefined; }, point);
  }
  expose(value: number) {
    const range = this.state.range;
    if (!range) return Promise.resolve();
    return this.change('exposure', port => port.setExposure(clampExposure(value, range)));
  }
  captureExposure(): ExposureReading | undefined {
    if (!this.state.ready || this.state.busy || this.state.exposure === undefined || !this.state.unit) return;
    return { value: this.state.exposure, unit: this.state.unit };
  }
}
