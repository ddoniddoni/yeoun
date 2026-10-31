// Wait for an observed native stop, not a fixed delay before allocating image resources.
export class CameraPauseGate {
  private running = false;
  private waiting = new Set<() => void>();
  setRunning(running: boolean) {
    this.running = running;
    if (!running) for (const resolve of [...this.waiting]) resolve();
  }
  async wait(): Promise<void> {
    if (!this.running) return;
    await new Promise<void>((resolve, reject) => {
      const done = () => { clearTimeout(timer); this.waiting.delete(done); resolve(); };
      const timer = setTimeout(() => {
        this.waiting.delete(done);
        reject(new Error('카메라가 아직 정리 중이에요. 잠시 뒤 사진을 다시 골라 주세요.'));
      }, 5000);
      this.waiting.add(done);
    });
  }
}
