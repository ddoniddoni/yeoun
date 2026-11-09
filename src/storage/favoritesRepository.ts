import type { SQLiteDatabase } from 'expo-sqlite';
import { availableFavorites, isFavoriteFilterId, type FavoriteFilterId, type FavoritesRepository } from '../domain/filters/favorites';
import { withLocalDatabase } from './localDatabase';

async function readFavorites(db: SQLiteDatabase): Promise<readonly FavoriteFilterId[]> {
  const rows = await db.getAllAsync<{ filter_id: unknown }>(
    'SELECT filter_id FROM favorite_filters ORDER BY sort_order, filter_id');
  if (rows.some(row => typeof row.filter_id !== 'string')) throw new Error('Invalid favorite row');
  return availableFavorites(rows.map(row => row.filter_id));
}

export const favoritesRepository: FavoritesRepository = {
  list: () => withLocalDatabase(readFavorites),
  async set(id, favorite) {
    if (!isFavoriteFilterId(id)) throw new Error('Unsupported favorite filter');
    return withLocalDatabase(async db => {
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
    });
  },
};
