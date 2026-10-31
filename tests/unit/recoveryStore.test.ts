import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { parseRecovery, RECOVERY_TTL, type RecoveryRecord } from '../../src/domain/capture/recovery';
import { RecoveryStore, type RecoveryStorage } from '../../src/domain/capture/recoveryStore';
import type { Draft, Output, Snapshot } from '../../src/domain/capture/controller';

const snapshot: Snapshot = { id: 'session-1', settings: cameraSettings('retro-film'), position: 'back',
  capturedAt: '2026-10-31T01:00:00.000Z', stampDate: 261031, grainSeed: 42, flashMode: 'on', sourceExposure: { value: -0.3, unit: 'ev' } };
const draft: Draft = { sourceUri: 'file:///cache/source.jpg', width: 1200, height: 1600, orientation: 'up', mirrored: false };
const output: Output = { uri: 'file:///cache/filtered.jpg', width: 1200, height: 1600, bytes: 1234 };
function setup() {
  let raw: string | null = null, id = 0, now = Date.parse(snapshot.capturedAt);
  const files = new Set<string>();
  const io: jest.Mocked<RecoveryStorage> = {
    read: jest.fn<ReturnType<RecoveryStorage['read']>, []>(async () => raw),
    write: jest.fn<Promise<void>, [string]>(async value => { raw = value; }), clear: jest.fn<Promise<void>, []>(async () => { raw = null; }),
    stash: jest.fn<ReturnType<RecoveryStorage['stash']>, [string, string]>(async (_uri, name) => { files.add(name); return { bytes: 1234, sha256: 'a'.repeat(64) }; }),
    restore: jest.fn<ReturnType<RecoveryStorage['restore']>, Parameters<RecoveryStorage['restore']>>().mockResolvedValue(undefined),
    removeWorking: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
    prune: jest.fn<Promise<void>, [string[]]>(async keep => { for (const name of files) if (!keep.includes(name)) files.delete(name); }),
    id: jest.fn<string, []>(() => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`),
    workingUri: jest.fn<ReturnType<RecoveryStorage['workingUri']>, Parameters<RecoveryStorage['workingUri']>>((session, name) => `file:///cache/${session}/${name}`),
    now: jest.fn<number, []>(() => now),
  };
  return { io, files, store: new RecoveryStore(io, 'renderer/lut-hash'), raw: () => raw,
    replace: (record: unknown) => { raw = JSON.stringify(record); }, advance: (milliseconds: number) => { now += milliseconds; } };
}
test('checkpoint uses independent immutable files and resume restores only metadata/current accepted result', async () => {
  const { store, io, raw } = setup(); await store.checkpoint(draft, snapshot, output);
  const record = parseRecovery(raw()!, 'renderer/lut-hash');
  expect(raw()).not.toContain('file:///'); expect(record.snapshot).toEqual(snapshot);
  const loaded = await store.load(); expect(loaded).toEqual(record);
  const restored = await store.resume();
  expect(restored.snapshot).toEqual(snapshot); expect(restored.galleryStatus).toBe('not-saved');
  expect(restored.draft.sourceUri).not.toBe(draft.sourceUri);
  expect(io.restore.mock.calls.map(([file]) => file.name)).toEqual([record.source.name, record.output.name]);
});
test('new edit commits before pruning; failed write keeps previous files, successful retry replaces only output', async () => {
  const { store, io, raw, files } = setup(); await store.checkpoint(draft, snapshot, output);
  const original = raw(), names = [...files]; io.write.mockRejectedValueOnce(new Error('disk'));
  const edited = { ...output, uri: 'file:///filtered-1.jpg' };
  await expect(store.checkpoint(draft, { ...snapshot, settings: cameraSettings('retro-rose') }, edited)).rejects.toThrow();
  expect(raw()).toBe(original); expect(names.every(name => files.has(name))).toBe(true);
  await store.checkpoint(draft, { ...snapshot, settings: cameraSettings('retro-rose') }, edited);
  expect(files.size).toBe(2); expect(files.has(names[0]!)).toBe(true); expect(files.has(names[1]!)).toBe(false);
  expect(io.stash.mock.calls.filter(([, name]) => name.startsWith('source-'))).toHaveLength(1);
});
test('crash before journal commit leaves removable orphan, crash after commit retains new result', async () => {
  const { store, io, files, raw } = setup(); await store.checkpoint(draft, snapshot, output);
  const old = raw(); io.stash.mockRejectedValueOnce(new Error('partial copy'));
  await expect(store.checkpoint(draft, snapshot, output)).rejects.toThrow(); expect(raw()).toBe(old);
  files.add('output-00000000-0000-4000-8000-999999999999.jpg');
  const restarted = new RecoveryStore(io, 'renderer/lut-hash'); await restarted.load(); expect(files.size).toBe(2);
  const write = io.write.getMockImplementation()!;
  io.write.mockImplementationOnce(async value => { await write(value); throw new Error('bridge after commit'); });
  await store.checkpoint(draft, snapshot, { ...output, uri: 'file:///next.jpg' });
  expect(raw()).not.toBe(old); expect(files.size).toBe(2);
});
test('ambiguous write + read failure preserves every candidate; stale output cannot change gallery journal', async () => {
  const { store, io, files } = setup(); await store.checkpoint(draft, snapshot, output);
  const write = io.write.getMockImplementation()!, read = io.read.getMockImplementation()!;
  io.write.mockImplementationOnce(async value => { await write(value); throw new Error('bridge'); });
  io.read.mockImplementationOnce(read).mockRejectedValueOnce(new Error('unreadable'));
  await expect(store.checkpoint(draft, snapshot, { ...output, uri: 'file:///next.jpg' })).rejects.toThrow();
  expect(files.size).toBe(3);
  await expect(store.setGalleryStatus('saving-gallery', output)).rejects.toThrow('RECOVERY_STALE');
});
test('corrupt or incompatible metadata is preserved until explicit discard; expiry cleans only managed files', async () => {
  const { store, io, replace, raw, advance } = setup(); await store.checkpoint(draft, snapshot, output);
  const valid = parseRecovery(raw()!, 'renderer/lut-hash'); replace({ ...valid, fingerprint: 'future-version' });
  const count = io.prune.mock.calls.length; await expect(store.load()).rejects.toThrow('RECOVERY_VERSION');
  expect(io.prune).toHaveBeenCalledTimes(count); expect(io.clear).not.toHaveBeenCalled();
  replace(valid); advance(RECOVERY_TTL); expect(await store.load()).toBeNull(); expect(raw()).toBeNull();
  expect(io.prune).toHaveBeenLastCalledWith([]);
});
test('failed restore leaves durable files intact and cleans partial working copies', async () => {
  const { store, io, raw, files } = setup(); await store.checkpoint(draft, snapshot, output); const before = raw();
  io.restore.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('checksum'));
  await expect(store.resume()).rejects.toThrow('checksum');
  expect(raw()).toBe(before); expect(files.size).toBe(2); expect(io.removeWorking).toHaveBeenCalledTimes(2);
  await store.resume(); expect(io.restore).toHaveBeenCalledTimes(4);
});
test('delete failure never prunes persistent files; queued writes cannot overtake discard', async () => {
  const { store, io, files } = setup(); await store.checkpoint(draft, snapshot, output);
  io.clear.mockRejectedValueOnce(new Error('disk')); await expect(store.discard()).rejects.toThrow(); expect(files.size).toBe(2);
  const updating = store.setGalleryStatus('saving-gallery', output); const discarding = store.discard();
  await updating; await discarding; expect(files.size).toBe(0); expect(await store.load()).toBeNull();
});
test('parser rejects unsafe filenames, invalid values, stale look versions and oversized dimensions', async () => {
  const { store, raw } = setup(); await store.checkpoint(draft, snapshot, output);
  const valid = parseRecovery(raw()!, 'renderer/lut-hash');
  const changes: Partial<RecoveryRecord>[] = [
    { source: { ...valid.source, name: '../source.jpg' } }, { output: { ...valid.output, width: 100_000 } },
    { snapshot: { ...snapshot, grainSeed: -1 } }, { snapshot: { ...snapshot, stampDate: 261332 } },
    { snapshot: { ...snapshot, settings: { ...snapshot.settings, intensity: 2 } } },
    { snapshot: { ...snapshot, settings: { ...snapshot.settings, lookVersion: 'unknown' } } },
    { expiresAt: valid.updatedAt - 1 },
  ];
  for (const change of changes) expect(() => parseRecovery(JSON.stringify({ ...valid, ...change }), 'renderer/lut-hash')).toThrow();
});
