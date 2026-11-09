import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { defaultRememberedCamera, parseCameraMemory, serializeCameraMemory } from '../../src/domain/filters/cameraMemory';
import { CameraMemoryStore, type CameraMemoryRepository } from '../../src/domain/filters/cameraMemoryStore';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}
function setup(initial: string | null = null) {
  let disk = initial;
  const fingerprint = () => 'current-assets';
  const repository: jest.Mocked<CameraMemoryRepository> = {
    read: jest.fn(async () => disk), write: jest.fn(async raw => { disk = raw; }),
  };
  return { repository, fingerprint, disk: () => disk, make: () => new CameraMemoryStore(repository, fingerprint) };
}
async function settled(store: CameraMemoryStore) {
  await Promise.resolve(); // Let the queued write start before subscribing to completion.
  if (!store.getSnapshot().saving) return;
  await new Promise<void>(resolve => {
    const off = store.subscribe(() => { if (!store.getSnapshot().saving) { off(); resolve(); } });
  });
}
// Store ordering and in-memory reload only; not SQLite durability or real process restart evidence.
test('hydration blocks changes and duplicate loads, restores the snapshot, and performs no startup write', async () => {
  const { repository, fingerprint, make } = setup(); const pending = deferred<string | null>();
  repository.read.mockReturnValueOnce(pending.promise);
  const store = make(), loading = store.load(); await store.load();
  expect(store.setSettings(cameraSettings('scene-rain'))).toBe(false); store.toggleGrid(); await store.setRemember(false);
  expect(repository.read).toHaveBeenCalledTimes(1); expect(repository.write).not.toHaveBeenCalled();
  const camera = { settings: { ...cameraSettings('retro-film'), grain: 0.2 }, grid: true };
  pending.resolve(serializeCameraMemory({ remember: true, camera }, fingerprint)); await loading;
  expect(store.getSnapshot()).toMatchObject({ startup: 'ready', camera, remember: true });
  expect(repository.write).not.toHaveBeenCalled();
});
test('rapid changes keep only the latest queued snapshot, then a fresh store restores it', async () => {
  const { make, repository, fingerprint } = setup(); const store = make(); await store.load();
  const pending = deferred<void>(); repository.write.mockReturnValueOnce(pending.promise);
  store.setSettings(cameraSettings('retro-film')); await Promise.resolve();
  store.setSettings(cameraSettings('scene-rain', 0.3)); store.toggleGrid();
  const latest = { ...cameraSettings('retro-rose'), grain: 0.4 }; store.setSettings(latest); latest.grain = 0.9;
  expect(repository.write).toHaveBeenCalledTimes(1);
  pending.resolve(); await settled(store);
  expect(repository.write).toHaveBeenCalledTimes(2);
  expect(parseCameraMemory(repository.write.mock.calls[1]![0], fingerprint)).toMatchObject({
    remember: true, camera: { settings: { filterId: 'retro-rose', grain: 0.4 }, grid: true },
  });
  const next = make(); await next.load(); expect(next.getSnapshot().camera).toEqual(store.getSnapshot().camera);
});
test('disable follows pending writes, preserves working settings, and starts the next store at defaults', async () => {
  const { make, repository, disk } = setup(); const store = make(); await store.load();
  const pending = deferred<void>(); repository.write.mockReturnValueOnce(pending.promise);
  store.setSettings(cameraSettings('retro-film')); await Promise.resolve(); store.toggleGrid();
  const before = store.getSnapshot().camera; const disabling = store.setRemember(false);
  expect(store.getSnapshot()).toMatchObject({ switching: true, remember: true });
  expect(store.setSettings(cameraSettings('scene-rain'))).toBe(false); store.toggleGrid();
  await store.setRemember(true); expect(repository.write).toHaveBeenCalledTimes(1);
  pending.resolve(); await disabling;
  expect(JSON.parse(disk()!)).toEqual({ schemaVersion: 1, remember: false });
  expect(store.getSnapshot()).toMatchObject({ switching: false, remember: false, camera: before });
  const next = make(); await next.load(); expect(next.getSnapshot().camera).toEqual(defaultRememberedCamera());
  const writes = repository.write.mock.calls.length;
  store.setSettings(cameraSettings('scene-rain')); store.toggleGrid(); await settled(store);
  expect(repository.write).toHaveBeenCalledTimes(writes);
  await store.setRemember(true); const enabled = make(); await enabled.load();
  expect(enabled.getSnapshot().camera).toEqual(store.getSnapshot().camera);
});
test('load failure and defaults bypass preserve the record until an explicit choice', async () => {
  const { make, repository, disk } = setup('{"schemaVersion":99}'); const store = make(); await store.load();
  expect(store.getSnapshot()).toMatchObject({ startup: 'failed', remember: null });
  store.useDefaults(); store.setSettings(cameraSettings('scene-rain')); store.toggleGrid();
  expect(store.getSnapshot().startup).toBe('ready'); expect(repository.write).not.toHaveBeenCalled();
  expect(disk()).toBe('{"schemaVersion":99}');
  await store.setRemember(true); const next = make(); await next.load();
  expect(next.getSnapshot().camera).toEqual(store.getSnapshot().camera);
});
test('a failed startup read can retry without mounting camera defaults or writing', async () => {
  const { make, repository } = setup(); repository.read.mockRejectedValueOnce(new Error('unavailable'));
  const store = make(); await store.load(); expect(store.getStartup()).toBe('failed');
  await store.load(); expect(store.getStartup()).toBe('ready'); expect(repository.write).not.toHaveBeenCalled();
});
test('automatic write failure suspends persistence but allows camera changes and explicit retry of the latest state', async () => {
  const { make, repository } = setup(); const store = make(); await store.load();
  repository.write.mockRejectedValueOnce(new Error('disk full'));
  store.setSettings(cameraSettings('retro-film')); await settled(store);
  expect(store.getSnapshot().error).toBeDefined();
  store.toggleGrid(); store.setSettings(cameraSettings('scene-rain')); await settled(store);
  expect(repository.write).toHaveBeenCalledTimes(1);
  await store.setRemember(true); expect(store.getSnapshot().error).toBeUndefined();
  const next = make(); await next.load(); expect(next.getSnapshot().camera).toEqual(store.getSnapshot().camera);
});
test('an unconfirmed toggle reports unknown, permits working changes, and only retries on explicit choice', async () => {
  const { make, repository } = setup(); const store = make(); await store.load();
  repository.write.mockRejectedValueOnce(new Error('commit acknowledgement lost')); await store.setRemember(false);
  expect(store.getSnapshot()).toMatchObject({ remember: null, switching: false });
  store.toggleGrid(); await settled(store); expect(repository.write).toHaveBeenCalledTimes(1);
  await store.setRemember(false); expect(store.getSnapshot()).toMatchObject({ remember: false, error: undefined });
  const listener = jest.fn(), off = store.subscribe(listener); off(); store.toggleGrid();
  expect(listener).not.toHaveBeenCalled();
});
