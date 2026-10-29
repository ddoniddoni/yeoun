import { CAMERA_COLLECTIONS, CAMERA_FILTERS, cameraSettings, cameraSettingsKey, copyCameraSettings } from '../../src/domain/filters/cameraSettings';
import { NO_RETRO, RETRO_AMOUNTS, assertStampDate, hasSpatialEffects, localStampDate } from '../../src/domain/filters/retroControls';
import { applyRetroSample, halationLinear, retroHash, sharpenLinear } from '../../src/rendering/reference/retro';

test('each selectable look has one collection; new looks have distinct defaults without surprise overlays', () => {
  const ids = CAMERA_COLLECTIONS.flatMap(collection => collection.ids);
  expect(ids).toHaveLength(CAMERA_FILTERS.length);
  expect(new Set(ids).size).toBe(ids.length);
  for (const filter of CAMERA_FILTERS) expect(ids).toContain(filter.id);
  for (const id of ['retro-film', 'retro-digital', 'retro-rose', 'retro-travel'] as const) {
    expect(cameraSettings(id)).toMatchObject({ dateStamp: false, lightLeak: 0, dust: 0 });
  }
  expect(cameraSettings('retro-film')).toMatchObject({ grain: 0.24, halation: 0.09 });
  expect(cameraSettings('retro-digital')).toMatchObject({ grain: 0, bloom: 0, sharpness: 0.16, digitalNoise: 0.08 });
});

test.each(RETRO_AMOUNTS)('%s is bounded, participates in request identity, and independently enables spatial rendering', control => {
  const base = { ...cameraSettings('scene-dawn'), grain: 0, bloom: 0 };
  expect(hasSpatialEffects(base)).toBe(false);
  const next = copyCameraSettings({ ...base, [control]: 0.5 });
  expect(hasSpatialEffects(next)).toBe(true);
  expect(cameraSettingsKey(next)).not.toBe(cameraSettingsKey(base));
  for (const value of [NaN, Infinity, -0.1, 1.1]) expect(() => copyCameraSettings({ ...base, [control]: value })).toThrow();
  expect(copyCameraSettings({ ...next, filterId: 'original' })).toMatchObject(NO_RETRO);
});

test('date stamp uses local calendar time including year wrap; invalid dates are rejected', () => {
  expect(localStampDate(new Date(2026, 9, 29, 0, 1))).toBe(261029);
  expect(localStampDate(new Date(2000, 0, 1))).toBe(101);
  expect(() => assertStampDate(240229)).not.toThrow();
  for (const date of [0, NaN, 261332, 260229, 260431, 1000101]) expect(() => assertStampDate(date)).toThrow();
  const base = cameraSettings('scene-dawn');
  expect(cameraSettingsKey({ ...base, dateStamp: true })).not.toBe(cameraSettingsKey(base));
  expect(copyCameraSettings({ ...cameraSettings('original'), dateStamp: true }).dateStamp).toBe(false);
});

test('neutral effects preserve color and an even field is not sharpened or given a red halo', () => {
  const rgb = [0.4, 0.5, 0.6] as const;
  expect(applyRetroSample(rgb, NO_RETRO, 500, 500, 1200, 1600, 7)).toEqual(rgb);
  expect(sharpenLinear(rgb, rgb, 1)).toEqual(rgb);
  expect(halationLinear([1, 1, 1], [1, 1, 1], 1)).toEqual([1, 1, 1]);
  const halo = halationLinear([0, 0, 0], [0.5, 0.5, 0.5], 1);
  expect(halo[0]).toBeGreaterThan(halo[1]); expect(halo[1]).toBeGreaterThan(halo[2]);
});

test('vignette follows crop coordinates and a fixed light leak survives output scaling', () => {
  const rgb = [0.5, 0.5, 0.5] as const;
  const vignette = { ...NO_RETRO, vignette: 1 };
  expect(applyRetroSample(rgb, vignette, 600, 800, 1200, 1600, 7)).toEqual(rgb);
  expect(applyRetroSample(rgb, vignette, 0, 0, 1200, 1600, 7)[0]).toBeLessThan(0.5);
  const leak = { ...NO_RETRO, lightLeak: 1 };
  expect(applyRetroSample(rgb, leak, 30, 500, 1200, 1600, 7))
    .toEqual(applyRetroSample(rgb, leak, 60, 1000, 2400, 3200, 7));
  expect(retroHash(30, 50, 7, 1)).not.toBe(retroHash(30, 50, 7, 2));
});
