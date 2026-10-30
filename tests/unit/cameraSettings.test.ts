import seed from '../../spec/filters.seed.json';
import { CAMERA_FILTERS, cameraSettings, cameraSettingsKey, copyCameraSettings } from '../../src/domain/filters/cameraSettings';

test('every curated seed look is selectable with matching copy, defaults and exact version', () => {
  expect(CAMERA_FILTERS.filter(filter => filter.id !== 'original').map(filter => filter.id).sort())
    .toEqual(seed.filters.map(filter => filter.id).sort());
  for (const filter of CAMERA_FILTERS) {
    if (filter.id === 'original') continue;
    const draft = seed.filters.find(item => item.id === filter.id)!;
    expect(filter).toMatchObject({ name: draft.name, caption: draft.caption });
    const settings = cameraSettings(filter.id);
    expect(settings).toMatchObject({ ...draft.defaults, lookVersion: draft.lookVersion });
    expect(copyCameraSettings(settings)).toEqual(settings);
    expect(cameraSettings(filter.id, 0).intensity).toBe(0);
  }
});

test.each(['time-diary', 'time-night', 'scene-rain', 'scene-ending'] as const)(
  'rejects the unbundled old authoring version for %s', id => {
    const settings = cameraSettings(id);
    expect(settings.lookVersion).toBe('0.2.0-draft');
    expect(() => copyCameraSettings({ ...settings, lookVersion: '0.1.0-draft' })).toThrow();
  },
);

test.each([
  ['light-milk', '0.3.0-draft', '0.2.0-draft'],
  ['light-spring', '0.3.0-draft', '0.2.0-draft'],
  ['light-afternoon', '0.2.0-draft', '0.1.0-draft'],
  ['time-summer', '0.3.0-draft', '0.2.0-draft'],
  ['retro-rose', '0.3.0-draft', '0.2.0-draft'],
  ['retro-travel', '0.3.0-draft', '0.2.0-draft'],
  ['portrait-clear', '0.2.0-draft', '0.1.0-draft'],
  ['portrait-peach', '0.2.0-draft', '0.1.0-draft'],
  ['food-table', '0.2.0-draft', '0.1.0-draft'],
  ['food-cafe', '0.2.0-draft', '0.1.0-draft'],
] as const)('pins the photo-reviewed revision for %s', (id, version, previousVersion) => {
  const settings = cameraSettings(id);
  expect(settings.lookVersion).toBe(version);
  expect(() => copyCameraSettings({ ...settings, lookVersion: previousVersion })).toThrow();
});

test('original bypasses style and defaults come from the selected look while explicit zero is preserved', () => {
  expect(cameraSettings('original').intensity).toBe(0);
  expect(cameraSettings('light-afternoon').intensity).toBe(0.8);
  expect(cameraSettings('time-summer', 0).intensity).toBe(0);
  expect(cameraSettings('retro-film').intensity).toBe(1);
  expect(cameraSettings('retro-digital', 0).intensity).toBe(0);
});

test('film and digital retain their revisions and reject unsupported look versions', () => {
  for (const id of ['retro-film', 'retro-digital'] as const) {
    const settings = cameraSettings(id);
    expect(settings.lookVersion).toBe(id === 'retro-film' ? '0.6.0-draft' : '0.3.0-draft');
    const previousVersion = id === 'retro-film' ? '0.5.0-draft' : '0.2.0-draft';
    expect(() => copyCameraSettings({ ...settings, lookVersion: previousVersion })).toThrow();
    expect(() => copyCameraSettings({ ...settings, lookVersion: '0.1.0-draft' })).toThrow();
    expect(cameraSettingsKey(settings)).not.toBe(cameraSettingsKey({ ...settings, lookVersion: '0.1.0-draft' }));
  }
  for (const id of ['original', 'scene-dawn'] as const) {
    const settings = cameraSettings(id);
    expect(settings.lookVersion).toBe('0.1.0-draft');
    expect(() => copyCameraSettings({ ...settings, lookVersion: '0.2.0-draft' })).toThrow();
  }
});

test('unsupported versions and invalid strengths cannot silently render', () => {
  const source = cameraSettings('scene-dawn');
  expect(() => copyCameraSettings({ ...source, lookVersion: 'future' })).toThrow();
  expect(() => copyCameraSettings({ ...source, rendererVersion: 'lut-camera-0.5.0' as typeof source.rendererVersion })).toThrow();
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
