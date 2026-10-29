import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { CaptureController, type CapturePorts, type CaptureState, type Draft, type Output, type Snapshot } from '../../src/domain/capture/controller';
const draft: Draft = { sourceUri: 'file:///source.jpg', width: 4032, height: 3024, orientation: 'up', mirrored: false };
const output: Output = { uri: 'file:///filtered.jpg', width: 4032, height: 3024, bytes: 1234 };
const original: Output = { uri: 'file:///comparison-original.jpg', width: 1600, height: 1200, bytes: 456 };
function setup() {
  const states: CaptureState[] = [];
  const ports: jest.Mocked<CapturePorts> = { capture: jest.fn<Promise<Draft>, [Snapshot]>().mockResolvedValue(draft), render: jest.fn<Promise<Output>, [Draft, Snapshot]>().mockResolvedValue(output), renderOriginal: jest.fn<Promise<Output>, [Draft, Snapshot]>().mockResolvedValue(original), save: jest.fn<Promise<void>, [Output]>().mockResolvedValue(undefined), remove: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined) };
  const controller = new CaptureController(ports, state => states.push(state));
  return { controller, ports, states };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
test('comparison is lazy, cached, and never becomes the gallery output', async () => {
  const { controller, ports } = setup();
  await controller.capture({ ...cameraSettings('retro-film'), dateStamp: true, dust: 0.5 }, 'front');
  expect(ports.renderOriginal).not.toHaveBeenCalled();
  await controller.prepareOriginal(); await controller.prepareOriginal();
  expect(ports.renderOriginal).toHaveBeenCalledTimes(1);
  expect(ports.renderOriginal).toHaveBeenCalledWith(draft, ports.capture.mock.calls[0]![0]);
  expect(controller.state).toMatchObject({ phase: 'file-ready', output, original });
  await controller.save();
  expect(ports.save).toHaveBeenCalledWith(output);
  expect(controller.state).toMatchObject({ phase: 'saved', output, original });
  await controller.discard();
  expect(ports.remove.mock.calls).toEqual([[draft.sourceUri], [output.uri], [original.uri]]);
  expect(controller.state).toEqual({ phase: 'idle' });
});
test('comparison preparation serializes save, discard and repeated taps', async () => {
  const { controller, ports } = setup();
  await controller.capture(cameraSettings('time-summer'), 'back');
  const pending = deferred<Output>(); ports.renderOriginal.mockReturnValueOnce(pending.promise);
  const prepare = controller.prepareOriginal();
  await controller.prepareOriginal(); await controller.save(); await controller.discard();
  expect(controller.state).toMatchObject({ preparingOriginal: true, output });
  expect(ports.renderOriginal).toHaveBeenCalledTimes(1);
  expect(ports.remove).not.toHaveBeenCalled(); expect(ports.save).not.toHaveBeenCalled();
  pending.resolve(original); await prepare; await controller.save();
  expect(ports.save).toHaveBeenCalledWith(output);
});
test('comparison failure retains saved state and supports retry without recapture', async () => {
  const { controller, ports } = setup();
  await controller.capture(cameraSettings('retro-digital'), 'back'); await controller.save();
  ports.renderOriginal.mockRejectedValueOnce(new Error('allocation'));
  await controller.prepareOriginal();
  expect(controller.state).toMatchObject({ phase: 'saved', output, preparingOriginal: false });
  expect(controller.state.originalError).toBeDefined();
  await controller.prepareOriginal();
  expect(controller.state).toMatchObject({ phase: 'saved', original });
  expect(controller.state.originalError).toBeUndefined();
  expect(ports.capture).toHaveBeenCalledTimes(1); expect(ports.render).toHaveBeenCalledTimes(1);
});
test('background discards a late comparison but retains the source and filtered export for retry', async () => {
  const { controller, ports } = setup();
  await controller.capture(cameraSettings('scene-dawn'), 'front');
  const pending = deferred<Output>(); ports.renderOriginal.mockReturnValueOnce(pending.promise);
  const prepare = controller.prepareOriginal(); controller.interrupt(); pending.resolve(original); await prepare;
  expect(ports.remove.mock.calls).toEqual([[original.uri]]);
  expect(controller.state).toMatchObject({ phase: 'file-ready', output, preparingOriginal: false });
  expect(controller.state.original).toBeUndefined();
  await controller.prepareOriginal(); expect(controller.state.original).toBe(original);
});
test('unmount waits for comparison rendering before deleting all owned files, without publishing', async () => {
  const { controller, ports, states } = setup();
  await controller.capture(cameraSettings('scene-dawn'), 'front');
  const pending = deferred<Output>(); ports.renderOriginal.mockReturnValueOnce(pending.promise);
  const prepare = controller.prepareOriginal(); const count = states.length;
  controller.close(); expect(ports.remove).not.toHaveBeenCalled();
  pending.resolve(original); await prepare;
  expect(states).toHaveLength(count);
  expect(ports.remove.mock.calls).toEqual([[original.uri], [draft.sourceUri], [output.uri]]);
});
test.each(['original', 'zero'] as const)('already unstyled %s output does not allocate a comparison', async mode => {
  const { controller, ports } = setup();
  await controller.capture(mode === 'original' ? cameraSettings('original') : cameraSettings('retro-film', 0), 'back');
  await controller.prepareOriginal(); expect(ports.renderOriginal).not.toHaveBeenCalled();
  await controller.save(); expect(ports.save).toHaveBeenCalledWith(output);
});
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

