import { Directory, File, Paths } from 'expo-file-system';
const root = new Directory(Paths.cache, 'yeoun-m0');
export type DraftFileName = 'source.jpg' | 'filtered.jpg' | `filtered-${number}.jpg` | 'comparison-original.jpg';
export function draftFile(id: string, name: DraftFileName): File {
  const directory = new Directory(root, id);
  directory.create({ intermediates: true, idempotent: true });
  return new File(directory, name);
}
export async function removeFile(uri: string) {
  try { const file = new File(uri); if (file.exists) file.delete(); }
  catch { console.warn('M0 temporary file cleanup failed; clear app cache if needed.'); }
}
// M0 caches are session-only, no recovery UI. M5 owns persistent recovery/backup policy.
export function clearPreviousSession() {
  if (root.exists) root.delete();
  root.create({ intermediates: true, idempotent: true });
}
