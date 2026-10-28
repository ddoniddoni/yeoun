import { clampExposure, copyExposure, exposureRange, focusSensorPoint, type FocusFrame } from '../../src/domain/capture/metering';

const upright: FocusFrame = { width: 1200, height: 1600, orientation: 'up', isMirrored: false };
test('iOS physically rotated portrait buffers map into landscape-right sensor coordinates and undo front mirroring', () => {
  expect(focusSensorPoint({ x: 0.25, y: 0.75 }, upright, 'ios', false)).toEqual({ x: 0.75, y: 0.75 });
  expect(focusSensorPoint({ x: 0.25, y: 0.75 }, upright, 'ios', true)).toEqual({ x: 0.75, y: 0.25 });
  expect(() => focusSensorPoint({ x: 0.5, y: 0.5 }, { ...upright, orientation: 'right' }, 'ios', false)).toThrow('방향');
});
test('cover crop is undone before direction/mirror; square source left edge is not the sensor edge', () => {
  expect(focusSensorPoint({ x: 0, y: 0.5 }, { ...upright, height: 1200 }, 'android', false)).toEqual({ x: 0.125, y: 0.5 });
  expect(focusSensorPoint({ x: 0, y: 0.5 }, { ...upright, height: 1200, isMirrored: true }, 'android', true)).toEqual({ x: 0.875, y: 0.5 });
  expect(focusSensorPoint({ x: 0.25, y: 0.75 }, { ...upright, orientation: 'down' }, 'android', false)).toEqual({ x: 0.75, y: 0.25 });
  expect(focusSensorPoint({ x: 0.25, y: 0.75 }, { ...upright, orientation: 'down', isMirrored: true }, 'android', true)).toEqual({ x: 0.25, y: 0.25 });
});
test.each([
  ['left', 0.75, 0.75], ['right', 0.25, 0.25],
] as const)('Android %s rotation is inverted using the uncropped frame', (orientation, x, y) => {
  expect(focusSensorPoint({ x: 0.25, y: 0.75 }, { width: 1600, height: 1200, orientation, isMirrored: false }, 'android', false)).toEqual({ x, y });
});
test('invalid taps and unknown geometry are rejected', () => {
  for (const x of [NaN, Infinity, -0.1, 1.1]) expect(() => focusSensorPoint({ x, y: 0.5 }, upright, 'android', false)).toThrow();
  expect(() => focusSensorPoint({ x: 0.5, y: 0.5 }, { ...upright, width: 0 }, 'android', false)).toThrow();
});
test('exposure clamps to device range and keeps EV separate from integer Android steps', () => {
  expect(exposureRange(false, -2, 2)).toBeUndefined();
  expect(exposureRange(true, NaN, 2)).toBeUndefined();
  expect(exposureRange(true, 1, 2)).toBeUndefined();
  expect(clampExposure(4, { min: -2, max: 1.5 })).toBe(1.5);
  expect(clampExposure(-4, { min: -2, max: 1.5 })).toBe(-2);
  expect(() => clampExposure(NaN, { min: -2, max: 2 })).toThrow();
  const reading = { value: 0.5, unit: 'ev' } as const;
  expect(copyExposure(reading)).toEqual(reading);
  expect(copyExposure(reading)).not.toBe(reading);
  expect(() => copyExposure({ value: 0.5, unit: 'step' })).toThrow();
});