test('preview seed and texture settings survive capture and retry; later shots accept a new seed', async () => {
  const { controller, ports } = setup();
  const settings = { ...cameraSettings('time-summer'), grain: 0.7, bloom: 0.4 };
  ports.render.mockRejectedValueOnce(new Error('GPU'));
  const capture = controller.capture(settings, 'back', 91);
  settings.grain = 0; settings.bloom = 0;
  await capture; await controller.retryRender();
  expect(ports.render.mock.calls[0]![1]).toBe(ports.render.mock.calls[1]![1]);
  expect(ports.render.mock.calls[1]![1]).toMatchObject({ grainSeed: 91, settings: { grain: 0.7, bloom: 0.4 } });
  await controller.discard(); await controller.capture(settings, 'back', 92);
  expect(ports.capture.mock.calls[1]![0].grainSeed).toBe(92);
});

test('invalid seed fails before native capture and releases the busy state', async () => {
  const { controller, ports } = setup();
  await controller.capture(cameraSettings('time-summer'), 'back', NaN);
  expect(ports.capture).not.toHaveBeenCalled();
  await controller.capture(cameraSettings('time-summer'), 'back', 0);
  expect(controller.state.phase).toBe('file-ready');
});

test('flash choice is frozen at capture and render retry never recaptures or refires flash', async () => {
  const { controller, ports } = setup();
  ports.render.mockRejectedValueOnce(new Error('GPU'));
  await controller.capture(cameraSettings('time-summer'), 'back', 91, 'auto');
  const snapshot = ports.capture.mock.calls[0]![0];
  expect(snapshot.flashMode).toBe('auto');
  expect(Object.isFrozen(snapshot)).toBe(true);
  await controller.capture(cameraSettings('original'), 'front', 92, 'off');
  await controller.retryRender();
  expect(ports.capture).toHaveBeenCalledTimes(1);
  expect(ports.render.mock.calls[1]![1]).toBe(snapshot);
  await controller.discard();
  await controller.capture(cameraSettings('original'), 'front', 92);
  expect(ports.capture.mock.calls[1]![0].flashMode).toBe('off');
});

test('native flash failure retains no draft and never retries automatically with flash off', async () => {
  const { controller, ports } = setup();
  ports.capture.mockRejectedValueOnce(new Error('flash unavailable'));
  await controller.capture(cameraSettings('original'), 'back', 91, 'on');
  expect(controller.state).toMatchObject({ phase: 'failed', canRetryRender: false });
  expect(ports.capture).toHaveBeenCalledTimes(1);
  expect(ports.render).not.toHaveBeenCalled();
  await controller.retryRender();
  expect(ports.capture).toHaveBeenCalledTimes(1);
});

test('native exposure reading is copied with its unit and preserved on render retry', async () => {
  const { controller, ports } = setup();
  const exposure = { value: 2, unit: 'step' as const };
  ports.render.mockRejectedValueOnce(new Error('GPU'));
  const capture = controller.capture(cameraSettings('original'), 'back', 91, 'off', exposure);
  exposure.value = -2;
  await capture; await controller.retryRender();
  const snapshot = ports.capture.mock.calls[0]![0];
  expect(snapshot.sourceExposure).toEqual({ value: 2, unit: 'step' });
  expect(Object.isFrozen(snapshot.sourceExposure)).toBe(true);
  expect(ports.render.mock.calls[1]![1]).toBe(snapshot);
  expect(ports.capture).toHaveBeenCalledTimes(1);
});

test('date and retro settings are frozen before capture and survive a retry on the next day', async () => {
  jest.useFakeTimers();
  try {
    jest.setSystemTime(new Date(2026, 9, 29, 23, 59));
    const { controller, ports } = setup();
    const settings = { ...cameraSettings('retro-digital'), dateStamp: true, dust: 0.2, lightLeak: 0.3 };
    ports.render.mockRejectedValueOnce(new Error('GPU'));
    const capture = controller.capture(settings, 'back', 91);
    settings.dateStamp = false; settings.dust = 0;
    await capture;
    jest.setSystemTime(new Date(2026, 9, 30, 0, 1));
    await controller.retryRender();
    const first = ports.capture.mock.calls[0]![0];
    expect(first).toMatchObject({ stampDate: 261029, grainSeed: 91,
      settings: { dateStamp: true, dust: 0.2, lightLeak: 0.3, sharpness: 0.5 } });
    expect(ports.render.mock.calls[1]![1]).toBe(first);
  } finally { jest.useRealTimers(); }
});
