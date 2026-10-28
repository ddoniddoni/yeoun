import { assertFlashMode, selectedFlashMode } from '../../src/domain/capture/flash';

test('flash starts off and never follows a selection to another or unsupported camera', () => {
  const back = { id: 'back', hasFlash: true };
  const selection = { deviceId: 'back', mode: 'on' } as const;
  expect(selectedFlashMode(undefined, back)).toBe('off');
  expect(selectedFlashMode(selection, back)).toBe('on');
  expect(selectedFlashMode(selection, { id: 'front', hasFlash: false })).toBe('off');
  expect(selectedFlashMode(selection, { id: 'other-back', hasFlash: true })).toBe('off');
  expect(selectedFlashMode(selection, { ...back, hasFlash: false })).toBe('off');
  expect(selectedFlashMode(selection, undefined)).toBe('off');
});

test('auto is preserved on a supported camera, including a device with a physical front flash', () => {
  expect(selectedFlashMode({ deviceId: 'physical-front', mode: 'auto' },
    { id: 'physical-front', hasFlash: true })).toBe('auto');
});

test.each(['torch', '', null, undefined, 1])('rejects invalid flash mode %s', mode => {
  expect(() => assertFlashMode(mode)).toThrow('플래시');
});
