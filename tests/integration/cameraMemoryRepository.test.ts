import type { SQLiteDatabase } from 'expo-sqlite';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { serializeCameraMemory } from '../../src/domain/filters/cameraMemory';
import { cameraMemoryRepository } from '../../src/storage/cameraMemoryRepository';
import { withLocalDatabase } from '../../src/storage/localDatabase';
import { recipeFingerprint } from '../../src/storage/recipeCatalog';

jest.mock('../../src/storage/localDatabase', () => ({ withLocalDatabase: jest.fn() }));
function setup() {
  const getFirstAsync = jest.fn<Promise<{ value_json: unknown } | null>, [string, string]>();
  const runAsync = jest.fn(async (..._args: unknown[]) => ({ changes: 1, lastInsertRowId: 1 }));
  const transaction = { runAsync, getFirstAsync } as unknown as SQLiteDatabase;
  const withExclusiveTransactionAsync = jest.fn(async (task: (db: SQLiteDatabase) => Promise<void>) => { await task(transaction); });
  const db = { getFirstAsync, withExclusiveTransactionAsync } as unknown as SQLiteDatabase;
  jest.mocked(withLocalDatabase).mockImplementation(work => work(db));
  return { getFirstAsync, runAsync, withExclusiveTransactionAsync };
}
// These mocks inspect binding, readback and commit acknowledgement, not native SQL durability.
test('read distinguishes a missing key from invalid stored types', async () => {
  const { getFirstAsync } = setup(); getFirstAsync.mockResolvedValueOnce(null);
  expect(await cameraMemoryRepository.read()).toBeNull();
  expect(getFirstAsync).toHaveBeenCalledWith('SELECT value_json FROM app_settings WHERE key = ?', 'camera-memory');
  getFirstAsync.mockResolvedValueOnce({ value_json: 1 }); await expect(cameraMemoryRepository.read()).rejects.toThrow();
  getFirstAsync.mockResolvedValueOnce({ value_json: '{' }); expect(await cameraMemoryRepository.read()).toBe('{');
});
test('write binds whitelisted settings and requires matching readback and commit acknowledgement', async () => {
  const { getFirstAsync, runAsync, withExclusiveTransactionAsync } = setup();
  const raw = serializeCameraMemory({ remember: true, camera: { settings: cameraSettings('retro-film'), grid: true } }, recipeFingerprint);
  getFirstAsync.mockResolvedValue({ value_json: raw }); await cameraMemoryRepository.write(raw);
  expect(runAsync.mock.calls[0]).toEqual([expect.stringContaining('ON CONFLICT(key) DO UPDATE'), 'camera-memory', raw, expect.any(String)]);
  expect(runAsync.mock.calls[0]![0]).not.toContain(raw);
  getFirstAsync.mockResolvedValue({ value_json: 'different' }); await expect(cameraMemoryRepository.write(raw)).rejects.toThrow('CAMERA_MEMORY_WRITE');
  withExclusiveTransactionAsync.mockRejectedValueOnce(new Error('commit failed'));
  await expect(cameraMemoryRepository.write(raw)).rejects.toThrow('commit failed');
  const count = runAsync.mock.calls.length;
  await expect(cameraMemoryRepository.write('{')).rejects.toThrow(); expect(runAsync).toHaveBeenCalledTimes(count);
});
