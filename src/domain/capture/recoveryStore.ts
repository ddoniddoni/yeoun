import type { Draft, Output, Snapshot } from './controller';
import { parseRecovery, RECOVERY_TTL, type GalleryStatus, type RecoveryFile, type RecoveryPort, type RecoveryRecord, type RestoredCapture } from './recovery';

export interface RecoveryStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  clear(): Promise<void>;
  stash(uri: string, name: string): Promise<{ bytes: number; sha256: string }>;
  restore(file: RecoveryFile, uri: string): Promise<void>;
  removeWorking(uri: string): Promise<void>;
  prune(keep: string[]): Promise<void>;
  workingUri(id: string, name: 'source.jpg' | 'filtered.jpg'): string;
  id(): string;
  now(): number;
}
// One slot, one serialized owner. A checkpoint's successful journal commit is the acceptance boundary.
export class RecoveryStore implements RecoveryPort {
  private tail: Promise<unknown> = Promise.resolve();
  private accepted?: { uri: string; name: string };
  constructor(private io: RecoveryStorage, private fingerprint: string) {}
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const next = this.tail.then(work, work); this.tail = next.catch(() => undefined); return next;
  }
  private async read(): Promise<RecoveryRecord | null> {
    const raw = await this.io.read(); return raw === null ? null : parseRecovery(raw, this.fingerprint);
  }
  private async prune(record: RecoveryRecord | null) {
    try { await this.io.prune(record ? [record.source.name, record.output.name] : []); }
    catch { console.warn('Recovery file cleanup deferred.'); }
  }
  private async commit(record: RecoveryRecord) {
    const raw = JSON.stringify(record);
    parseRecovery(raw, this.fingerprint);
    try { await this.io.write(raw); }
    catch (error) {
      // A bridge error may arrive AFTER SQLite committed. Preserve all files if read-back also fails.
      if (await this.io.read() !== raw) throw error;
    }
  }
  load(): Promise<RecoveryRecord | null> {
    return this.serial(async () => {
      const record = await this.read();
      if (record && this.io.now() >= record.expiresAt) {
        await this.io.clear(); this.accepted = undefined; await this.prune(null); return null;
      }
      await this.prune(record); return record;
    });
  }
  resume(): Promise<RestoredCapture> {
    return this.serial(async () => {
      const record = await this.read();
      if (!record || this.io.now() >= record.expiresAt) throw new Error('RECOVERY_EXPIRED');
      // A new directory on every attempt avoids overwriting a partially restored working copy.
      const id = this.io.id();
      const sourceUri = this.io.workingUri(id, 'source.jpg'), uri = this.io.workingUri(id, 'filtered.jpg');
      try { await this.io.restore(record.source, sourceUri); await this.io.restore(record.output, uri); }
      catch (error) {
        await Promise.allSettled([this.io.removeWorking(sourceUri), this.io.removeWorking(uri)]);
        throw error;
      }
      this.accepted = { uri, name: record.output.name };
      return { draft: { ...record.draft, sourceUri }, snapshot: record.snapshot,
        output: { uri, width: record.output.width, height: record.output.height, bytes: record.output.bytes },
        galleryStatus: record.galleryStatus };
    });
  }
  checkpoint(draft: Draft, snapshot: Snapshot, output: Output): Promise<void> {
    return this.serial(async () => {
      const previous = await this.read();
      if (previous && previous.snapshot.id !== snapshot.id) throw new Error('RECOVERY_OCCUPIED');
      const sourceName = `source-${this.io.id()}.jpg`, outputName = `output-${this.io.id()}.jpg`;
      const source = previous?.source ?? { name: sourceName, ...await this.io.stash(draft.sourceUri, sourceName) };
      const result = await this.io.stash(output.uri, outputName);
      if (result.bytes !== output.bytes) throw new Error('RECOVERY_SIZE');
      const now = this.io.now();
      const record: RecoveryRecord = { schemaVersion: 1, fingerprint: this.fingerprint, snapshot,
        draft: { width: draft.width, height: draft.height, orientation: draft.orientation, mirrored: draft.mirrored, imported: draft.imported },
        source, output: { name: outputName, ...result, width: output.width, height: output.height },
        galleryStatus: 'not-saved', updatedAt: now, expiresAt: now + RECOVERY_TTL };
      await this.commit(record);
      this.accepted = { uri: output.uri, name: outputName };
      await this.prune(record);
    });
  }
  setGalleryStatus(galleryStatus: GalleryStatus, output: Output): Promise<void> {
    return this.serial(async () => {
      const record = await this.read();
      if (!record || this.accepted?.uri !== output.uri || this.accepted.name !== record.output.name) throw new Error('RECOVERY_STALE');
      const now = this.io.now();
      await this.commit({ ...record, galleryStatus, updatedAt: now, expiresAt: now + RECOVERY_TTL });
    });
  }
  discard(): Promise<void> {
    return this.serial(async () => {
      // No file removal before the journal delete succeeds; saved album assets are never touched.
      await this.io.clear(); this.accepted = undefined; await this.prune(null);
    });
  }
}
