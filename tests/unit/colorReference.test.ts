import schema from '../../spec/filters.schema.json';
import seed from '../../spec/filters.seed.json';
import { createFilterSeedValidator } from '../../scripts/lib/filterSeed';
import type { FilterAuthoring, Rgb, ToneCurve } from '../../src/domain/filters/types';
import { createAuthoringTransform } from '../../src/rendering/reference/authoring';
import {
  hsvToRgb, linearToSrgbChannel, rgbToHsv, smoothstep, srgbToLinearChannel, wrapHue,
  type Hsv,
} from '../../src/rendering/reference/color';
import { createToneCurve } from '../../src/rendering/reference/toneCurve';

const IDENTITY_CURVE: ToneCurve = [[0, 0], [0.2, 0.2], [0.4, 0.4], [0.6, 0.6], [0.8, 0.8], [1, 1]];
const SAMPLES: readonly Rgb[] = [
  [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
  [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
  [0.18, 0.18, 0.18], [0.13, 0.47, 0.83], [0.04045, 0.5, 0.91],
];

function definition(overrides: Partial<FilterAuthoring> = {}): FilterAuthoring {
  return {
    colorSpace: 'srgb-encoded', exposureEv: 0, saturation: 1,
    toneCurve: IDENTITY_CURVE, shadowTintRgb: [0, 0, 0], highlightTintRgb: [0, 0, 0], hueBands: [],
    ...overrides,
  };
}

function expectRgb(actual: Rgb, expected: Rgb): void {
  expect(actual[0]).toBeCloseTo(expected[0], 12);
  expect(actual[1]).toBeCloseTo(expected[1], 12);
  expect(actual[2]).toBeCloseTo(expected[2], 12);
}

test.each([
  { encoded: 0, linear: 0 },
  { encoded: 0.04045, linear: 0.0031308049535603713 },
  { encoded: 0.5, linear: 0.21404114048223255 },
  { encoded: 1, linear: 1 },
])('sRGB decoding reference at $encoded', ({ encoded, linear }) => {
  expect(srgbToLinearChannel(encoded)).toBeCloseTo(linear, 12);
});

test.each([
  { linear: 0, encoded: 0 },
  { linear: 0.0031308, encoded: 0.040449936 },
  { linear: 0.18, encoded: 0.46135612950044164 },
  { linear: 1, encoded: 1 },
])('sRGB encoding reference at $linear', ({ linear, encoded }) => {
  expect(linearToSrgbChannel(linear)).toBeCloseTo(encoded, 12);
});

test.each([0, 0.040449, 0.04045, 0.040451, 0.18, 0.5, 1])('sRGB round trip near endpoints and breakpoint: %s', value => {
  // The specified encoded/linear breakpoints are rounded independently.
  expect(Math.abs(linearToSrgbChannel(srgbToLinearChannel(value)) - value)).toBeLessThan(1e-7);
});

test.each([NaN, Infinity, -Infinity, -0.01, 1.01])('rejects invalid normalized channels: %s', value => {
  expect(() => srgbToLinearChannel(value)).toThrow(RangeError);
  expect(() => linearToSrgbChannel(value)).toThrow(RangeError);
  expect(() => createAuthoringTransform(definition())([value, 0, 0])).toThrow(RangeError);
});

test('smoothstep has clamped endpoints, a midpoint, and rejects invalid edges', () => {
  expect(smoothstep(0.2, 0.8, 0)).toBe(0);
  expect(smoothstep(0.2, 0.8, 0.5)).toBeCloseTo(0.5, 14);
  expect(smoothstep(0.2, 0.8, 1)).toBe(1);
  expect(() => smoothstep(1, 1, 0.5)).toThrow(RangeError);
  expect(() => smoothstep(0, 1, NaN)).toThrow(RangeError);
});

const HSV_CASES: readonly { rgb: Rgb; hsv: Hsv }[] = [
  { rgb: [1, 0, 0], hsv: [0, 1, 1] }, { rgb: [1, 1, 0], hsv: [60, 1, 1] },
  { rgb: [0, 1, 0], hsv: [120, 1, 1] }, { rgb: [0, 1, 1], hsv: [180, 1, 1] },
  { rgb: [0, 0, 1], hsv: [240, 1, 1] }, { rgb: [1, 0, 1], hsv: [300, 1, 1] },
  { rgb: [0, 0, 0], hsv: [0, 0, 0] }, { rgb: [0.4, 0.4, 0.4], hsv: [0, 0, 0.4] },
];
test.each(HSV_CASES)('HSV sectors and achromatic hue: $hsv', ({ rgb, hsv }) => {
  expect(rgbToHsv(rgb)).toEqual(hsv);
  expectRgb(hsvToRgb(hsv), rgb);
});

test('HSV wraps across red and rejects non-normalized components', () => {
  expect(wrapHue(-10)).toBe(350);
  expect(wrapHue(720)).toBe(0);
  expectRgb(hsvToRgb([359, 1, 1]), [1, 0, 1 / 60]);
  expect(() => hsvToRgb([360, 1, 1])).toThrow(RangeError);
  expect(() => hsvToRgb([0, NaN, 1])).toThrow(RangeError);
  expect(() => wrapHue(Infinity)).toThrow(RangeError);
});

test.each(SAMPLES.map(input => ({ input })))('neutral authoring and RGB/HSV round trip: $input', ({ input }) => {
  expectRgb(createAuthoringTransform(definition())(input), input);
  expectRgb(hsvToRgb(rgbToHsv(input)), input);
});

test('exposure is applied in linear RGB, once, before clipping highlights', () => {
  // Encoded values for linear 0.25 and 0.5; +1 EV doubles linear light.
  const up = createAuthoringTransform(definition({ exposureEv: 1 }));
  const down = createAuthoringTransform(definition({ exposureEv: -1 }));
  expectRgb(up([0.5370987304831942, 0, 0]), [0.7353569830524495, 0, 0]);
  expectRgb(down([0.7353569830524495, 0, 0]), [0.5370987304831942, 0, 0]);
  expectRgb(up([0.9, 0.9, 0.9]), [1, 1, 1]);
});

test('tone curve preserves knots and uses linear interpolation including flat segments', () => {
  const curve: ToneCurve = [[0, 0.1], [0.2, 0.2], [0.4, 0.2], [0.6, 0.7], [0.8, 0.9], [1, 1]];
  const tone = createToneCurve(curve);
  for (const [x, y] of curve) expect(tone(x)).toBe(y);
  expect(tone(0.3)).toBeCloseTo(0.2, 14);
  expect(tone(0.5)).toBeCloseTo(0.45, 14);
  expect(tone(0.9)).toBeCloseTo(0.95, 14);
  expect(() => tone(NaN)).toThrow(RangeError);
});

test.each([
  { curve: [[0.1, 0], [0.2, 0.2], [0.4, 0.4], [0.6, 0.6], [0.8, 0.8], [1, 1]] },
  { curve: [[0, 0], [0.2, 0.2], [0.2, 0.4], [0.6, 0.6], [0.8, 0.8], [1, 1]] },
  { curve: [[0, 0], [0.2, 0.2], [0.4, 0.1], [0.6, 0.6], [0.8, 0.8], [1, 1]] },
  { curve: [[0, 0], [0.2, NaN], [0.4, 0.4], [0.6, 0.6], [0.8, 0.8], [1, 1]] },
] satisfies { curve: ToneCurve }[])('rejects undefined or invalid tone interpolation: $curve', ({ curve }) => {
  expect(() => createToneCurve(curve)).toThrow(RangeError);
});

test('shadow and highlight tints use separate masks and clip after addition', () => {
  const transform = createAuthoringTransform(definition({
    shadowTintRgb: [0.05, -0.05, 0.02], highlightTintRgb: [-0.1, 0.05, -0.02],
  }));
  expectRgb(transform([0, 0, 0]), [0.05, 0, 0.02]);
  expectRgb(transform([1, 1, 1]), [0.9, 1, 0.98]);
});

test('a hue band preserves value and can change hue or saturation', () => {
  const band = { centerDeg: 0, halfWidthDeg: 90, shiftDeg: 30, saturationMultiplier: 1 };
  expectRgb(createAuthoringTransform(definition({ hueBands: [band] }))([1, 0, 0]), [1, 0.5, 0]);
  expectRgb(createAuthoringTransform(definition({ hueBands: [{ ...band, shiftDeg: -30 }] }))([1, 0, 0]), [1, 0, 0.5]);
  expectRgb(createAuthoringTransform(definition({ hueBands: [{ ...band, shiftDeg: 0, saturationMultiplier: 0.5 }] }))([1, 0, 0]), [1, 0.5, 0.5]);
});

test('hue band distance is circular and a partial weight is not amplified to one', () => {
  const transform = createAuthoringTransform(definition({
    hueBands: [{ centerDeg: 359, halfWidthDeg: 2, shiftDeg: 20, saturationMultiplier: 1 }],
  }));
  expectRgb(transform([1, 0, 0]), [1, 1 / 6, 0]);
});

test('overlapping bands use the original hue and normalize their combined weight', () => {
  const bands = [
    { centerDeg: 0, halfWidthDeg: 90, shiftDeg: 30, saturationMultiplier: 1.5 },
    { centerDeg: 0, halfWidthDeg: 90, shiftDeg: -10, saturationMultiplier: 0.5 },
  ];
  expectRgb(createAuthoringTransform(definition({ hueBands: bands }))([1, 0, 0]), [1, 1 / 6, 0]);
});

test('band order does not change output or mutate the supplied list', () => {
  const bands = [
    { centerDeg: 350, halfWidthDeg: 80, shiftDeg: -13, saturationMultiplier: 0.8 },
    { centerDeg: 20, halfWidthDeg: 60, shiftDeg: 23, saturationMultiplier: 1.4 },
    { centerDeg: 0, halfWidthDeg: 40, shiftDeg: 7, saturationMultiplier: 1.1 },
  ];
  const before = JSON.stringify(bands);
  const forward = createAuthoringTransform(definition({ hueBands: bands }));
  const reverse = createAuthoringTransform(definition({ hueBands: [...bands].reverse() }));
  for (const rgb of SAMPLES) expect(forward(rgb)).toEqual(reverse(rgb));
  expect(JSON.stringify(bands)).toBe(before);
});

test('hue mask protects near grays and fades in smoothly', () => {
  const transform = createAuthoringTransform(definition({
    hueBands: [{ centerDeg: 0, halfWidthDeg: 90, shiftDeg: 20, saturationMultiplier: 1 }],
  }));
  expectRgb(transform([0.4, 0.4, 0.4]), [0.4, 0.4, 0.4]);
  expectRgb(transform([1, 0.96, 0.96]), [1, 0.96, 0.96]);
  expectRgb(transform([1, 0.85, 0.85]), [1, 0.875, 0.85]);
});

test('tone, tint, hue and final encoded saturation are applied in the specified order', () => {
  const transform = createAuthoringTransform(definition({
    toneCurve: [[0, 0.1], [0.2, 0.2], [0.4, 0.4], [0.6, 0.6], [0.8, 0.8], [1, 1]],
    shadowTintRgb: [0.1, 0, 0], saturation: 0,
    hueBands: [{ centerDeg: 0, halfWidthDeg: 90, shiftDeg: 30, saturationMultiplier: 1 }],
  }));
  // Black -> gray 0.1 -> [0.2, 0.1, 0.1] -> [0.2, 0.15, 0.1] -> gray.
  expectRgb(transform([0, 0, 0]), [0.15702, 0.15702, 0.15702]);
});

test('a created transform retains its settings after the authoring source changes', () => {
  const point: [number, number] = [0.2, 0.2];
  const shadow: [number, number, number] = [0.05, 0, 0];
  const band = { centerDeg: 0, halfWidthDeg: 90, shiftDeg: 20, saturationMultiplier: 1 };
  const authoring = {
    ...definition(), shadowTintRgb: shadow, hueBands: [band],
    toneCurve: [[0, 0], point, [0.4, 0.4], [0.6, 0.6], [0.8, 0.8], [1, 1]] as const,
  };
  const transform = createAuthoringTransform(authoring);
  const input: Rgb = [0.3, 0.1, 0.1];
  const before = transform(input);
  authoring.exposureEv = 1;
  authoring.saturation = 0;
  shadow[0] = 0.1;
  point[1] = 0.9;
  band.shiftDeg = -30;
  expect(transform(input)).toEqual(before);
  expect(input).toEqual([0.3, 0.1, 0.1]);
});

test.each([
  { exposureEv: Infinity }, { exposureEv: 1.1 }, { saturation: -0.1 },
  { shadowTintRgb: [NaN, 0, 0] }, { highlightTintRgb: [0, 0, 0.11] },
  { hueBands: [{ centerDeg: 360, halfWidthDeg: 20, shiftDeg: 0, saturationMultiplier: 1 }] },
  { hueBands: [{ centerDeg: 0, halfWidthDeg: 0, shiftDeg: 0, saturationMultiplier: 1 }] },
] satisfies Partial<FilterAuthoring>[])('rejects invalid authoring values without coercion: %j', overrides => {
  expect(() => createAuthoringTransform(definition(overrides))).toThrow(RangeError);
});

test('existing seed drafts produce finite, bounded, deterministic RGB values', () => {
  const result = createFilterSeedValidator(schema)(seed);
  if (!result.ok) throw new Error('The authoring seed must pass validation before rendering');
  for (const filter of result.data.filters) {
    const transform = createAuthoringTransform(filter.authoring);
    for (const input of SAMPLES) {
      const output = transform(input);
      expect(transform(input)).toEqual(output);
      for (const channel of output) {
        expect(Number.isFinite(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
    }
  }
});
