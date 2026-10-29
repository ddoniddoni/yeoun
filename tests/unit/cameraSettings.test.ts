import seed from '../../spec/filters.seed.json';
import { cameraSettings, cameraSettingsKey, copyCameraSettings } from '../../src/domain/filters/cameraSettings';

test('original bypasses style and defaults come from the selected look while explicit zero is preserved', () => {
  expect(cameraSettings('original').intensity).toBe(0);
  expect(cameraSettings('light-afternoon').intensity).toBe(0.8);
  expect(cameraSettings('time-summer', 0).intensity).toBe(0);
  expect(cameraSettings('retro-film').intensity).toBe(1);
  expect(cameraSettings('retro-digital', 0).intensity).toBe(0);
});

test('revised film and digital looks require their exact new version without changing other looks', () => {
  for (const id of ['retro-film', 'retro-digital'] as const) {
    const settings = cameraSettings(id);
    expect(settings.lookVersion).toBe(id === 'retro-film' ? '0.6.0-draft' : '0.3.0-draft');
    const previousVersion = id === 'retro-film' ? '0.5.0-draft' : '0.2.0-draft';
    expect(() => copyCameraSettings({ ...settings, lookVersion: previousVersion })).toThrow();
    expect(() => copyCameraSettings({ ...settings, lookVersion: '0.1.0-draft' })).toThrow();
    expect(cameraSettingsKey(settings)).not.toBe(cameraSettingsKey({ ...settings, lookVersion: '0.1.0-draft' }));
  }
  for (const id of ['original', 'light-afternoon', 'time-summer', 'scene-dawn', 'retro-rose', 'retro-travel'] as const) {
    const settings = cameraSettings(id);
    expect(settings.lookVersion).toBe('0.1.0-draft');
    expect(() => copyCameraSettings({ ...settings, lookVersion: '0.2.0-draft' })).toThrow();
  }
});

test('unsupported versions and invalid strengths cannot silently render', () => {
  const source = cameraSettings('scene-dawn');
  expect(() => copyCameraSettings({ ...source, lookVersion: 'future' })).toThrow();
  expect(() => copyCameraSettings({ ...source, rendererVersion: 'lut-camera-0.4.0' as typeof source.rendererVersion })).toThrow();
  for (const value of [NaN, Infinity, -0.1, 1.1]) {
    expect(() => copyCameraSettings({ ...source, grain: value })).toThrow();
    expect(() => copyCameraSettings({ ...source, bloom: value })).toThrow();
  }
  for (const intensity of [NaN, Infinity, -1, 2]) expect(() => copyCameraSettings({ ...source, intensity })).toThrow();
  expect(Object.isFrozen(copyCameraSettings(source))).toBe(true);
});

test('representative texture defaults come from seed, original bypasses every effect, keys include textures', () => {
  for (const id of ['light-afternoon', 'time-summer', 'scene-dawn'] as const) {
    expect(cameraSettings(id)).toMatchObject(seed.filters.find(filter => filter.id === id)!.defaults);
  }
  expect(copyCameraSettings({ ...cameraSettings('original'), grain: 1, bloom: 1 })).toMatchObject({ intensity: 0, grain: 0, bloom: 0 });
  const settings = cameraSettings('time-summer');
  expect(cameraSettingsKey({ ...settings, grain: 0 })).not.toBe(cameraSettingsKey(settings));
  expect(cameraSettingsKey({ ...settings, bloom: 0 })).not.toBe(cameraSettingsKey(settings));
});
