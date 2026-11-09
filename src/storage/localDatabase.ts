import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA_VERSION = 3;
let database: Promise<SQLiteDatabase> | undefined;
let queue: Promise<unknown> = Promise.resolve();

export async function migrateLocalDatabase(db: SQLiteDatabase): Promise<void> {
  await db.withExclusiveTransactionAsync(async transaction => {
    const row = await transaction.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version;
    if (version !== 0 && version !== 1 && version !== 2 && version !== SCHEMA_VERSION) throw new Error('Unsupported local database version');
    if (version === 0) await transaction.execAsync(`
      CREATE TABLE favorite_filters (
        filter_id TEXT PRIMARY KEY NOT NULL,
        sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
        created_at TEXT NOT NULL
      );
    `);
    if (version < 2) await transaction.execAsync(`
      CREATE TABLE recipes (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        payload TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    if (version < 3) await transaction.execAsync(`
      CREATE TABLE app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      PRAGMA user_version = 3;
    `);
  });
}

async function openLocalDatabase(): Promise<SQLiteDatabase> {
  const { openDatabaseAsync } = await import('expo-sqlite');
  const db = await openDatabaseAsync('yeoun.db', { useNewConnection: true });
  try {
    await migrateLocalDatabase(db);
    await db.execAsync('PRAGMA journal_mode = WAL');
    return db;
  } catch (error) {
    try { await db.closeAsync(); } catch { /* Preserve the initialization error. */ }
    throw error;
  }
}

// Favorites, recipes and settings share initialization and an operation queue. Transactions never
// overlap across features, and an earlier failure cannot poison the queue.
export function withLocalDatabase<T>(work: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  const task = queue.then(async () => {
    database ??= openLocalDatabase().catch(error => { database = undefined; throw error; });
    return work(await database);
  });
  queue = task.catch(() => undefined);
  return task;
}
