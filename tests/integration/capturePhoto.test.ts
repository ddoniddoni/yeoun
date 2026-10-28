import type { Snapshot } from '../../src/domain/capture/controller';
import type { PhotoFlashMode } from '../../src/domain/capture/flash';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { capturePhoto } from '../../src/platform/camera/capturePhoto';

jest.mock('../../src/platform/files/drafts', () => ({ draftFile: jest.fn(), removeFile: jest.fn() }));
const files = jest.requireMock<{ draftFile: jest.Mock; removeFile: jest.Mock }>('../../src/platform/files/drafts');
function snapshot(flashMode: PhotoFlashMode): Snapshot {
  return { id: 'capture', settings: cameraSettings('original'), grainSeed: 7, flashMode,
    position: 'back', capturedAt: '2026-10-28T00:00:00.000Z' };
}
function setup() {
  const file = { uri: 'file:///cache/source.jpg', exists: true, size: 1234 };
  files.draftFile.mockReturnValue(file);
  files.removeFile.mockResolvedValue(undefined);
  const photo = { isRawPhoto: false, containerFormat: 'jpeg', width: 4032, height: 3024,
    orientation: 'up', isMirrored: false, saveToFileAsync: jest.fn().mockResolvedValue(undefined), dispose: jest.fn() };
  const output = { capturePhoto: jest.fn().mockResolvedValue(photo) };
  return { file, photo, output };
}
afterEach(() => jest.resetAllMocks());

test.each(['off', 'auto', 'on'] as const)('passes snapshot flash %s to the photo output and releases the full-resolution photo', async mode => {
  const { photo, output } = setup();
  const draft = await capturePhoto(output, snapshot(mode));
  expect(output.capturePhoto).toHaveBeenCalledWith({ flashMode: mode, enableShutterSound: true }, {});
  expect(draft).toMatchObject({ width: 4032, height: 3024, sourceUri: 'file:///cache/source.jpg' });
  expect(photo.saveToFileAsync).toHaveBeenCalledWith('/cache/source.jpg');
  expect(photo.dispose).toHaveBeenCalledTimes(1);
});

test('capture rejection propagates without another native capture', async () => {
  const { output, photo } = setup();
  output.capturePhoto.mockRejectedValueOnce(new Error('flash unavailable'));
  await expect(capturePhoto(output, snapshot('on'))).rejects.toThrow('flash unavailable');
  expect(output.capturePhoto).toHaveBeenCalledTimes(1);
  expect(photo.saveToFileAsync).not.toHaveBeenCalled();
});

test('a file write failure after flash capture removes the partial file and releases the native photo', async () => {
  const { output, photo, file } = setup();
  photo.saveToFileAsync.mockRejectedValueOnce(new Error('disk full'));
  await expect(capturePhoto(output, snapshot('auto'))).rejects.toThrow('disk full');
  expect(files.removeFile).toHaveBeenCalledWith(file.uri);
  expect(photo.dispose).toHaveBeenCalledTimes(1);
  expect(output.capturePhoto).toHaveBeenCalledTimes(1);
});
