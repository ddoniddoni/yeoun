import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import type { Output } from '../../domain/capture/controller';

export const SHARE_RETENTION_MS = 24 * 60 * 60 * 1000;
const root = new Directory(Paths.cache, 'yeoun-shares');
// Independent of CaptureController: replacing/discarding a result must not remove a handed-off file.
const active = new Set<string>();
const ownedName = /^share-\d+-[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export function clearExpiredSharedPhotos(): void {
  try {
    if (!root.exists) return;
    const now = Date.now();
    for (const entry of root.list()) {
      if (!(entry instanceof Directory) || !ownedName.test(entry.name) || active.has(entry.name)) continue;
      try {
        const lease = new File(entry, 'retained-at');
        // Unknown/corrupt records are preserved instead of guessing whether a receiver is still reading.
        if (!lease.exists || lease.size < 1 || lease.size > 20) continue;
        const record = lease.textSync();
        if (!/^[1-9]\d{0,15}$/.test(record)) continue;
        const retainedAt = Number(record);
        if (Number.isSafeInteger(retainedAt) && retainedAt > 0 && now - retainedAt >= SHARE_RETENTION_MS) entry.delete();
      } catch { console.warn('Expired share copy cleanup deferred.'); }
    }
  } catch { console.warn('Share cache cleanup deferred.'); }
}

export function createShareCopy(output: Output): { uri: string; finish(): void } {
  const source = new File(output.uri);
  if (!Number.isSafeInteger(output.bytes) || output.bytes <= 0 || !source.exists || source.size !== output.bytes) {
    throw new Error('Share source is unavailable');
  }
  clearExpiredSharedPhotos();
  root.create({ intermediates: true, idempotent: true });
  const id = `share-${Date.now()}-${randomUUID()}`;
  const directory = new Directory(root, id);
  directory.create(); // Never delete an existing directory if creation itself fails.
  active.add(id); // Directory listing may normalize a URI's trailing slash differently.
  const lease = new File(directory, 'retained-at');
  const createdAt = Date.now();
  try {
    lease.write(String(createdAt));
    const copy = new File(directory, 'yeoun.jpg');
    source.copy(copy); // File-to-file copy, no decoding, pixel arrays or base64 in JS.
    if (!copy.exists || copy.size !== output.bytes) throw new Error('Share copy is incomplete');
    let finished = false;
    return { uri: copy.uri, finish() {
      if (finished) return;
      finished = true;
      try {
        // A receiving app may read after the sheet closes, including after our app restarts.
        lease.write(String(Math.max(createdAt, Date.now())));
        active.delete(id);
      } catch {
        // Do not let another share clean this file during the current process on bookkeeping failure.
        console.warn('Share copy retention update deferred.');
      }
    } };
  } catch (error) {
    active.delete(id);
    // No native share has seen this URI yet; partial copies can be removed immediately.
    try { directory.delete(); } catch { console.warn('Incomplete share copy cleanup deferred.'); }
    throw error;
  }
}
