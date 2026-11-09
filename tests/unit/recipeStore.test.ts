import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { readRecipe, type Recipe, type RecipeDraft } from '../../src/domain/recipes/recipe';
import { RecipesStore, type RecipesRepository } from '../../src/domain/recipes/recipeStore';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}
function setup() {
  const disk = new Map<string, RecipeDraft>();
  const fingerprint = () => 'version-1';
  const list = async () => [...disk.values()].map(row => readRecipe(row.id, row.name, 1, row.payload, fingerprint));
  const repository: jest.Mocked<RecipesRepository> = {
    list: jest.fn(list),
    create: jest.fn(async draft => { disk.set(draft.id, draft); return list(); }),
    rename: jest.fn(async (id, name) => { disk.set(id, { ...disk.get(id)!, name }); return list(); }),
    remove: jest.fn(async id => { disk.delete(id); return list(); }),
  };
  let sequence = 0;
  const nextId = () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
  return { disk, repository, make: () => new RecipesStore(repository, fingerprint, nextId), fingerprint };
}

// In-memory request ordering tests, not native SQLite or process restart evidence.
test('named custom settings survive a new store; duplicate names are independently renamed and deleted', async () => {
  const { make, disk } = setup(); const first = make(); await first.load();
  const settings = { ...cameraSettings('retro-film'), grain: 0.2 };
  await first.create(' 산책 ', settings); await first.create('산책', cameraSettings('scene-rain'));
  const next = make(); await next.load();
  const [one, two] = next.getSnapshot().items;
  expect(one).toMatchObject({ name: '산책', available: true, settings });
  expect(two?.id).not.toBe(one?.id);
  const payload = disk.get(one!.id)!.payload;
  await next.rename(one!.id, '새 이름');
  expect(disk.get(one!.id)!.payload).toBe(payload);
  await next.remove(one!.id);
  expect(next.getSnapshot().items).toEqual([two]);
});
test('pending hydration blocks mutations and duplicate loads', async () => {
  const { make, repository } = setup(); const pending = deferred<readonly Recipe[]>();
  repository.list.mockReturnValueOnce(pending.promise);
  const store = make(), loading = store.load(); await store.load();
  expect(await store.create('산책', cameraSettings('retro-film'))).toBe('ignored');
  expect(repository.create).not.toHaveBeenCalled();
  expect(repository.list).toHaveBeenCalledTimes(1);
  pending.resolve([]); await loading;
});
test('the settings snapshot cannot change while saving; success is only published after the write resolves', async () => {
  const { make, repository } = setup(); const store = make(); await store.load();
  const pending = deferred<readonly Recipe[]>(); repository.create.mockReturnValueOnce(pending.promise);
  const settings = { ...cameraSettings('retro-film'), grain: 0.2 };
  const writing = store.create('산책', settings); settings.grain = 0.9;
  expect(store.getSnapshot()).toMatchObject({ phase: 'saving', items: [] });
  expect(repository.create.mock.calls[0]![0].payload).toContain('"grain":0.2');
  expect(await store.create('다른 색', settings)).toBe('ignored');
  await store.load(); expect(repository.list).toHaveBeenCalledTimes(1);
  pending.resolve([]); expect(await writing).toBe('saved');
});
test('ambiguous commit blocks further writes until reload reveals the actual stored item', async () => {
  const { make, repository, disk } = setup(); const store = make(); await store.load();
  repository.create.mockImplementationOnce(async draft => { disk.set(draft.id, draft); throw new Error('after commit'); });
  expect(await store.create('산책', cameraSettings('scene-rain'))).toBe('failed');
  expect(store.getSnapshot()).toMatchObject({ phase: 'error', items: [] });
  expect(await store.create('산책', cameraSettings('scene-rain'))).toBe('ignored');
  await store.load(); expect(store.getSnapshot().items).toHaveLength(1);
  expect(store.getSnapshot().phase).toBe('ready');
});
test('failed delete preserves confirmed state and reload failure does not erase it', async () => {
  const { make, repository } = setup(); const store = make(); await store.load();
  await store.create('산책', cameraSettings('scene-rain')); const before = store.getSnapshot().items;
  repository.remove.mockRejectedValueOnce(new Error('disk full'));
  expect(await store.remove(before[0]!.id)).toBe('failed');
  expect(store.getSnapshot().items).toEqual(before);
  repository.list.mockRejectedValueOnce(new Error('disk unavailable')); await store.load();
  expect(store.getSnapshot().items).toEqual(before);
  const listener = jest.fn(); const off = store.subscribe(listener); off();
  await store.load(); expect(listener).not.toHaveBeenCalled();
});
