import { CaptureController, type CapturePorts, type Draft, type Output, type Snapshot } from '../../src/domain/capture/controller';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import type { RecoveryPort, RestoredCapture } from '../../src/domain/capture/recovery';

const draft: Draft = { sourceUri: 'file:///source.jpg', width: 1200, height: 1600, orientation: 'up', mirrored: false };
const output: Output = { uri: 'file:///filtered.jpg', width: 1200, height: 1600, bytes: 1024 };
const settings = cameraSettings('retro-film');
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function setup(restored?: RestoredCapture) {
  const ports: jest.Mocked<CapturePorts> = {
    capture: jest.fn<Promise<Draft>, [Snapshot]>().mockResolvedValue(draft),
    render: jest.fn<Promise<Output>, [Draft, Snapshot, number?]>().mockResolvedValue(output),
    renderOriginal: jest.fn<Promise<Output>, [Draft, Snapshot]>().mockResolvedValue({ ...output, uri: 'file:///comparison.jpg' }),
    save: jest.fn<Promise<void>, [Output]>().mockResolvedValue(undefined), remove: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
  };
  const recovery: jest.Mocked<RecoveryPort> = {
    checkpoint: jest.fn<ReturnType<RecoveryPort['checkpoint']>, Parameters<RecoveryPort['checkpoint']>>().mockResolvedValue(undefined),
    setGalleryStatus: jest.fn<ReturnType<RecoveryPort['setGalleryStatus']>, Parameters<RecoveryPort['setGalleryStatus']>>().mockResolvedValue(undefined),
    discard: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  };
  return { ports, recovery, controller: new CaptureController(ports, () => undefined, recovery, restored) };
}
test('does not expose a new photo until durable checkpoint; close preserves that checkpoint', async () => {
  const { controller, ports, recovery } = setup();
  const pending = deferred<void>(); recovery.checkpoint.mockReturnValueOnce(pending.promise);
  const captured = controller.capture(settings, 'front', 12, 'on');
  // Advance only until the mocked native render/checkpoint chain is entered.
  await Promise.resolve(); await Promise.resolve();
  expect(recovery.checkpoint).toHaveBeenCalledWith(draft, expect.objectContaining({ settings, position: 'front', grainSeed: 12 }), output);
  expect(controller.state.output).toBeUndefined();
  controller.close(); pending.resolve(); await captured;
  expect(recovery.discard).not.toHaveBeenCalled(); expect(ports.remove).toHaveBeenCalledWith(output.uri);
});
test('failed initial checkpoint offers render retry; failed edit preserves accepted settings and image', async () => {
  const { controller, ports, recovery } = setup();
  recovery.checkpoint.mockRejectedValueOnce(new Error('disk full'));
  await controller.capture(settings, 'back');
  expect(controller.state).toMatchObject({ phase: 'failed', canRetryRender: true });
  expect(controller.state.output).toBeUndefined();
  await controller.retryRender();
  const edited = { ...output, uri: 'file:///filtered-1.jpg' }; ports.render.mockResolvedValueOnce(edited);
  recovery.checkpoint.mockRejectedValueOnce(new Error('journal'));
  expect(await controller.edit(cameraSettings('retro-rose'))).toBe(false);
  expect(controller.state).toMatchObject({ phase: 'file-ready', output, outputSettings: settings });
  expect(ports.remove).toHaveBeenCalledWith(edited.uri);
});
test('accepted edit journals the current look while freezing capture date and noise seed', async () => {
  const { controller, ports, recovery } = setup(); await controller.capture(settings, 'back', 21);
  const first = recovery.checkpoint.mock.calls[0]![1];
  ports.render.mockResolvedValueOnce({ ...output, uri: 'file:///filtered-1.jpg' });
  const edited = cameraSettings('retro-rose'); await controller.edit(edited);
  const last = recovery.checkpoint.mock.calls[1]![1];
  expect(last).toEqual({ ...first, settings: edited });
});
test('background before render completion rejects the candidate; during commit accepts one consistent result', async () => {
  const { controller, ports, recovery } = setup(); await controller.capture(settings, 'back');
  const rendering = deferred<Output>(); ports.render.mockReturnValueOnce(rendering.promise);
  const edit = controller.edit(cameraSettings('retro-rose')); controller.interrupt();
  rendering.resolve({ ...output, uri: 'file:///discarded.jpg' }); expect(await edit).toBe(false);
  expect(recovery.checkpoint).toHaveBeenCalledTimes(1);
  const pending = deferred<void>(); recovery.checkpoint.mockReturnValueOnce(pending.promise);
  ports.render.mockResolvedValueOnce({ ...output, uri: 'file:///accepted.jpg' });
  const next = controller.edit(cameraSettings('retro-rose')); await Promise.resolve();
  controller.interrupt(); pending.resolve(); expect(await next).toBe(true);
  expect(controller.state.output?.uri).toBe('file:///accepted.jpg');
});
test('save journal is committed before native gallery; journal failure prevents gallery writes', async () => {
  const { controller, ports, recovery } = setup(); await controller.capture(settings, 'back');
  recovery.setGalleryStatus.mockRejectedValueOnce(new Error('storage'));
  await controller.save(); expect(ports.save).not.toHaveBeenCalled(); expect(controller.state.phase).toBe('failed');
  const pending = deferred<void>(); recovery.setGalleryStatus.mockReturnValueOnce(pending.promise);
  const saving = controller.save(); expect(ports.save).not.toHaveBeenCalled();
  pending.resolve(); await saving;
  expect(ports.save).toHaveBeenCalledTimes(1);
  expect(recovery.setGalleryStatus.mock.calls.map(([status]) => status)).toEqual(['saving-gallery', 'saving-gallery', 'saved']);
});
test('uncertain gallery write requires explicit resolution, never automatically writes again', async () => {
  const { controller, ports, recovery } = setup(); await controller.capture(settings, 'back');
  ports.save.mockRejectedValueOnce(new Error('native interrupted')); await controller.save();
  expect(controller.state.phase).toBe('save-uncertain');
  await controller.save(); expect(await controller.edit(cameraSettings('original'))).toBe(false);
  expect(ports.save).toHaveBeenCalledTimes(1);
  recovery.setGalleryStatus.mockRejectedValueOnce(new Error('journal'));
  await controller.resolveSave(false); expect(controller.state.phase).toBe('save-uncertain');
  await controller.resolveSave(false); expect(controller.state.phase).toBe('file-ready');
  expect(ports.save).toHaveBeenCalledTimes(1);
  await controller.save(); expect(ports.save).toHaveBeenCalledTimes(2);
});
test('known successful gallery write stays saved when final journal update fails', async () => {
  const { controller, ports, recovery } = setup(); await controller.capture(settings, 'back');
  recovery.setGalleryStatus.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('disk'));
  await controller.save(); await controller.save();
  expect(controller.state.phase).toBe('saved'); expect(controller.state.message).toContain('사진은 저장됐어요');
  expect(ports.save).toHaveBeenCalledTimes(1);
});
test('restored uncertain import opens without capture/render/save; confirmation and discard retain ownership', async () => {
  const restored: RestoredCapture = { draft: { ...draft, imported: { resized: true, flattened: false } }, output,
    snapshot: { id: 'restored', settings, capturedAt: '2026-10-31T01:00:00.000Z', stampDate: 261031,
      grainSeed: 13, position: 'back', flashMode: 'off' }, galleryStatus: 'saving-gallery' };
  const { controller, ports, recovery } = setup(restored);
  expect(controller.state).toMatchObject({ phase: 'save-uncertain', output, outputSettings: settings, imported: restored.draft.imported });
  await controller.resolveSave(true); expect(controller.state.phase).toBe('saved');
  expect(ports.save).not.toHaveBeenCalled(); expect(ports.capture).not.toHaveBeenCalled(); expect(ports.render).not.toHaveBeenCalled();
  recovery.discard.mockRejectedValueOnce(new Error('disk')); await expect(controller.discard()).rejects.toThrow();
  expect(ports.remove).not.toHaveBeenCalled(); expect(controller.state.output).toBe(output);
  await controller.discard(); expect(controller.state.phase).toBe('idle');
});
