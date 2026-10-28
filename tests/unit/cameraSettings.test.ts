import { cameraSettings, copyCameraSettings } from '../../src/domain/filters/cameraSettings';

test('original bypasses style and other filters default to 80 percent', () => {
  expect(cameraSettings('original').intensity).toBe(0);
  expect(cameraSettings('light-afternoon').intensity).toBe(0.8);
  expect(cameraSettings('time-summer', 0).intensity).toBe(0);
});

test('unsupported versions and unimplemented spatial effects cannot silently render', () => {
  const source = cameraSettings('scene-dawn');
  expect(() => copyCameraSettings({ ...source, lookVersion: 'future' })).toThrow();
  expect(() => copyCameraSettings({ ...source, grain: 0.2 })).toThrow();
  expect(() => copyCameraSettings({ ...source, bloom: 0.2 })).toThrow();
  for (const intensity of [NaN, Infinity, -1, 2]) expect(() => copyCameraSettings({ ...source, intensity })).toThrow();
  expect(Object.isFrozen(copyCameraSettings(source))).toBe(true);
});
