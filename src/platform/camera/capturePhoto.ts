import type { CameraPhotoOutput } from 'react-native-vision-camera';
import type { Draft, Snapshot } from '../../domain/capture/controller';
import { draftFile, removeFile } from '../files/drafts';
export async function capturePhoto(output: CameraPhotoOutput, snapshot: Snapshot): Promise<Draft> {
  const file = draftFile(snapshot.id, 'source.jpg');
  const photo = await output.capturePhoto({ flashMode: 'off', enableShutterSound: true }, {});
  try {
    if (photo.isRawPhoto || photo.containerFormat !== 'jpeg') throw new Error('M0 supports SDR JPEG photos only');
    if (photo.width * photo.height > 16_000_000) throw new Error('선택된 사진이 M0 처리 한도(16MP)를 넘어요. 해상도를 자동으로 낮추지 않았습니다.');
    const descriptor = { sourceUri: file.uri, width: photo.width, height: photo.height,
      orientation: photo.orientation, mirrored: photo.isMirrored };
    await photo.saveToFileAsync(file.uri.replace(/^file:\/\//, ''));
    if (!file.exists || file.size === 0) throw new Error('Empty camera photo');
    return descriptor;
  } catch (error) { await removeFile(file.uri); throw error; }
  finally { photo.dispose(); }
}
