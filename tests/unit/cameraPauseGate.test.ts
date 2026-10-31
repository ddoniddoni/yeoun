import { CameraPauseGate } from '../../src/platform/camera/pauseGate';
test('waits for a native stop and releases all pending waiters', async () => {
  const gate = new CameraPauseGate(); gate.setRunning(true);
  const ready = jest.fn(); const one = gate.wait().then(ready); const two = gate.wait().then(ready);
  await Promise.resolve(); expect(ready).not.toHaveBeenCalled();
  gate.setRunning(false); await Promise.all([one, two]); expect(ready).toHaveBeenCalledTimes(2);
  await expect(gate.wait()).resolves.toBeUndefined();
});
test('missing native stop rejects instead of letting a decoder run alongside camera resources', async () => {
  jest.useFakeTimers();
  try {
    const gate = new CameraPauseGate(); gate.setRunning(true);
    const result = expect(gate.wait()).rejects.toThrow('카메라');
    jest.advanceTimersByTime(5000); await result;
    gate.setRunning(false); await expect(gate.wait()).resolves.toBeUndefined();
  } finally { jest.useRealTimers(); }
});
