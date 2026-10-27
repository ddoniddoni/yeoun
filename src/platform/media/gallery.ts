import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-media-library/next';
import type { Output } from '../../domain/capture/controller';
export async function saveToGallery(output: Output): Promise<void> {
  // The SDK 55 next API uses scoped MediaStore insertion on Android 11+.
  // Its legacy Android <=10 path needs write-only permission; iOS uses add-only.
  if (Platform.OS === 'ios' || (Platform.OS === 'android' && Number(Platform.Version) < 30)) {
    let permission = await MediaLibrary.getPermissionsAsync(true, []);
    if (!permission.granted && permission.canAskAgain) permission = await MediaLibrary.requestPermissionsAsync(true, []);
    if (!permission.granted) throw new Error('사진 저장 권한이 필요해요. 설정에서 허용한 뒤 다시 저장해 주세요.');
  }
  if (Platform.OS === 'android') {
    await Asset.create(output.uri); // Returned metadata wrapper has no public dispose API.
  } else {
    await MediaLibrary.saveToLibraryAsync(output.uri);
  }
}
