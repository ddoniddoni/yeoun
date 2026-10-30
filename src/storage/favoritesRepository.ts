import type { SQLiteDatabase } from 'expo-sqlite';
import { availableFavorites, isFavoriteFilterId, type FavoriteFilterId, type FavoritesRepository } from '../domain/filters/favorites';

const SCHEMA_VERSION = 1;
let database: Promise<SQLiteDatabase> | undefined;

async function migrateFavorites(db: SQLiteDatabase): Promise<void> {
  await db.withExclusiveTransactionAsync(async transaction => {
    const row = await transaction.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version;
    if (version !== 0 && version !== SCHEMA_VERSION) throw new Error('Unsupported local database version');
    if (version === 0) {
      await transaction.execAsync(`
        CREATE TABLE favorite_filters (
          filter_id TEXT PRIMARY KEY NOT NULL,
          sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
          created_at TEXT NOT NULL
        );
        PRAGMA user_version = 1;
      `);
    }
  });
}

async function openFavoritesDatabase(): Promise<SQLiteDatabase> {
  // A stale development binary may lack this native module. Keep failure inside the feature.
  const { openDatabaseAsync } = await import('expo-sqlite');
  const db = await openDatabaseAsync('yeoun.db', { useNewConnection: true });
  try {
    await db.execAsync('PRAGMA journal_mode = WAL');
    await migrateFavorites(db);
    return db;
  } catch (error) {
    try { await db.closeAsync(); } catch { /* Preserve the initialization error. */ }
    throw error;
  }
}

function getDatabase(): Promise<SQLiteDatabase> {
  // One connection for the app lifetime, shared by camera and result panels. No close per render.
  database ??= openFavoritesDatabase().catch(error => { database = undefined; throw error; });
  return database;
}

async function readFavorites(db: SQLiteDatabase): Promise<readonly FavoriteFilterId[]> {
  const rows = await db.getAllAsync<{ filter_id: unknown }>(
    'SELECT filter_id FROM favorite_filters ORDER BY sort_order, filter_id');
  if (rows.some(row => typeof row.filter_id !== 'string')) throw new Error('Invalid favorite row');
  return availableFavorites(rows.map(row => row.filter_id));
}

export const favoritesRepository: FavoritesRepository = {
  async list() { return readFavorites(await getDatabase()); },
  async set(id, favorite) {
    if (!isFavoriteFilterId(id)) throw new Error('Unsupported favorite filter');
    const db = await getDatabase();
    let saved: readonly FavoriteFilterId[] | undefined;
    await db.withExclusiveTransactionAsync(async transaction => {
      if (favorite) {
        await transaction.runAsync(`
          INSERT INTO favorite_filters (filter_id, sort_order, created_at)
          SELECT ?, COALESCE(MAX(sort_order), -1) + 1, ? FROM favorite_filters WHERE true
          ON CONFLICT(filter_id) DO NOTHING
        `, id, new Date().toISOString());
      } else {
        await transaction.runAsync('DELETE FROM favorite_filters WHERE filter_id = ?', id);
      }
      saved = await readFavorites(transaction);
    });
    if (!saved) throw new Error('Favorites transaction did not complete');
    return saved;
  },
};
