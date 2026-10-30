import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { createPreviewLutPublisher } from '../../src/platform/camera/previewLutPublisher';
import type { LoadedLut, LutSelection } from '../../src/rendering/assets/lutLoader';

// Request ordering/ownership only. No camera, native shader, or color-quality evidence.
jest.mock('../../src/rendering/reference/lutPlanes', () => ({
  createLutAlphaPlanes: () => [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])],
}));

function loaded(selection: LutSelection): LoadedLut {
  return { engineVersion: selection.engineVersion, sourceSeedSha256: '0'.repeat(64),
    asset: { filterId: selection.filterId, role: 'look', lookVersion: selection.lookVersion,
      status: 'draft', path: 'luts/fixture.png', sha256: selection.filterId },
    atlas: { width: 210, height: 210, pixels: new Uint8Array(0) } };
}
function deferred() {
  let resolve!: (value: LoadedLut) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<LoadedLut>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function setup() {
  const ports = { load: jest.fn(async (selection: LutSelection) => loaded(selection)),
    publish: jest.fn(), status: jest.fn(), reportError: jest.fn() };
  return { ports, publisher: createPreviewLutPublisher(ports) };
}
const summer = { key: 'summer', settings: cameraSettings('time-summer'), grainSeed: 17, stampDate: 261030 };
const rose = { ...summer, key: 'rose', settings: cameraSettings('retro-rose') };

test('loading a new selection preserves the published live look until a complete request is ready', async () => {
  const { ports, publisher } = setup();
  publisher.select(summer);
  expect(ports.publish).not.toHaveBeenCalled();
  await Promise.resolve();
  const previous = ports.publish.mock.calls[0]![0];
  const pending = deferred(); ports.load.mockReturnValueOnce(pending.promise);
  publisher.select(rose);
  expect(ports.publish).toHaveBeenCalledTimes(1);
  expect(ports.status).toHaveBeenLastCalledWith({ key: 'rose', phase: 'loading' });
  pending.resolve(loaded(rose.settings)); await Promise.resolve();
  const next = ports.publish.mock.calls[1]![0];
  expect(next).toMatchObject({ ...rose, loading: false, assetKey: 'retro-rose' });
  expect(next.id).toBeGreaterThan(previous.id);
  expect(next.planes.every((plane: unknown) => plane instanceof ArrayBuffer)).toBe(true);
  expect(ports.status).toHaveBeenLastCalledWith({ key: 'rose', phase: 'applying' });
  expect(ports.status.mock.calls.some(([status]) => status.phase === 'ready')).toBe(false);
});

test('cached strength/date changes publish synchronously with fresh settings and IDs', async () => {
  const { ports, publisher } = setup(); publisher.select(summer); await Promise.resolve();
  const first = ports.publish.mock.calls[0]![0];
  const adjusted = { ...summer, key: 'adjusted', settings: cameraSettings('time-summer', 0.4), stampDate: 261031 };
  publisher.select(adjusted);
  const next = ports.publish.mock.calls[1]![0];
  expect(ports.load).toHaveBeenCalledTimes(1);
  expect(next).toMatchObject(adjusted);
  expect(next.planes).toBe(first.planes);
  expect(next.id).not.toBe(first.id);
});

test('slow or cancelled loads cannot replace a newer choice, original, or closed session', async () => {
  const { ports, publisher } = setup(); const old = deferred(), latest = deferred();
  ports.load.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  const cancel = publisher.select(summer); cancel(); publisher.select(rose);
  latest.resolve(loaded(rose.settings)); await Promise.resolve();
  old.resolve(loaded(summer.settings)); await Promise.resolve();
  expect(ports.publish).toHaveBeenCalledTimes(1);
  expect(ports.publish).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'rose' }));
  const pending = deferred(); ports.load.mockReturnValueOnce(pending.promise);
  publisher.select(summer);
  publisher.select({ ...summer, key: 'original', settings: cameraSettings('original') });
  pending.resolve(loaded(summer.settings)); await Promise.resolve();
  expect(ports.publish).toHaveBeenCalledTimes(2);
  expect(ports.publish).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'original', loading: false }));
  const closing = deferred(); ports.load.mockReturnValueOnce(closing.promise);
  publisher.select(summer); publisher.clear(); closing.resolve(loaded(summer.settings)); await Promise.resolve();
  expect(ports.publish).toHaveBeenCalledTimes(2);
});

test('current failure publishes an explicit original fallback; stale failures stay silent', async () => {
  const { ports, publisher } = setup(); const old = deferred(), latest = deferred();
  ports.load.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  publisher.select(summer); publisher.select(rose);
  old.reject(new Error('old')); await Promise.resolve();
  expect(ports.reportError).not.toHaveBeenCalled(); expect(ports.publish).not.toHaveBeenCalled();
  latest.reject(new Error('current')); await Promise.resolve();
  expect(ports.reportError).toHaveBeenCalledTimes(1);
  expect(ports.publish).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'rose', loading: false, error: expect.any(String) }));
  expect(ports.status).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'rose', phase: 'error' }));
});

test('prepared planes are bounded to three recently used looks and clear releases that cache', async () => {
  const { ports, publisher } = setup();
  for (const id of ['time-summer', 'retro-rose', 'retro-travel'] as const) {
    publisher.select({ ...summer, key: id, settings: cameraSettings(id) }); await Promise.resolve();
  }
  publisher.select(summer); // Touch summer, so rose is the oldest.
  publisher.select({ ...summer, key: 'fourth', settings: cameraSettings('light-milk') }); await Promise.resolve();
  publisher.select(summer); expect(ports.load).toHaveBeenCalledTimes(4);
  publisher.select(rose); await Promise.resolve(); expect(ports.load).toHaveBeenCalledTimes(5);
  publisher.clear(); publisher.select(rose); await Promise.resolve(); expect(ports.load).toHaveBeenCalledTimes(6);
});

test('zero strength publishes a bypass immediately without fetching a LUT', () => {
  const { ports, publisher } = setup(); publisher.select({ ...summer, settings: cameraSettings('time-summer', 0) });
  expect(ports.load).not.toHaveBeenCalled();
  expect(ports.publish).toHaveBeenCalledWith(expect.objectContaining({ loading: false, settings: expect.objectContaining({ intensity: 0 }) }));
});
