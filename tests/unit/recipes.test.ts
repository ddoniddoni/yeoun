import { cameraSettings, copyCameraSettings } from '../../src/domain/filters/cameraSettings';
import { readRecipe, recipeName, recipeSettingsForContext, serializeRecipe } from '../../src/domain/recipes/recipe';
import { recipeFingerprint } from '../../src/storage/recipeCatalog';
import previousManifest from '../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/filter-manifest.json';
import { grainStyle } from '../../src/domain/filters/grainStyle';
import { LUT_SKIA_BACKEND_VERSION } from '../../src/rendering/shaders/lut';
import { SPATIAL_BACKEND_VERSION } from '../../src/rendering/shaders/spatial';

const id = '00000000-0000-4000-8000-000000000001';
const fingerprint = () => 'look-and-backend-fingerprint';

test.each(['portrait-clear', 'food-cafe', 'retro-travel'] as const)(
  'opens a previously saved %s recipe without upgrading its look or controls', filterId => {
    const look = previousManifest.assets.find(asset => asset.filterId === filterId)!;
    const identity = previousManifest.assets.find(asset => asset.filterId === 'identity')!;
    const settings = { ...cameraSettings(filterId), lookVersion: look.lookVersion, intensity: 0.42, bloom: 0.21 };
    const grain = grainStyle(filterId);
    // Reconstruct the pre-update stored fingerprint, not the new serializer's result.
    const savedFingerprint = [settings.rendererVersion, previousManifest.renderContractVersion, previousManifest.engineVersion,
      look.lookVersion, look.sha256, identity.sha256, LUT_SKIA_BACKEND_VERSION, SPATIAL_BACKEND_VERSION,
      grain.resolution, grain.amplitude].join('/');
    const recipe = readRecipe(id, '보관한 색감', 1, JSON.stringify({ settings, fingerprint: savedFingerprint }), recipeFingerprint);
    expect(recipe).toMatchObject({ available: true, settings });
    expect(recipeFingerprint(cameraSettings(filterId))).not.toBe(savedFingerprint);
    expect(cameraSettings(filterId).lookVersion).not.toBe(look.lookVersion);
  },
);

test('names trim outer whitespace and count Unicode code points without splitting surrogate pairs', () => {
  expect(recipeName('  오후 산책  ')).toBe('오후 산책');
  expect(recipeName('🌷'.repeat(24))).toHaveLength(48);
  for (const name of ['', '   ', '가'.repeat(25), '🌷'.repeat(25), '두\n줄', '숨은\u0000문자']) {
    expect(() => recipeName(name)).toThrow();
  }
});
test('saving whitelists all current effect controls and omits photos, date values, seed and capture hardware', () => {
  const settings = { ...cameraSettings('retro-film'), intensity: 0.7, softness: 0.3, grain: 0.4, lightLeak: 0.2,
    sourceUri: 'file:///private/photo.jpg', grainSeed: 13, stampDate: 261109, exposure: 2, flashMode: 'on' };
  const payload = serializeRecipe(settings, fingerprint);
  for (const hidden of ['sourceUri', 'file://', 'grainSeed', 'stampDate', 'exposure', 'flashMode']) expect(payload).not.toContain(hidden);
  const recipe = readRecipe(id, '산책', 1, payload, fingerprint);
  expect(recipe.available).toBe(true);
  if (!recipe.available) throw new Error('Expected available recipe');
  expect(recipe.settings).toEqual(copyCameraSettings(settings));
  expect(Object.isFrozen(recipe.settings)).toBe(true);
});
test('unsupported versions, changed fingerprints and corrupt settings remain identifiable but cannot be applied', () => {
  const settings = cameraSettings('retro-rose');
  const payload = serializeRecipe(settings, fingerprint);
  expect(readRecipe(id, '저장한 색', 2, payload, fingerprint)).toMatchObject({ id, name: '저장한 색', available: false });
  expect(readRecipe(id, '저장한 색', 1, payload, () => 'new-assets')).toMatchObject({ available: false });
  const variants = [{ ...settings, lookVersion: 'old' }, { ...settings, engineVersion: 'old' },
    { ...settings, rendererVersion: 'old' }, { ...settings, intensity: 2 }, { ...settings, dateStamp: 1 },
    { ...settings, grain: '0.1' }, { ...settings, softness: null }, { ...settings, filterId: 'missing-look' }];
  for (const variant of variants) {
    expect(readRecipe(id, '저장한 색', 1, JSON.stringify({ settings: variant, fingerprint: fingerprint() }), fingerprint).available).toBe(false);
  }
  for (const invalid of ['{', 'null', '[]', '{}', ' '.repeat(8193), 42]) {
    expect(readRecipe(id, '저장한 색', 1, invalid, fingerprint).available).toBe(false);
  }
});
test('renaming an unavailable recipe does not substitute current defaults or drop its identity', () => {
  const recipe = readRecipe(id, '새 이름', 1, '{', fingerprint);
  expect(recipe).toEqual({ id, name: '새 이름', available: false, reason: '저장된 설정을 읽을 수 없어요' });
});
test('camera application restores the full recipe; import application only turns the date toggle off', () => {
  const settings = cameraSettings('retro-film');
  expect(settings.dateStamp).toBe(true);
  expect(recipeSettingsForContext(settings, false)).toEqual(settings);
  expect(recipeSettingsForContext(settings, true)).toEqual({ ...settings, dateStamp: false });
  expect(settings.dateStamp).toBe(true);
});
test('bundled recipes pin exact LUTs and backend/renderer versions without native image resources', () => {
  const settings = cameraSettings('retro-film');
  const key = recipeFingerprint(settings);
  expect(key).toContain(settings.lookVersion);
  expect(key).toContain(settings.rendererVersion);
  expect(recipeFingerprint({ ...settings, intensity: 0.4 })).toBe(key);
  expect(recipeFingerprint(cameraSettings('retro-rose'))).not.toBe(key);
  expect(() => recipeFingerprint({ ...settings, lookVersion: 'unavailable' })).toThrow();
  expect(readRecipe(id, '필름', 1, serializeRecipe(settings, recipeFingerprint), recipeFingerprint).available).toBe(true);
});
