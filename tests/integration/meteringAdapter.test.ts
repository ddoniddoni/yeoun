import type { CameraController } from 'react-native-vision-camera';
import { VisionCamera } from 'react-native-vision-camera';
import { createMeteringPort } from '../../src/platform/camera/meteringAdapter';
import type { FocusFrame } from '../../src/domain/capture/metering';

jest.mock('react-native-vision-camera', () => ({ VisionCamera: { createNormalizedMeteringPoint: jest.fn() } }));
function setup() {
  const point = { dispose: jest.fn() };
  jest.requireMock<{ VisionCamera: { createNormalizedMeteringPoint: jest.Mock } }>('react-native-vision-camera')
    .VisionCamera.createNormalizedMeteringPoint.mockReturnValue(point);
  const setExposureBias = jest.fn<Promise<void>, [number]>();
  const camera = { device: { id: 'back', position: 'back', supportsFocusMetering: true,
    supportsExposureBias: true, minExposureBias: -3, maxExposureBias: 3 },
  isConnected: true, isSuspended: false, isUsedByAnotherApp: false, exposureBias: 0,
  resetFocus: jest.fn().mockResolvedValue(undefined), focusTo: jest.fn().mockResolvedValue(undefined),
  setExposureBias };
  setExposureBias.mockImplementation(async value => { camera.exposureBias = value; });
  const frame: FocusFrame = { width: 1200, height: 1600, orientation: 'up', isMirrored: false };
  const port = (platform: 'ios' | 'android') => createMeteringPort(camera as unknown as CameraController, 'back', () => frame, platform);
  return { camera, point, port };
}
afterEach(() => jest.resetAllMocks());
test('maps the iOS portrait tap, requests AF only and releases the owned target after settle', async () => {
  const { camera, port, point } = setup();
  await port('ios').focus({ x: 0.25, y: 0.75 });
  expect(VisionCamera.createNormalizedMeteringPoint).toHaveBeenCalledWith(0.75, 0.75);
  expect(camera.focusTo).toHaveBeenCalledWith(point, { modes: ['AF'], responsiveness: 'snappy', adaptiveness: 'continuous', autoResetAfter: 5 });
  expect(point.dispose).toHaveBeenCalledTimes(1);
});
test('focus failure releases the target and interrupted controllers reject commands', async () => {
  const { camera, port, point } = setup(); const adapter = port('android');
  camera.focusTo.mockRejectedValueOnce(new Error('timeout'));
  await expect(adapter.focus({ x: 0.5, y: 0.5 })).rejects.toThrow('timeout');
  expect(point.dispose).toHaveBeenCalledTimes(1);
  camera.isSuspended = true;
  await expect(adapter.setExposure(1)).rejects.toThrow('중단');
  expect(camera.setExposureBias).not.toHaveBeenCalled();
});
test('Android exposes integer steps while iOS retains fractional EV, and both return native readback', async () => {
  const { camera, port } = setup();
  const android = port('android');
  expect(android.unit).toBe('step');
  expect(await android.setExposure(1.6)).toBe(2);
  expect(camera.setExposureBias).toHaveBeenLastCalledWith(2);
  const ios = port('ios');
  expect(ios.unit).toBe('ev');
  expect(await ios.setExposure(0.5)).toBe(0.5);
  expect(camera.setExposureBias).toHaveBeenLastCalledWith(0.5);
});
test('missing or replaced controller cannot be used', () => {
  const { camera } = setup();
  expect(() => createMeteringPort(undefined, 'back', () => undefined, 'ios')).toThrow();
  expect(() => createMeteringPort(camera as unknown as CameraController, 'front', () => undefined, 'ios')).toThrow();
});
