import { availableFavorites, FavoritesStore, type FavoriteFilterId, type FavoritesRepository } from '../../src/domain/filters/favorites';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function memoryRepository(initial: readonly FavoriteFilterId[] = []) {
  let disk = [...initial];
  const repository: FavoritesRepository = {
    async list() { return [...disk]; },
    async set(id, favorite) {
      disk = favorite ? [...new Set([...disk, id])] : disk.filter(item => item !== id);
      return [...disk];
    },
  };
  return repository;
}

// Domain request ordering only: no native SQLite persistence or device/UI evidence.
test('favorites exclude original/unknown/duplicate IDs without mutating the source list', () => {
  const input = ['retro-rose', 'future-look', 'original', 'retro-rose', 42, 'time-summer'];
  expect(availableFavorites(input)).toEqual(['retro-rose', 'time-summer']);
  expect(input).toContain('future-look');
  expect(Object.isFrozen(availableFavorites(input))).toBe(true);
});

test('confirmed favorites load into a new store and removal preserves the remaining order', async () => {
  const repository = memoryRepository();
  const first = new FavoritesStore(repository);
  await first.load();
  await first.toggle('retro-rose'); await first.toggle('time-summer');
  const second = new FavoritesStore(repository);
  await second.load();
  expect(second.getSnapshot().ids).toEqual(['retro-rose', 'time-summer']);
  await second.toggle('retro-rose');
  expect(second.getSnapshot().ids).toEqual(['time-summer']);
  await second.toggle('retro-rose');
  expect(second.getSnapshot().ids).toEqual(['time-summer', 'retro-rose']);
  expect(await second.toggle('original')).toBe('ignored');
});

test('startup hydration blocks writes and duplicate reloads without overwriting stored favorites', async () => {
  const pending = deferred<readonly FavoriteFilterId[]>();
  const repository = { list: jest.fn(() => pending.promise), set: jest.fn() };
  const store = new FavoritesStore(repository);
  const loading = store.load();
  await store.load();
  expect(await store.toggle('time-summer')).toBe('ignored');
  expect(repository.list).toHaveBeenCalledTimes(1);
  expect(repository.set).not.toHaveBeenCalled();
  pending.resolve(['retro-rose']); await loading;
  expect(store.getSnapshot()).toEqual({ ids: ['retro-rose'], phase: 'ready' });
});

test('a pending write neither lights a star early nor permits conflicting rapid toggles/reloads', async () => {
  const pending = deferred<readonly FavoriteFilterId[]>();
  const repository = { list: jest.fn(async () => [] as FavoriteFilterId[]), set: jest.fn(() => pending.promise) };
  const store = new FavoritesStore(repository); await store.load();
  const writing = store.toggle('retro-rose');
  expect(store.getSnapshot()).toEqual({ ids: [], phase: 'saving' });
  expect(await store.toggle('retro-rose')).toBe('ignored');
  expect(await store.toggle('time-summer')).toBe('ignored');
  await store.load();
  expect(repository.list).toHaveBeenCalledTimes(1);
  expect(repository.set).toHaveBeenCalledTimes(1);
  pending.resolve(['retro-rose']); expect(await writing).toBe('saved');
  expect(store.getSnapshot()).toEqual({ ids: ['retro-rose'], phase: 'ready' });
});

test('an uncertain write preserves the old UI until a reload reconciles the disk result', async () => {
  let disk: FavoriteFilterId[] = ['retro-rose'];
  const repository = { list: jest.fn(async () => disk), set: jest.fn(async () => {
    disk = []; throw new Error('connection failed after commit');
  }) };
  const store = new FavoritesStore(repository); await store.load();
  expect(await store.toggle('retro-rose')).toBe('failed');
  expect(store.getSnapshot()).toMatchObject({ ids: ['retro-rose'], phase: 'error' });
  expect(await store.toggle('time-summer')).toBe('ignored');
  expect(repository.set).toHaveBeenCalledTimes(1);
  await store.load();
  expect(store.getSnapshot()).toEqual({ ids: [], phase: 'ready' });
});

test('read failure retains known favorites, can be retried, and detached listeners receive no updates', async () => {
  const repository = { ...memoryRepository(['retro-rose']), list: jest.fn(async () => ['retro-rose'] as FavoriteFilterId[]) };
  const store = new FavoritesStore(repository);
  const listener = jest.fn(); const unsubscribe = store.subscribe(listener);
  await store.load();
  repository.list.mockRejectedValueOnce(new Error('storage unavailable'));
  await store.load();
  expect(store.getSnapshot()).toMatchObject({ ids: ['retro-rose'], phase: 'error' });
  unsubscribe(); listener.mockClear();
  await store.load();
  expect(store.getSnapshot().phase).toBe('ready');
  expect(listener).not.toHaveBeenCalled();
});
