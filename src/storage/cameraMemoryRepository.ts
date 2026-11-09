import type { CameraMemoryRepository } from '../domain/filters/cameraMemoryStore';
import { parseCameraMemory } from '../domain/filters/cameraMemory';
import { withLocalDatabase } from './localDatabase';
import { recipeFingerprint } from './recipeCatalog';

const KEY = 'camera-memory';
export const cameraMemoryRepository: CameraMemoryRepository = {
  read: () => withLocalDatabase(async db => {
    const row = await db.getFirstAsync<{ value_json: unknown }>('SELECT value_json FROM app_settings WHERE key = ?', KEY);
    if (!row) return null;
    if (typeof row.value_json !== 'string') throw new Error('CAMERA_MEMORY_ROW');
    return row.value_json;
  }),
  async write(raw) {
    parseCameraMemory(raw, recipeFingerprint);
    await withLocalDatabase(db => db.withExclusiveTransactionAsync(async transaction => {
      await transaction.runAsync(`INSERT INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`, KEY, raw, new Date().toISOString());
      const row = await transaction.getFirstAsync<{ value_json: unknown }>('SELECT value_json FROM app_settings WHERE key = ?', KEY);
      if (row?.value_json !== raw) throw new Error('CAMERA_MEMORY_WRITE');
    }));
  },
};
