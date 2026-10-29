import { composeSpatial, extractBright, gaussianWeights, grainHash, sampleGrain } from '../../src/rendering/reference/spatial';
import { bloomGeometry, previewGeometry, spatialGeometry } from '../../src/rendering/reference/spatialGeometry';
import { orientationTransform } from '../../src/rendering/adapters/jpegOrientation';
import { grainStyle } from '../../src/domain/filters/grainStyle';

test('film grain is coarser at the same framing while digital keeps the original grain response', () => {
  expect(grainStyle('retro-film')).toEqual({ resolution: 800, amplitude: 0.075 });
  expect(grainStyle('retro-digital')).toEqual({ resolution: 1600, amplitude: 0.04 });
  expect(sampleGrain(123, 345, 1200, 1600, 12, 'retro-film'))
    .toBe(sampleGrain(246, 690, 2400, 3200, 12, 'retro-film'));
  expect(sampleGrain(123, 345, 1200, 1600, 12, 'retro-digital'))
    .toBe(sampleGrain(123, 345, 1200, 1600, 12));
  const rgb = [0.5, 0.5, 0.5] as const;
  const full = { intensity: 1, grain: 1, bloom: 0 };
  expect(composeSpatial(rgb, rgb, [0, 0, 0], { ...full, filterId: 'retro-film' }, 1)[0]).toBeCloseTo(0.575);
  expect(composeSpatial(rgb, rgb, [0, 0, 0], { ...full, filterId: 'retro-digital' }, 1))
    .toEqual(composeSpatial(rgb, rgb, [0, 0, 0], full, 1));
});

test('grain seed permutation is bounded and zero mean, without temporal input', () => {
  const values = Array.from({ length: 4093 }, (_, seed) => grainHash(321, 527, seed));
  expect(new Set(values).size).toBe(4093);
  expect(Math.min(...values)).toBe(-1); expect(Math.max(...values)).toBe(1);
  expect(values.reduce((sum, value) => sum + value, 0) / values.length).toBeCloseTo(0, 12);
  expect(sampleGrain(123, 345, 1200, 1600, 12)).toBe(sampleGrain(246, 690, 2400, 3200, 12));
  expect(sampleGrain(123, 345, 1200, 1600, 13)).not.toBe(sampleGrain(123, 345, 1200, 1600, 12));
  expect(Math.abs(sampleGrain(10, 20, 300, 400, 7))).toBeLessThanOrEqual(0.25);
});

test('highlight extraction leaves midtones alone; blur preserves DC and has symmetric weights', () => {
  expect(extractBright([0.5, 0.5, 0.5])).toEqual([0, 0, 0]);
  expect(extractBright([1, 1, 1])).toEqual([1, 1, 1]);
  const weights = gaussianWeights(1.536);
  expect(weights.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
  expect(weights).toEqual([...weights].reverse());
  expect(gaussianWeights(0)[5]).toBe(1);
});

test('bloom then grain are mixed with original once, and zero intensity bypasses both', () => {
  const original = [0.1, 0.2, 0.3] as const, looked = [0.5, 0.5, 0.5] as const, bright = [0.3, 0.3, 0.3] as const;
  expect(composeSpatial(original, looked, bright, { intensity: 0, grain: 1, bloom: 1 }, 1)).toEqual(original);
  const full = composeSpatial(original, looked, bright, { intensity: 1, grain: 1, bloom: 1 }, 1);
  const half = composeSpatial(original, looked, bright, { intensity: 0.5, grain: 1, bloom: 1 }, 1);
  half.forEach((value, index) => expect(value).toBeCloseTo((original[index]! + full[index]!) / 2, 12));
  const grain = composeSpatial(looked, looked, [0, 0, 0], { intensity: 1, grain: 1, bloom: 0 }, 1);
  grain.forEach(value => expect(value).toBeCloseTo(0.54, 12));
  expect(composeSpatial([1, 1, 1], [1, 1, 1], bright, { intensity: 1, grain: 1, bloom: 1 }, 1)).toEqual([1, 1, 1]);
});

test.each([NaN, Infinity, -1, 4093, 0.5])('rejects invalid grain seed %s', seed => {
  expect(() => sampleGrain(1, 1, 1200, 1600, seed)).toThrow();
});

test('bloom buffers are quarter size at most, capped at 512, with normalized sigma on each axis', () => {
  for (const [w, h] of [[960, 1280], [4032, 3024], [3000, 4000]]) {
    const small = bloomGeometry(w!, h!);
    expect(Math.max(small.width, small.height)).toBeLessThanOrEqual(512);
    expect(small.width).toBeLessThanOrEqual(w! / 4);
    expect(small.height).toBeLessThanOrEqual(h! / 4);
    expect(small.sigmaX / small.scaleX).toBeCloseTo(Math.max(w!, h!) * 0.003);
    expect(small.sigmaY / small.scaleY).toBeCloseTo(Math.max(w!, h!) * 0.003);
  }
});

test('all EXIF orientations and crops map output center to source center and back', () => {
  for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
    const geometry = spatialGeometry(4000, 2250, orientationTransform(orientation, 4000, 2250));
    const [a, b, c, d, tx, ty] = geometry.forward;
    const x = a * 2000 + c * 1125 + tx, y = b * 2000 + d * 1125 + ty;
    expect(x).toBe(geometry.width / 2); expect(y).toBe(geometry.height / 2);
    const [ia, ib, ic, id, ix, iy] = geometry.inverse;
    expect(ia * x + ic * y + ix).toBe(2000); expect(ib * x + id * y + iy).toBe(1125);
  }
});

test('preview counter rotation and mirror precede grain coordinates', () => {
  expect(previewGeometry(1280, 960, 'left', false).forward).toEqual([0, 1, -1, 0, 960, 0]);
  expect(previewGeometry(1280, 960, 'right', true).forward).toEqual([0, -1, -1, 0, 960, 1280]);
  expect(previewGeometry(960, 1280, 'up', true).forward).toEqual([-1, 0, 0, 1, 960, 0]);
});
