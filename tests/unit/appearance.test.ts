import { AppearanceStore, parseAppearance, resolveAppearance, serializeAppearance,
  type AppearanceRepository } from '../../src/domain/settings/appearance';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}
function setup(initial: string | null = null) {
  let disk = initial;
  const repository: jest.Mocked<AppearanceRepository> = {
    read: jest.fn(async () => disk), write: jest.fn(async raw => { disk = raw; }),
  };
  return { repository, make: () => new AppearanceStore(repository), disk: () => disk };
}
test('system is the default and follows system changes; explicit choices override the device', () => {
  expect(parseAppearance(null)).toBe('system');
  expect(resolveAppearance('system', 'dark')).toBe('dark');
  expect(resolveAppearance('system', 'light')).toBe('light');
  expect(resolveAppearance('system', undefined)).toBe('light');
  expect(resolveAppearance('system', 'unspecified')).toBe('light');
  expect(resolveAppearance('light', 'dark')).toBe('light');
  expect(resolveAppearance('dark', 'light')).toBe('dark');
});
test.each(['system', 'light', 'dark'] as const)('round-trips %s without camera settings or photo data', preference => {
  expect(parseAppearance(serializeAppearance(preference))).toBe(preference);
  expect(JSON.parse(serializeAppearance(preference))).toEqual({ schemaVersion: 1, preference });
});
test.each(['{', 'null', '1', '{}', '{"schemaVersion":2,"preference":"dark"}',
  '{"schemaVersion":1,"preference":"sepia"}'])('rejects unsupported preference data: %s', raw => {
  expect(() => parseAppearance(raw)).toThrow();
});
test('hydration blocks a late read from replacing a user selection and does not write defaults', async () => {
  const { repository, make } = setup();
  const pending = deferred<string | null>(); repository.read.mockReturnValueOnce(pending.promise);
  const store = make(); const loading = store.load(); await store.load(); await store.select('light');
  expect(repository.read).toHaveBeenCalledTimes(1); expect(repository.write).not.toHaveBeenCalled();
  pending.resolve(serializeAppearance('dark')); await loading;
  expect(store.getSnapshot()).toMatchObject({ preference: 'dark', loading: false });
  expect(repository.write).not.toHaveBeenCalled();
});
test('a chosen mode applies immediately while pending writes block double taps, then survives a fresh store', async () => {
  const { repository, make, disk } = setup(); const store = make(); await store.load();
  const pending = deferred<void>(); repository.write.mockReturnValueOnce(pending.promise);
  const saving = store.select('dark');
  expect(store.getSnapshot()).toMatchObject({ preference: 'dark', saving: true });
  await store.select('light'); expect(repository.write).toHaveBeenCalledTimes(1);
  pending.resolve(); await saving;
  expect(store.getSnapshot()).toMatchObject({ preference: 'dark', saving: false });
  await store.select('light'); expect(parseAppearance(disk())).toBe('light');
  const fresh = make(); await fresh.load(); expect(fresh.getPreference()).toBe('light');
  await fresh.select('system'); const automatic = make(); await automatic.load();
  expect(automatic.getPreference()).toBe('system');
});
test('failed saves keep the visible mode and require explicit retry; no success is claimed', async () => {
  const { repository, make, disk } = setup(); const store = make(); await store.load();
  repository.write.mockRejectedValueOnce(new Error('disk full')); await store.select('dark');
  expect(store.getSnapshot()).toMatchObject({ preference: 'dark', saving: false, error: 'write' });
  expect(disk()).toBeNull(); await Promise.resolve(); expect(repository.write).toHaveBeenCalledTimes(1);
  await store.select('dark'); expect(store.getSnapshot().error).toBeUndefined();
  expect(parseAppearance(disk())).toBe('dark');
});
test('unreadable records stay untouched until explicit choice; reads can be retried', async () => {
  const { repository, make, disk } = setup('{"schemaVersion":2,"preference":"dark"}');
  const store = make(); await store.load();
  expect(store.getSnapshot()).toMatchObject({ preference: 'system', loading: false, error: 'read' });
  expect(repository.write).not.toHaveBeenCalled(); expect(disk()).toContain('"schemaVersion":2');
  repository.read.mockResolvedValueOnce(serializeAppearance('light')); await store.load();
  expect(store.getSnapshot()).toMatchObject({ preference: 'light', error: undefined });
  const corrupt = make(); await corrupt.load(); await corrupt.select('system');
  expect(parseAppearance(disk())).toBe('system');
});
test('subscriptions clean up and pending writes cannot be replaced by a reload', async () => {
  const { repository, make } = setup(); const store = make(); const listener = jest.fn();
  const off = store.subscribe(listener); await store.load(); expect(listener).toHaveBeenCalled();
  off(); listener.mockClear();
  const pending = deferred<void>(); repository.write.mockReturnValueOnce(pending.promise);
  const saving = store.select('dark'); await store.load(); expect(repository.read).toHaveBeenCalledTimes(1);
  pending.resolve(); await saving; expect(listener).not.toHaveBeenCalled();
});
