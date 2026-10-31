import { Directory, File, Paths } from 'expo-file-system';
import { createShareCopy, clearExpiredSharedPhotos, SHARE_RETENTION_MS } from '../../src/platform/files/sharedPhotos';
import { clearPreviousSession } from '../../src/platform/files/drafts';

jest.mock('expo-crypto', () => {
  let sequence = 0;
  return { randomUUID: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` };
});
// Only models file identity and failures; it is not evidence of native disk behavior.
jest.mock('expo-file-system', () => {
  type Entry = { kind: 'file' | 'directory'; body?: string };
  const entries = new Map<string, Entry>();
  const faults = { copy: false, write: false };
  const join = (parts: (string | { uri: string })[]) => parts.map(part => typeof part === 'string' ? part : part.uri).join('/').replace(/\/+$/, '');
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) { this.uri = join(parts); }
    get name() { return this.uri.slice(this.uri.lastIndexOf('/') + 1); }
    get exists() { return entries.get(this.uri)?.kind === 'directory'; }
    create(options?: { idempotent?: boolean }) {
      if (this.exists && !options?.idempotent) throw new Error('exists');
      entries.set(this.uri, { kind: 'directory' });
    }
    list() {
      const prefix = `${this.uri}/`;
      return [...entries].filter(([uri]) => uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/'))
        .map(([uri, entry]) => entry.kind === 'directory' ? new Directory(uri) : new File(uri));
    }
    delete() { for (const uri of entries.keys()) if (uri === this.uri || uri.startsWith(`${this.uri}/`)) entries.delete(uri); }
  }
  class File {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) { this.uri = join(parts); }
    get exists() { return entries.get(this.uri)?.kind === 'file'; }
    get size() { return entries.get(this.uri)?.body?.length ?? 0; }
    get parentDirectory() { return new Directory(this.uri.slice(0, this.uri.lastIndexOf('/'))); }
    textSync() { if (!this.exists) throw new Error('missing'); return entries.get(this.uri)?.body ?? ''; }
    write(body: string) { if (faults.write) throw new Error('disk full'); entries.set(this.uri, { kind: 'file', body }); }
    copy(to: File) { to.write(faults.copy ? 'partial' : this.textSync()); if (faults.copy) throw new Error('copy failed'); }
    delete() { entries.delete(this.uri); }
  }
  return { Directory, File, Paths: { cache: new Directory('file:///cache') }, __entries: entries, __faults: faults };
});
const storage = jest.requireMock<{ __entries: Map<string, unknown>; __faults: { copy: boolean; write: boolean } }>('expo-file-system');
const root = new Directory(Paths.cache, 'yeoun-shares');
const source = new File(Paths.cache, 'yeoun-m0', 'capture', 'filtered.jpg');
const output = { uri: source.uri, width: 100, height: 100, bytes: 9 };
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date('2026-10-31T00:00:00Z'));
  storage.__entries.clear(); storage.__faults.copy = false; storage.__faults.write = false;
  new Directory(Paths.cache, 'yeoun-m0').create(); source.write('jpeg-data');
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

test('an immutable share copy survives replacing the original and session cleanup', () => {
  const first = createShareCopy(output); first.finish();
  source.write('new-image'); const second = createShareCopy(output); second.finish();
  expect(first.uri).not.toBe(second.uri); clearPreviousSession();
  expect(source.exists).toBe(false);
  expect(new File(first.uri).textSync()).toBe('jpeg-data');
  expect(new File(second.uri).textSync()).toBe('new-image');
  clearExpiredSharedPhotos(); expect(root.list()).toHaveLength(2);
});
test('pending readers never expire; native completion starts a new 24-hour retention window', () => {
  const copy = createShareCopy(output);
  jest.setSystemTime(Date.now() + 2 * SHARE_RETENTION_MS);
  clearExpiredSharedPhotos(); expect(new File(copy.uri).exists).toBe(true);
  copy.finish(); copy.finish();
  jest.setSystemTime(Date.now() + SHARE_RETENTION_MS - 1);
  clearExpiredSharedPhotos(); expect(new File(copy.uri).exists).toBe(true);
  jest.setSystemTime(Date.now() + 1);
  clearExpiredSharedPhotos(); expect(new File(copy.uri).exists).toBe(false);
  expect(source.textSync()).toBe('jpeg-data');
});
test('unknown directories, malformed records and future leases are not deleted', () => {
  const copy = createShareCopy(output); copy.finish();
  const lease = new File(new File(copy.uri).parentDirectory, 'retained-at');
  const unknown = new Directory(root, 'unrelated'); unknown.create();
  jest.setSystemTime(Date.now() + 2 * SHARE_RETENTION_MS);
  for (const record of ['corrupt', '1e3', '', String(Date.now() + SHARE_RETENTION_MS)]) {
    lease.write(record); clearExpiredSharedPhotos(); expect(new File(copy.uri).exists).toBe(true);
  }
  expect(unknown.exists).toBe(true);
});
test('failed preparation removes only the incomplete new copy and retains the accepted image', () => {
  storage.__faults.copy = true;
  expect(() => createShareCopy(output)).toThrow('copy failed');
  expect(root.list()).toHaveLength(0); expect(source.textSync()).toBe('jpeg-data');
  expect(() => createShareCopy({ ...output, bytes: 999 })).toThrow('unavailable');
});
test('failed retention bookkeeping pins the file in this process instead of deleting a handed-off photo', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const copy = createShareCopy(output); storage.__faults.write = true; copy.finish(); storage.__faults.write = false;
  jest.setSystemTime(Date.now() + 2 * SHARE_RETENTION_MS);
  clearExpiredSharedPhotos(); expect(new File(copy.uri).exists).toBe(true);
});
