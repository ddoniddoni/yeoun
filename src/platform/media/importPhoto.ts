import { AppState, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { Paths } from 'expo-file-system';
import type { Draft, ImportedPhotoInfo, SelectedPhoto, Snapshot } from '../../domain/capture/controller';
import { draftFile, removeFile } from '../files/drafts';

type PreparedPhoto = ImportedPhotoInfo & { width: number; height: number };
interface PhotoImportModule { prepareAsync(sourceUri: string, destinationUri: string): Promise<PreparedPhoto> }
function nativeImporter() {
  const module = requireOptionalNativeModule<PhotoImportModule>('YeounPhotoImport');
  if (!module) throw new Error('사진 가져오기를 사용할 수 없는 앱 버전이에요. 새 버전으로 업데이트해 주세요.');
  return module;
}

// PHPicker can resolve before its dismissal's active notification. Do not treat
// the system picker as an interrupted render, or start a decoder in background.
async function waitUntilActive(): Promise<void> {
  if (AppState.currentState === 'active') return;
  await new Promise<void>((resolve, reject) => {
    const finish = (active: boolean) => {
      clearTimeout(timer); subscription.remove();
      if (active) resolve(); else reject(new Error('앱으로 돌아온 뒤 사진을 다시 골라 주세요.'));
    };
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') finish(true); });
    const timer = setTimeout(() => finish(false), 30_000);
    if (AppState.currentState === 'active') finish(true);
  });
}

export async function pickLibraryPhoto(): Promise<SelectedPhoto | null> {
  nativeImporter(); // Missing new native modules must not crash the camera at import time.
  let selected: SelectedPhoto | undefined;
  try {
    const picker = await import('expo-image-picker');
    // A destroyed Android activity may leave a late picker result. It is not an
    // accepted draft: clean only its picker copies and let the user choose again.
    if (Platform.OS === 'android') {
      const pending = await picker.getPendingResultAsync();
      if (pending && 'assets' in pending && pending.assets) {
        await Promise.all(pending.assets.map(asset => releasePickedPhoto({ uri: asset.uri })));
      }
    }
    await waitUntilActive();
    const result = await picker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: false, allowsEditing: false, quality: 1,
      preferredAssetRepresentationMode: picker.UIImagePickerPreferredAssetRepresentationMode.Current,
      base64: false, exif: false, legacy: false,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) throw new Error('IMPORT_FILE');
    selected = { uri: asset.uri };
    if (asset.type && asset.type !== 'image' && asset.type !== 'livePhoto') throw new Error('IMPORT_FORMAT');
    // The library picker returns an app-cache copy, not an album URI we own.
    if (!isPickerCopy(selected.uri)) throw new Error('IMPORT_FILE');
    await waitUntilActive();
    return selected;
  } catch {
    if (selected) await releasePickedPhoto(selected);
    throw new Error('사진 선택을 완료하지 못했어요. 기기에 내려받은 사진을 다시 골라 주세요.');
  }
}

function isPickerCopy(uri: string): boolean {
  const prefix = `${Paths.cache.uri.replace(/\/$/, '')}/`;
  try {
    if (!uri.startsWith(prefix)) return false;
    const relative = decodeURIComponent(uri.slice(prefix.length));
    const name = relative.startsWith('ImagePicker/') ? relative.slice('ImagePicker/'.length) : relative;
    if (!name || name === '.' || name === '..' || /[/?#\\]/.test(name)) return false;
    // SDK55 iOS's legacy file-system bridge may generate UUID files directly in Caches.
    return relative.startsWith('ImagePicker/') || /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}\.[\da-z]+$/i.test(name);
  } catch { return false; }
}

export async function releasePickedPhoto(photo: SelectedPhoto): Promise<void> {
  if (isPickerCopy(photo.uri)) await removeFile(photo.uri);
}

export async function prepareLibraryPhoto(photo: SelectedPhoto, snapshot: Snapshot): Promise<Draft> {
  const file = draftFile(snapshot.id, 'source.jpg');
  try {
    if (AppState.currentState !== 'active') throw new Error('IMPORT_BACKGROUND');
    const info = await nativeImporter().prepareAsync(photo.uri, file.uri);
    if (!Number.isSafeInteger(info.width) || !Number.isSafeInteger(info.height) || info.width <= 0 || info.height <= 0 ||
      info.width * info.height > 12_000_000 || Math.max(info.width, info.height) > 4096 ||
      typeof info.resized !== 'boolean' || typeof info.flattened !== 'boolean' || !file.exists || file.size <= 0) {
      throw new Error('IMPORT_DECODE');
    }
    return Object.freeze({ sourceUri: file.uri, width: info.width, height: info.height,
      orientation: 'up', mirrored: false, imported: Object.freeze({ resized: info.resized, flattened: info.flattened }) });
  } catch (error) {
    await removeFile(file.uri);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('IMPORT_SIZE')) throw new Error('사진이 너무 커요. 100MB 이하, 2억 화소 이하의 사진을 골라 주세요.');
    if (message.includes('IMPORT_FORMAT')) throw new Error('이 사진 형식은 열 수 없어요. JPEG·PNG 또는 이 기기에서 지원하는 HEIC 사진을 골라 주세요.');
    throw new Error('사진을 준비하지 못했어요. 저장 공간을 확인하고 다른 사진을 골라 주세요.');
  }
}
