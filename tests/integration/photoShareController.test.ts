import { CaptureController, type CapturePorts, type CaptureState, type Draft, type Output, type SharePort, type Snapshot } from '../../src/domain/capture/controller';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';

const draft: Draft = { sourceUri: 'file:///source.jpg', width: 1200, height: 1200, orientation: 'up', mirrored: false };
const output: Output = { uri: 'file:///filtered.jpg', width: 1200, height: 1200, bytes: 1024 };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function setup() {
  const states: CaptureState[] = [];
  const ports: jest.Mocked<CapturePorts> = {
    capture: jest.fn<Promise<Draft>, [Snapshot]>().mockResolvedValue(draft),
    render: jest.fn<Promise<Output>, [Draft, Snapshot, number?]>().mockResolvedValue(output),
    renderOriginal: jest.fn<Promise<Output>, [Draft, Snapshot]>().mockResolvedValue({ ...output, uri: 'file:///original.jpg' }),
    save: jest.fn<Promise<void>, [Output]>().mockResolvedValue(undefined), remove: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
  };
  const present = jest.fn<ReturnType<SharePort>, Parameters<SharePort>>().mockResolvedValue(undefined);
  return { controller: new CaptureController(ports, state => states.push(state)), ports, present, states };
}

test('dismissal preserves unsaved output, comparison and settings without gallery writes', async () => {
  const { controller, ports, present } = setup();
  await controller.capture(cameraSettings('retro-film'), 'back'); await controller.prepareOriginal();
  const before = controller.state;
  await controller.share(present);
  expect(controller.state).toMatchObject({ ...before, sharing: false });
  expect(controller.state.shareError).toBeUndefined();
  expect(present.mock.calls[0]![0]).toBe(output);
  expect(ports.save).not.toHaveBeenCalled(); expect(ports.remove).not.toHaveBeenCalled();
});
test('shares the latest edited import with no render or gallery prerequisite', async () => {
  const { controller, ports, present } = setup();
  const imported = { ...draft, imported: { resized: false, flattened: true } };
  await controller.importPhoto(cameraSettings('original'), { pick: async () => ({ uri: 'file:///picker.png' }),
    prepare: async () => imported, release: async () => undefined });
  const edited = { ...output, uri: 'file:///filtered-1.jpg' };
  ports.render.mockResolvedValueOnce(edited); await controller.edit(cameraSettings('retro-rose'));
  await controller.share(present);
  expect(present.mock.calls[0]![0]).toBe(edited);
  expect(controller.state).toMatchObject({ output: edited, imported: imported.imported, phase: 'file-ready' });
  expect(ports.render).toHaveBeenCalledTimes(2); expect(ports.save).not.toHaveBeenCalled();
});
test('share locks duplicate taps, edit, save, comparison and discard until native completion', async () => {
  const { controller, ports, present } = setup(); await controller.capture(cameraSettings('retro-film'), 'back');
  const pending = deferred<void>(); present.mockReturnValueOnce(pending.promise);
  const sharing = controller.share(present);
  expect(controller.state.sharing).toBe(true);
  await controller.share(present); await controller.save(); await controller.discard(); await controller.prepareOriginal();
  expect(await controller.edit(cameraSettings('retro-rose'))).toBe(false);
  expect(present).toHaveBeenCalledTimes(1); expect(ports.save).not.toHaveBeenCalled();
  expect(ports.remove).not.toHaveBeenCalled(); expect(ports.renderOriginal).not.toHaveBeenCalled();
  controller.interrupt(); pending.resolve(); await sharing;
  expect(controller.state).toMatchObject({ phase: 'file-ready', output, sharing: false });
  await controller.save(); expect(ports.save).toHaveBeenCalledWith(output);
});
test.each(['saved', 'failed'] as const)('share failure and retry preserve the %s gallery state', async phase => {
  const { controller, ports, present } = setup(); await controller.capture(cameraSettings('original'), 'back');
  if (phase === 'failed') ports.save.mockRejectedValueOnce(new Error('permission'));
  await controller.save(); const message = controller.state.message;
  present.mockRejectedValueOnce(new Error('native file path must not leak'));
  await controller.share(present);
  expect(controller.state).toMatchObject({ phase, output, sharing: false });
  expect(controller.state.message).toBe(message); expect(controller.state.shareError).toContain('공유창');
  expect(controller.state.shareError).not.toContain('native file path');
  await controller.share(present); expect(controller.state.shareError).toBeUndefined();
  expect(controller.state.phase).toBe(phase); expect(ports.save).toHaveBeenCalledTimes(1);
});
test('close prevents late presentation and defers owned result cleanup until pending work returns', async () => {
  const { controller, ports, present, states } = setup(); await controller.capture(cameraSettings('original'), 'back');
  const pending = deferred<void>(); present.mockReturnValueOnce(pending.promise);
  const sharing = controller.share(present); const canPresent = present.mock.calls[0]![1];
  expect(canPresent()).toBe(true); controller.close(); expect(canPresent()).toBe(false);
  const count = states.length; expect(ports.remove).not.toHaveBeenCalled();
  pending.resolve(); await sharing;
  expect(states).toHaveLength(count);
  expect(ports.remove.mock.calls).toEqual([[draft.sourceUri], [output.uri]]);
});
test('there is nothing to share before capture or after discard', async () => {
  const { controller, present } = setup(); await controller.share(present);
  await controller.capture(cameraSettings('original'), 'back'); await controller.discard(); await controller.share(present);
  expect(present).not.toHaveBeenCalled(); expect(controller.state).toEqual({ phase: 'idle' });
});
