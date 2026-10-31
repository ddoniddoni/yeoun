import { AppState, Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { createShareCopy } from '../../src/platform/files/sharedPhotos';
import { sharePhoto } from '../../src/platform/media/sharePhoto';

jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('../../src/platform/files/sharedPhotos', () => ({ createShareCopy: jest.fn() }));
const originalOS = Platform.OS; const originalState = AppState.currentState;
const output = { uri: 'file:///filtered.jpg', width: 100, height: 100, bytes: 123 };
const finish = jest.fn();
beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
  jest.mocked(Sharing.shareAsync).mockResolvedValue(undefined);
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });
  jest.mocked(createShareCopy).mockReturnValue({ uri: 'file:///yeoun-shares/copy/yeoun.jpg', finish });
});
afterEach(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  Object.defineProperty(AppState, 'currentState', { value: originalState, configurable: true });
  jest.resetAllMocks(); jest.restoreAllMocks();
});
test.each(['ios', 'android'])('%s hands a JPEG copy to native sharing and retains it after dismissal', async os => {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  await sharePhoto(output, () => true);
  expect(createShareCopy).toHaveBeenCalledWith(output);
  if (os === 'ios') {
    expect(Share.share).toHaveBeenCalledWith({ url: 'file:///yeoun-shares/copy/yeoun.jpg' });
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  } else {
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///yeoun-shares/copy/yeoun.jpg',
      { mimeType: 'image/jpeg', dialogTitle: '여운 사진 공유' });
    expect(Share.share).not.toHaveBeenCalled();
  }
  expect(finish).toHaveBeenCalledTimes(1);
});
test('keeps a possibly handed-off copy on native rejection', async () => {
  jest.mocked(Sharing.shareAsync).mockRejectedValueOnce(new Error('native'));
  await expect(sharePhoto(output, () => true)).rejects.toThrow('native');
  expect(finish).toHaveBeenCalledTimes(1);
});
test('iOS activity errors release the operation while retaining the handed-off copy', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  jest.mocked(Share.share).mockRejectedValueOnce(new Error('activity error'));
  await expect(sharePhoto(output, () => true)).rejects.toThrow('activity error');
  expect(finish).toHaveBeenCalledTimes(1);
});
test('unavailable sharing or a copy failure never opens the share sheet', async () => {
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValueOnce(false);
  await expect(sharePhoto(output, () => true)).rejects.toThrow('unavailable');
  expect(createShareCopy).not.toHaveBeenCalled();
  jest.mocked(createShareCopy).mockImplementationOnce(() => { throw new Error('disk full'); });
  await expect(sharePhoto(output, () => true)).rejects.toThrow('disk full');
  expect(Sharing.shareAsync).not.toHaveBeenCalled(); expect(finish).not.toHaveBeenCalled();
});
test.each(['background', 'closed'])('late availability cannot present after %s', async reason => {
  let current = true;
  jest.mocked(Sharing.isAvailableAsync).mockImplementationOnce(async () => {
    if (reason === 'closed') current = false;
    else Object.defineProperty(AppState, 'currentState', { value: 'background', configurable: true });
    return true;
  });
  await sharePhoto(output, () => current);
  expect(createShareCopy).not.toHaveBeenCalled(); expect(Sharing.shareAsync).not.toHaveBeenCalled();
});
