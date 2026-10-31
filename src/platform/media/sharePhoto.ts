import { AppState, Platform, Share } from 'react-native';
import type { SharePort } from '../../domain/capture/controller';
import { createShareCopy } from '../files/sharedPhotos';

export const sharePhoto: SharePort = async (output, canPresent) => {
  if (!canPresent() || AppState.currentState !== 'active') return;
  let present: (uri: string) => Promise<unknown>;
  if (Platform.OS === 'ios') {
    // RN 0.83 handles UIActivityViewController's activityError; Expo 55 drops it.
    // Pass only the local JPEG URL, never a message containing an internal path.
    present = uri => Share.share({ url: uri });
  } else if (Platform.OS === 'android') {
    // RN's Android Share API handles text, so use Expo's FileProvider for the JPEG.
    // A binary without ExpoSharing must fail here, not while opening the camera.
    const sharing = await import('expo-sharing');
    if (!await sharing.isAvailableAsync()) throw new Error('Native file sharing is unavailable');
    present = uri => sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: '여운 사진 공유' });
  } else throw new Error('Native file sharing is unavailable');
  if (!canPresent() || AppState.currentState !== 'active') return;
  const copy = createShareCopy(output);
  try {
    await present(copy.uri);
  } finally {
    // Even rejection can follow handoff; never infer that an external reader has finished.
    copy.finish();
  }
};
