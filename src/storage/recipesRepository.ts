import type { SQLiteDatabase } from 'expo-sqlite';
import { assertRecipeId, readRecipe, recipeName, RECIPE_LIMIT, RECIPE_SCHEMA_VERSION, type Recipe } from '../domain/recipes/recipe';
import type { RecipesRepository } from '../domain/recipes/recipeStore';
import { recipeFingerprint } from './recipeCatalog';
import { withLocalDatabase } from './localDatabase';

async function readRecipes(db: SQLiteDatabase): Promise<readonly Recipe[]> {
  const rows = await db.getAllAsync<{ id: unknown; name: unknown; schema_version: unknown; payload: unknown }>(
    'SELECT id, name, schema_version, payload FROM recipes ORDER BY created_at DESC, id');
  return Object.freeze(rows.map(row => {
    if (typeof row.id !== 'string' || typeof row.name !== 'string') throw new Error('RECIPE_ROW');
    return readRecipe(row.id, row.name, row.schema_version, row.payload, recipeFingerprint);
  }));
}
async function writeRecipes(db: SQLiteDatabase, write: (transaction: SQLiteDatabase) => Promise<void>) {
  let saved: readonly Recipe[] | undefined;
  await db.withExclusiveTransactionAsync(async transaction => {
    await write(transaction);
    saved = await readRecipes(transaction);
  });
  if (!saved) throw new Error('Recipes transaction did not complete');
  return saved;
}
export const recipesRepository: RecipesRepository = {
  list: () => withLocalDatabase(readRecipes),
  create(draft) {
    assertRecipeId(draft.id);
    const name = recipeName(draft.name);
    if (!readRecipe(draft.id, name, RECIPE_SCHEMA_VERSION, draft.payload, recipeFingerprint).available ||
      !Number.isFinite(Date.parse(draft.createdAt))) throw new Error('RECIPE_DRAFT');
    return withLocalDatabase(db => writeRecipes(db, async transaction => {
      const count = await transaction.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM recipes');
      if (!count || count.count >= RECIPE_LIMIT) throw new Error('RECIPE_LIMIT');
      await transaction.runAsync('INSERT INTO recipes (id, name, payload, schema_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        draft.id, name, draft.payload, RECIPE_SCHEMA_VERSION, draft.createdAt, draft.createdAt);
    }));
  },
  rename(id, input) {
    assertRecipeId(id);
    const name = recipeName(input);
    return withLocalDatabase(db => writeRecipes(db, async transaction => {
      const result = await transaction.runAsync('UPDATE recipes SET name = ?, updated_at = ? WHERE id = ?', name, new Date().toISOString(), id);
      if (result.changes !== 1) throw new Error('RECIPE_MISSING');
    }));
  },
  remove(id) {
    assertRecipeId(id);
    return withLocalDatabase(db => writeRecipes(db, async transaction => {
      const result = await transaction.runAsync('DELETE FROM recipes WHERE id = ?', id);
      if (result.changes !== 1) throw new Error('RECIPE_MISSING');
    }));
  },
};
