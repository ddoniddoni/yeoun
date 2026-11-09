import type { SQLiteDatabase } from 'expo-sqlite';
import { serializeAppearance } from '../../src/domain/settings/appearance';
import { appearanceRepository } from '../../src/storage/appearanceRepository';
import { withLocalDatabase } from '../../src/storage/localDatabase';

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
// Contract mocks only: not native SQLite or process-restart durability evidence.
test('reads only the appearance key and rejects non-string rows without overwriting them', async () => {
  const { getFirstAsync, runAsync } = setup(); getFirstAsync.mockResolvedValueOnce(null);
  expect(await appearanceRepository.read()).toBeNull();
  expect(getFirstAsync).toHaveBeenCalledWith('SELECT value_json FROM app_settings WHERE key = ?', 'appearance');
  getFirstAsync.mockResolvedValueOnce({ value_json: 1 }); await expect(appearanceRepository.read()).rejects.toThrow();
  expect(runAsync).not.toHaveBeenCalled();
});
test('writes bind values and require readback and commit before acknowledging success', async () => {
  const { getFirstAsync, runAsync, withExclusiveTransactionAsync } = setup();
  const raw = serializeAppearance('dark'); getFirstAsync.mockResolvedValue({ value_json: raw });
  await appearanceRepository.write(raw);
  expect(runAsync.mock.calls[0]).toEqual([expect.stringContaining('ON CONFLICT(key) DO UPDATE'), 'appearance', raw, expect.any(String)]);
  getFirstAsync.mockResolvedValue({ value_json: serializeAppearance('light') });
  await expect(appearanceRepository.write(raw)).rejects.toThrow('APPEARANCE_WRITE');
  withExclusiveTransactionAsync.mockRejectedValueOnce(new Error('commit failed'));
  await expect(appearanceRepository.write(raw)).rejects.toThrow('commit failed');
  const count = runAsync.mock.calls.length;
  await expect(appearanceRepository.write('{')).rejects.toThrow(); expect(runAsync.mock.calls).toHaveLength(count);
});
