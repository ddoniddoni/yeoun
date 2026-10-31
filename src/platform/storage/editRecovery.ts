import { requireOptionalNativeModule } from 'expo';
import { randomUUID } from 'expo-crypto';
import { RecoveryStore } from '../../domain/capture/recoveryStore';
import { draftFile, removeFile } from '../files/drafts';
import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/filter-manifest.json';
import { SPATIAL_BACKEND_VERSION } from '../../rendering/shaders/spatial';
import { LUT_SKIA_BACKEND_VERSION } from '../../rendering/shaders/lut';

interface RecoveryModule {
  recoveryDirectoryAsync(): Promise<string>;
  stashRecoveryFileAsync(uri: string, name: string): Promise<{ bytes: number; sha256: string }>;
  restoreRecoveryFileAsync(name: string, bytes: number, sha256: string, uri: string): Promise<void>;
  pruneRecoveryFilesAsync(keep: string[]): Promise<void>;
}
function native() {
  const module = requireOptionalNativeModule<RecoveryModule>('YeounPhotoImport');
  if (!module || typeof module.recoveryDirectoryAsync !== 'function') {
    throw new Error('편집 보관 기능을 준비하지 못했어요. 최신 앱을 설치한 뒤 다시 열어 주세요.');
  }
  return module;
}
let database: Promise<import('expo-sqlite').SQLiteDatabase> | undefined;
function db() {
  if (!database) database = (async () => {
    const directory = await native().recoveryDirectoryAsync();
    const { openDatabaseAsync } = await import('expo-sqlite');
    const connection = await openDatabaseAsync('recovery.db', {}, directory);
    try {
      const version = await connection.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      if (!version || (version.user_version !== 0 && version.user_version !== 1)) throw new Error('RECOVERY_SCHEMA');
      await connection.execAsync('PRAGMA synchronous = FULL;');
      // Single-row UPSERT/DELETE each use SQLite's own atomic transaction.
      if (version.user_version === 0) await connection.execAsync(`BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS draft_checkpoint (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);
        PRAGMA user_version = 1; COMMIT;`);
      return connection;
    } catch (error) { await connection.closeAsync(); throw error; }
  })().catch(error => { database = undefined; throw error; });
  return database;
}
export const editRecovery = new RecoveryStore({
  read: async () => (await (await db()).getFirstAsync<{ payload: string }>('SELECT payload FROM draft_checkpoint WHERE id = 1'))?.payload ?? null,
  write: async value => { await (await db()).runAsync('INSERT INTO draft_checkpoint (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload', value); },
  clear: async () => { await (await db()).runAsync('DELETE FROM draft_checkpoint WHERE id = 1'); },
  stash: (uri, name) => native().stashRecoveryFileAsync(uri, name),
  restore: (file, uri) => native().restoreRecoveryFileAsync(file.name, file.bytes, file.sha256, uri),
  removeWorking: removeFile,
  prune: keep => native().pruneRecoveryFilesAsync(keep),
  workingUri: (id, name) => draftFile(id, name).uri,
  id: () => randomUUID().toLowerCase(), now: () => Date.now(),
}, `${manifest.sourceSeedSha256}/${SPATIAL_BACKEND_VERSION}/${LUT_SKIA_BACKEND_VERSION}`);
