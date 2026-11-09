import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { serializeRecipe } from '../../src/domain/recipes/recipe';
import { recipeFingerprint } from '../../src/storage/recipeCatalog';
import { migrateLocalDatabase, withLocalDatabase } from '../../src/storage/localDatabase';
import { recipesRepository } from '../../src/storage/recipesRepository';
import { favoritesRepository } from '../../src/storage/favoritesRepository';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
function database(version = 1) {
  const execAsync = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
  const getFirstAsync = jest.fn(async (sql: string) => sql.includes('user_version') ? { user_version: version } : { count: 0 });
  const getAllAsync = jest.fn<Promise<unknown[]>, [string]>(async sql => sql.includes('favorite_filters') ? [{ filter_id: 'retro-film' }] : []);
  const runAsync = jest.fn(async (..._args: unknown[]) => ({ changes: 1, lastInsertRowId: 1 }));
  const closeAsync = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
  const db = { execAsync, getFirstAsync, getAllAsync, runAsync, closeAsync,
    withExclusiveTransactionAsync: jest.fn(async (task: (transaction: SQLiteDatabase) => Promise<void>): Promise<void> => task(db as unknown as SQLiteDatabase)) };
  return { db: db as unknown as SQLiteDatabase, execAsync, getFirstAsync, getAllAsync, runAsync, closeAsync };
}
// These mocks check migration decisions, parameter binding and queue ordering only.
// Native SQLite durability, transaction rollback and app restarts require device checks.
test('schema1 migration adds recipes without rewriting favorites; future versions fail without DDL', async () => {
  const old = database(1); await migrateLocalDatabase(old.db);
  const sql = old.execAsync.mock.calls.map(([statement]) => statement).join('\n');
  expect(sql).toContain('CREATE TABLE recipes'); expect(sql).toContain('PRAGMA user_version = 2');
  expect(sql).not.toContain('favorite_filters'); expect(sql).not.toContain('DROP');
  const current = database(2); await migrateLocalDatabase(current.db); expect(current.execAsync).not.toHaveBeenCalled();
  const future = database(3); await expect(migrateLocalDatabase(future.db)).rejects.toThrow();
  expect(future.execAsync).not.toHaveBeenCalled();
});
test('fresh install creates both tables in one migration; a failed DDL rejects initialization', async () => {
  const fresh = database(0); await migrateLocalDatabase(fresh.db);
  expect(fresh.execAsync.mock.calls.map(([sql]) => sql).join('\n')).toContain('CREATE TABLE favorite_filters');
  const broken = database(1); broken.execAsync.mockRejectedValueOnce(new Error('disk full'));
  await expect(migrateLocalDatabase(broken.db)).rejects.toThrow('disk full');
});
test('shared database retries initialization, serializes features, binds user text, and keeps unsupported recipes manageable', async () => {
  const bad = database(1); bad.execAsync.mockRejectedValueOnce(new Error('disk full'));
  const good = database(1);
  jest.mocked(openDatabaseAsync).mockResolvedValueOnce(bad.db).mockResolvedValueOnce(good.db);
  await expect(recipesRepository.list()).rejects.toThrow('disk full'); expect(bad.closeAsync).toHaveBeenCalled();
  expect(await favoritesRepository.list()).toEqual(['retro-film']);
  const id = '00000000-0000-4000-8000-000000000001';
  const payload = serializeRecipe(cameraSettings('retro-film'), recipeFingerprint);
  await recipesRepository.create({ id, name: "x');--", payload, createdAt: '2026-11-09T01:00:00.000Z' });
  const call = good.runAsync.mock.calls[0]!;
  expect(call[0]).not.toContain("x');--"); expect(call.slice(1)).toContain("x');--");
  good.getAllAsync.mockResolvedValue([{ id, name: '이전 색감', schema_version: 99, payload: 'unavailable' }]);
  expect(await recipesRepository.list()).toEqual([expect.objectContaining({ id, available: false })]);
  await recipesRepository.rename(id, '새 이름');
  const renameSql = good.runAsync.mock.calls[1]![0] as string;
  expect(renameSql).toContain('UPDATE recipes SET name'); expect(renameSql).not.toContain('payload');
  await recipesRepository.remove(id);
  expect(good.runAsync.mock.calls[2]).toEqual(['DELETE FROM recipes WHERE id = ?', id]);
  const writesBeforeLimit = good.runAsync.mock.calls.length;
  good.getFirstAsync.mockResolvedValueOnce({ count: 100 });
  await expect(recipesRepository.create({ id, name: '가득 찬 보관함', payload, createdAt: '2026-11-09T01:00:00.000Z' })).rejects.toThrow('RECIPE_LIMIT');
  expect(good.runAsync).toHaveBeenCalledTimes(writesBeforeLimit);
  expect(() => recipesRepository.remove("x');--")).toThrow('RECIPE_ID');
  let finish!: () => void;
  const gate = new Promise<void>(resolve => { finish = resolve; });
  const events: string[] = [];
  const first = withLocalDatabase(async () => { events.push('first'); await gate; throw new Error('write failed'); });
  const failure = expect(first).rejects.toThrow('write failed');
  const second = withLocalDatabase(async () => { events.push('second'); });
  await Promise.resolve(); await Promise.resolve();
  expect(events).toEqual(['first']); finish(); await failure; await second;
  expect(events).toEqual(['first', 'second']); expect(openDatabaseAsync).toHaveBeenCalledTimes(2);
});
