import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { CaptureController, type CapturePorts, type CaptureState, type Draft, type Output, type Snapshot } from '../../src/domain/capture/controller';
const draft: Draft = { sourceUri: 'file:///source.jpg', width: 4032, height: 3024, orientation: 'up', mirrored: false };
const output: Output = { uri: 'file:///filtered.jpg', width: 4032, height: 3024, bytes: 1234 };
function setup() {
  const states: CaptureState[] = [];
  const ports: jest.Mocked<CapturePorts> = { capture: jest.fn<Promise<Draft>, [Snapshot]>().mockResolvedValue(draft), render: jest.fn<Promise<Output>, [Draft, Snapshot]>().mockResolvedValue(output), save: jest.fn<Promise<void>, [Output]>().mockResolvedValue(undefined), remove: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined) };
  const controller = new CaptureController(ports, state => states.push(state));
  return { controller, ports, states };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
test('initial state is idle; export does not report gallery success', async () => {
  const { controller, ports, states } = setup(); expect(controller.state.phase).toBe('idle');
  await controller.capture(cameraSettings('light-afternoon'), 'back');
  expect(states.map(s => s.phase)).toEqual(['capturing', 'rendering', 'file-ready']);
  expect(ports.save).not.toHaveBeenCalled();
  const snapshot = ports.capture.mock.calls[0]![0];
  expect(ports.render.mock.calls[0]![1]).toBe(snapshot); expect(Object.isFrozen(snapshot.settings)).toBe(true);
});
test('rapid capture taps do not queue extra photos', async () => {
  const { controller, ports } = setup(); const pending = deferred<Draft>(); ports.capture.mockReturnValueOnce(pending.promise);
  const first = controller.capture(cameraSettings('light-afternoon'), 'back'); await controller.capture(cameraSettings('original'), 'front');
  expect(ports.capture).toHaveBeenCalledTimes(1); pending.resolve(draft); await first;
});
test('saved appears only after gallery resolves, duplicate saves are ignored', async () => {
  const { controller, ports } = setup(); await controller.capture(cameraSettings('light-afternoon'), 'back');
  const pending = deferred<void>(); ports.save.mockReturnValueOnce(pending.promise);
  const save = controller.save(); await controller.save(); expect(controller.state.phase).toBe('saving-gallery');
  pending.resolve(); await save; await controller.save(); expect(controller.state.phase).toBe('saved'); expect(ports.save).toHaveBeenCalledTimes(1);
});
test('permission/save failure retains same output for retry without recapture', async () => {
  const { controller, ports } = setup(); await controller.capture(cameraSettings('light-afternoon'), 'back'); ports.save.mockRejectedValueOnce(new Error('denied'));
  await controller.save(); expect(controller.state.phase).toBe('failed'); expect(controller.state.output).toBe(output);
  await controller.save(); expect(controller.state.phase).toBe('saved'); expect(ports.capture).toHaveBeenCalledTimes(1);
});
test('render failure retains source and retries same snapshot', async () => {
  const { controller, ports } = setup(); ports.render.mockRejectedValueOnce(new Error('GPU allocation'));
  await controller.capture(cameraSettings('original'), 'back'); expect(controller.state.phase).toBe('failed');
  await controller.retryRender(); expect(controller.state.phase).toBe('file-ready'); expect(ports.capture).toHaveBeenCalledTimes(1);
  expect(ports.render.mock.calls[1]![1]).toBe(ports.render.mock.calls[0]![1]);
});
test('background during capture waits for native result then releases source', async () => {
  const { controller, ports } = setup(); const pending = deferred<Draft>(); ports.capture.mockReturnValueOnce(pending.promise);
  const capture = controller.capture(cameraSettings('light-afternoon'), 'back'); controller.interrupt(); pending.resolve(draft); await capture;
  expect(ports.render).not.toHaveBeenCalled(); expect(ports.remove).toHaveBeenCalledWith(draft.sourceUri); expect(controller.state.phase).toBe('cancelled');
});
test('background during rendering removes both files', async () => {
  const { controller, ports } = setup(); const pending = deferred<Output>(); ports.render.mockReturnValueOnce(pending.promise);
  const capture = controller.capture(cameraSettings('light-afternoon'), 'back'); await Promise.resolve(); controller.interrupt(); pending.resolve(output); await capture;
  expect(ports.remove.mock.calls).toEqual([[draft.sourceUri], [output.uri]]); expect(controller.state.phase).toBe('cancelled');
});
test('unmount does not publish stale results and does release resources', async () => {
  const { controller, ports, states } = setup(); const pending = deferred<Draft>(); ports.capture.mockReturnValueOnce(pending.promise);
  const capture = controller.capture(cameraSettings('light-afternoon'), 'back'); controller.close(); pending.resolve(draft); await capture;
  expect(states.map(s => s.phase)).toEqual(['capturing']); expect(ports.remove).toHaveBeenCalledWith(draft.sourceUri);
});
test('30 sequential jobs release session files, no false or duplicate gallery calls', async () => {
  const { controller, ports } = setup();
  for (let i = 0; i < 30; i++) { await controller.capture(cameraSettings('light-afternoon'), 'back'); await controller.save(); await controller.discard(); }
  expect(ports.capture).toHaveBeenCalledTimes(30); expect(ports.save).toHaveBeenCalledTimes(30); expect(ports.remove).toHaveBeenCalledTimes(60);
});
test('camera permission/capture rejection does not advertise a nonexistent retry draft', async () => {
  const { controller, ports } = setup(); ports.capture.mockRejectedValueOnce(new Error('camera unavailable'));
  await controller.capture(cameraSettings('light-afternoon'), 'back');
  expect(controller.state).toMatchObject({ phase: 'failed', canRetryRender: false });
  expect(ports.render).not.toHaveBeenCalled();
  await controller.discard(); await controller.capture(cameraSettings('original'), 'front'); expect(controller.state.phase).toBe('file-ready');
});

test('captures a detached versioned filter snapshot and retains it through render retry', async () => {
  const { controller, ports } = setup();
  const settings = { ...cameraSettings('scene-dawn', 0.3) };
  ports.render.mockRejectedValueOnce(new Error('shader'));
  const capture = controller.capture(settings, 'front');
  settings.intensity = 1;
  settings.filterId = 'time-summer';
  await capture;
  await controller.retryRender();
  const snapshot = ports.capture.mock.calls[0]![0];
  expect(snapshot.settings).toEqual(cameraSettings('scene-dawn', 0.3));
  expect(snapshot.settings).not.toBe(settings);
  expect(ports.render.mock.calls[1]![1]).toBe(snapshot);
});

test('invalid settings fail before capture and do not leave the controller busy', async () => {
  const { controller, ports } = setup();
  await controller.capture({ ...cameraSettings('light-afternoon'), intensity: NaN }, 'back');
  expect(controller.state.phase).toBe('failed');
  expect(ports.capture).not.toHaveBeenCalled();
  await controller.capture(cameraSettings('original'), 'back');
  expect(controller.state.phase).toBe('file-ready');
});
