import { cameraSettings, copyCameraSettings } from '../../src/domain/filters/cameraSettings';
import { defaultRememberedCamera, parseCameraMemory, serializeCameraMemory } from '../../src/domain/filters/cameraMemory';
import { recipeFingerprint } from '../../src/storage/recipeCatalog';

const fingerprint = () => 'current-assets';
test('missing memory enables defaults; disabling removes the stored camera snapshot', () => {
  expect(parseCameraMemory(null, fingerprint)).toEqual({ remember: true, camera: defaultRememberedCamera() });
  const raw = serializeCameraMemory({ remember: false }, fingerprint);
  expect(JSON.parse(raw)).toEqual({ schemaVersion: 1, remember: false });
  expect(parseCameraMemory(raw, fingerprint)).toEqual({ remember: false });
});
test('memory round trips all controls and grid while excluding photos, dates and hardware', () => {
  const settings = { ...cameraSettings('retro-film'), intensity: 0.4, grain: 0.2, bloom: 0.7,
    vignette: 0.1, halation: 0.2, sharpness: 0.3, softness: 0.4, digitalNoise: 0.5, lightLeak: 0.6, dust: 0.7,
    photoUri: 'file:///photo.jpg', stampDate: 261109, grainSeed: 11, flash: 'on', exposure: 2, position: 'front' };
  const raw = serializeCameraMemory({ remember: true, camera: { settings, grid: true } }, recipeFingerprint);
  for (const hidden of ['photoUri', 'file://', 'stampDate', 'grainSeed', 'flash', 'exposure', 'position']) expect(raw).not.toContain(hidden);
  const value = parseCameraMemory(raw, recipeFingerprint);
  expect(value).toEqual({ remember: true, camera: { settings: copyCameraSettings(settings), grid: true } });
  if (!value.remember) throw new Error('Expected enabled memory');
  expect(Object.isFrozen(value.camera.settings)).toBe(true);
  expect(Object.isFrozen(value.camera)).toBe(true);
});
test('unreadable records, unknown versions and incompatible assets fail without substituting defaults', () => {
  const base = { schemaVersion: 1, remember: true, ...defaultRememberedCamera(), fingerprint: fingerprint() };
  const variants = [{ ...base, schemaVersion: 2 }, { ...base, remember: 'true' }, { ...base, grid: 1 },
    { ...base, settings: [] }, { ...base, fingerprint: 'old-assets' },
    ...[{ intensity: 2 }, { grain: null }, { bloom: '0.1' }, { dust: -1 }, { dateStamp: 1 },
      { rendererVersion: 'old' }, { lookVersion: 'old' }, { filterId: 'missing' }]
      .map(change => ({ ...base, settings: { ...base.settings, ...change } }))];
  for (const invalid of ['{', 'null', '[]', '{}', ' '.repeat(8193), ...variants.map(value => JSON.stringify(value))]) {
    expect(() => parseCameraMemory(invalid, fingerprint)).toThrow();
  }
});
