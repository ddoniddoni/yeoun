import { CaptureController, type CapturePorts, type CaptureState, type Draft, type ImportPorts,
  type Output, type SelectedPhoto, type Snapshot } from '../../src/domain/capture/controller';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';

const selected = { uri: 'file:///cache/ImagePicker/selected.heic' };
const draft: Draft = { sourceUri: 'file:///cache/draft/source.jpg', width: 4000, height: 2000,
  orientation: 'up', mirrored: false, imported: { resized: true, flattened: false } };
const output: Output = { uri: 'file:///filtered.jpg', width: 4000, height: 2000, bytes: 1234 };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
function setup() {
  const states: CaptureState[] = [];
  const capture: jest.Mocked<CapturePorts> = {
    capture: jest.fn<Promise<Draft>, [Snapshot]>().mockResolvedValue(draft),
    render: jest.fn<Promise<Output>, [Draft, Snapshot, number?]>().mockResolvedValue(output),
    renderOriginal: jest.fn<Promise<Output>, [Draft, Snapshot]>().mockResolvedValue({ ...output, uri: 'file:///comparison.jpg' }),
    save: jest.fn<Promise<void>, [Output]>().mockResolvedValue(undefined), remove: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
  };
  const imports: jest.Mocked<ImportPorts> = {
    pick: jest.fn<Promise<SelectedPhoto | null>, []>().mockResolvedValue(selected),
    prepare: jest.fn<Promise<Draft>, [SelectedPhoto, Snapshot]>().mockResolvedValue(draft),
    release: jest.fn<Promise<void>, [SelectedPhoto]>().mockResolvedValue(undefined),
  };
  return { controller: new CaptureController(capture, state => states.push(state)), capture, imports, states };
}

test('picker cancellation leaves the controller idle without photo processing or saving', async () => {
  const { controller, imports, capture, states } = setup(); imports.pick.mockResolvedValueOnce(null);
  await controller.importPhoto(cameraSettings('retro-film'), imports);
  expect(states.map(s => s.phase)).toEqual(['picking', 'idle']);
  expect(imports.prepare).not.toHaveBeenCalled(); expect(imports.release).not.toHaveBeenCalled();
  expect(capture.capture).not.toHaveBeenCalled(); expect(capture.render).not.toHaveBeenCalled(); expect(capture.save).not.toHaveBeenCalled();
});
test('selection locks camera/import/discard and freezes settings without forcing a date stamp', async () => {
  const { controller, imports, capture, states } = setup(); const pending = deferred<SelectedPhoto | null>();
  imports.pick.mockReturnValueOnce(pending.promise);
  const settings = { ...cameraSettings('retro-film') };
  const work = controller.importPhoto(settings, imports); settings.intensity = 0;
  await controller.importPhoto(cameraSettings('original'), imports);
  await controller.capture(cameraSettings('original'), 'back'); await controller.discard();
  expect(controller.state.phase).toBe('picking'); expect(imports.pick).toHaveBeenCalledTimes(1);
  pending.resolve(selected); await work;
  expect(states.map(s => s.phase)).toEqual(['picking', 'importing', 'rendering', 'file-ready']);
  expect(capture.capture).not.toHaveBeenCalled(); expect(capture.save).not.toHaveBeenCalled();
  const snapshot = imports.prepare.mock.calls[0]![1];
  expect(snapshot.settings).toMatchObject({ filterId: 'retro-film', dateStamp: false, intensity: cameraSettings('retro-film').intensity });
  expect(snapshot.flashMode).toBe('off'); expect(snapshot.sourceExposure).toBeUndefined();
  expect(capture.render).toHaveBeenCalledWith(draft, snapshot);
  expect(controller.state.imported).toEqual(draft.imported); expect(imports.release).toHaveBeenCalledWith(selected);
});
test('late picker success after close is released without decoding or notifying', async () => {
  const { controller, imports, capture, states } = setup(); const pending = deferred<SelectedPhoto | null>();
  imports.pick.mockReturnValueOnce(pending.promise); const work = controller.importPhoto(cameraSettings('original'), imports);
  controller.close(); const count = states.length; pending.resolve(selected); await work;
  expect(states).toHaveLength(count); expect(imports.release).toHaveBeenCalledWith(selected);
  expect(imports.prepare).not.toHaveBeenCalled(); expect(capture.render).not.toHaveBeenCalled();
});
test('background while preparing discards late normalized copy and never renders', async () => {
  const { controller, imports, capture } = setup(); const pending = deferred<Draft>();
  imports.prepare.mockReturnValueOnce(pending.promise); const work = controller.importPhoto(cameraSettings('original'), imports);
  await Promise.resolve(); controller.interrupt(); pending.resolve(draft); await work;
  expect(controller.state).toEqual({ phase: 'cancelled' });
  expect(capture.remove).toHaveBeenCalledWith(draft.sourceUri); expect(imports.release).toHaveBeenCalledWith(selected);
  expect(capture.render).not.toHaveBeenCalled();
});
test('render retry and edits retain full framing and import metadata without reopening the picker', async () => {
  const { controller, imports, capture } = setup(); capture.render.mockRejectedValueOnce(new Error('GPU'));
  await controller.importPhoto(cameraSettings('retro-film'), imports);
  expect(controller.state).toMatchObject({ phase: 'failed', canRetryRender: true, imported: draft.imported });
  await controller.retryRender();
  const snapshot = capture.render.mock.calls[0]![1];
  expect(capture.render.mock.calls[1]).toEqual([draft, snapshot]);
  capture.render.mockResolvedValueOnce({ ...output, uri: 'file:///edited.jpg' });
  expect(await controller.edit(cameraSettings('retro-digital'))).toBe(true);
  expect(capture.render.mock.calls[2]![0]).toBe(draft);
  expect(capture.render.mock.calls[2]![1]).toMatchObject({ stampDate: snapshot.stampDate, capturedAt: snapshot.capturedAt, grainSeed: snapshot.grainSeed });
  await controller.save(); expect(capture.save).toHaveBeenCalledWith({ ...output, uri: 'file:///edited.jpg' });
  expect(imports.pick).toHaveBeenCalledTimes(1); expect(imports.release).toHaveBeenCalledTimes(1);
  await controller.discard(); expect(controller.state).toEqual({ phase: 'idle' });
});
test('unsupported source leaves no retry draft and releases the picker copy', async () => {
  const { controller, imports, capture } = setup(); imports.prepare.mockRejectedValueOnce(new Error('지원하지 않는 사진'));
  await controller.importPhoto(cameraSettings('original'), imports);
  expect(controller.state).toMatchObject({ phase: 'failed', canRetryRender: false });
  expect(imports.release).toHaveBeenCalledWith(selected); expect(capture.render).not.toHaveBeenCalled();
});
