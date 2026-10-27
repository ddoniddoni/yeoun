import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Asset } from 'expo-media-library/next';
import { saveToGallery } from '../../src/platform/media/gallery';
jest.mock('expo-media-library', () => ({ PermissionStatus: { DENIED: 'denied' }, getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(), saveToLibraryAsync: jest.fn() }));
jest.mock('expo-media-library/next', () => ({ Asset: { create: jest.fn() } }));
const file = { uri: 'file:///test.jpg', width: 4032, height: 3024, bytes: 100 };
const originalOS = Platform.OS; const originalVersion = Platform.Version;
afterEach(() => { Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true }); Object.defineProperty(Platform, 'Version', { value: originalVersion, configurable: true }); jest.resetAllMocks(); });
function platform(os: 'ios' | 'android', version: number) { Object.defineProperty(Platform, 'OS', { value: os, configurable: true }); Object.defineProperty(Platform, 'Version', { value: version, configurable: true }); }
test.each([30, 31, 32, 33, 36])('Android %i inserts without requesting library access', async version => {
  platform('android', version); await saveToGallery(file);
  expect(MediaLibrary.getPermissionsAsync).not.toHaveBeenCalled(); expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(Asset.create).toHaveBeenCalledWith(file.uri);
});
test('iOS denied add-only does not save or request full read access', async () => {
  platform('ios', 18);
  jest.mocked(MediaLibrary.getPermissionsAsync).mockResolvedValue({ granted: false, canAskAgain: false, status: MediaLibrary.PermissionStatus.DENIED, expires: 'never' });
  await expect(saveToGallery(file)).rejects.toThrow('권한');
  expect(MediaLibrary.getPermissionsAsync).toHaveBeenCalledWith(true, []); expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
});
