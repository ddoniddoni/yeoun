import { MeteringSession, type MeteringPort, type MeteringState } from '../../src/domain/capture/meteringSession';

function setup() {
  const states: MeteringState[] = [];
  const port: jest.Mocked<MeteringPort> = { range: { min: -2, max: 2 }, unit: 'ev', focusSupported: true,
    resetFocus: jest.fn().mockResolvedValue(undefined), focus: jest.fn().mockResolvedValue(undefined),
    setExposure: jest.fn(async (value: number) => value) };
  const session = new MeteringSession('back', state => states.push(state));
  return { session, states, port };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

test('initialization resets native focus/exposure; capture waits for applied values and duplicate taps do not queue', async () => {
  const { session, port } = setup();
  await session.start(() => port);
  expect(port.resetFocus).toHaveBeenCalledTimes(1);
  const pending = deferred<number>(); port.setExposure.mockReturnValueOnce(pending.promise);
  const change = session.expose(99);
  expect(session.captureExposure()).toBeUndefined();
  await session.expose(-99);
  await Promise.resolve();
  expect(port.setExposure).toHaveBeenLastCalledWith(2);
  pending.resolve(2); await change;
  expect(session.captureExposure()).toEqual({ value: 2, unit: 'ev' });
  expect(port.setExposure).toHaveBeenCalledTimes(2);
});
test('stop suppresses late completion; resume waits for the old operation before resetting exposure', async () => {
  const { session, port } = setup(); await session.start(() => port);
  const pending = deferred<number>(); port.setExposure.mockReturnValueOnce(pending.promise);
  const old = session.expose(1); await Promise.resolve();
  session.stop();
  const resume = session.start(() => port);
  expect(session.state.ready).toBe(false);
  pending.resolve(1); await old; await resume;
  expect(session.captureExposure()).toEqual({ value: 0, unit: 'ev' });
  expect(port.setExposure.mock.calls.map(call => call[0])).toEqual([0, 1, 0]);
});
test('exposure failure revokes capture readiness until reconnect; focus failure preserves known exposure', async () => {
  const { session, port } = setup(); await session.start(() => port);
  port.focus.mockRejectedValueOnce(new Error('timeout'));
  await session.focus({ x: 0.3, y: 0.4 });
  expect(session.state.error).toBeDefined();
  expect(session.captureExposure()).toEqual({ value: 0, unit: 'ev' });
  port.setExposure.mockRejectedValueOnce(new Error('interrupted'));
  await session.expose(1);
  expect(session.captureExposure()).toBeUndefined();
  await session.start(() => port);
  expect(session.captureExposure()?.value).toBe(0);
});
test('unsupported devices remain usable without invoking unsupported native methods', async () => {
  const { session, port } = setup(); port.range = undefined; port.focusSupported = false; port.unit = 'step';
  await session.start(() => port); await session.focus({ x: 0.5, y: 0.5 }); await session.expose(1);
  expect(port.resetFocus).not.toHaveBeenCalled(); expect(port.focus).not.toHaveBeenCalled(); expect(port.setExposure).not.toHaveBeenCalled();
  expect(session.captureExposure()).toEqual({ value: 0, unit: 'step' });
});
