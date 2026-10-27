import type { Rgb } from '../../src/domain/filters/types';
import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';
import { createLutSampler } from '../../src/rendering/reference/lutSampling';

const identity = createLutAtlas(input => input);
const sampleIdentity = createLutSampler(identity);

function expectRgb(actual: Rgb, expected: Rgb): void {
  for (let channel = 0; channel < 3; channel++) {
    expect(actual[channel]).toBeCloseTo(expected[channel]!, 14);
  }
}

test('every identity grid point equals its stored 8-bit value, including all eight corners', () => {
  let maximumError = 0;
  for (let blue = 0; blue <= 32; blue++) {
    for (let green = 0; green <= 32; green++) {
      for (let red = 0; red <= 32; red++) {
        const input: Rgb = [red / 32, green / 32, blue / 32];
        const actual = sampleIdentity(input);
        for (let channel = 0; channel < 3; channel++) {
          maximumError = Math.max(maximumError, Math.abs(actual[channel]! - Math.round(input[channel]! * 255) / 255));
        }
      }
    }
  }
  expect(maximumError).toBe(0);
});

test('gray and fixed-seed fractional identity samples stay within half an 8-bit step', () => {
  let state = 0x1a2b3c4d;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let index = 0; index <= 128; index++) {
    const gray = index / 128;
    const inputs: Rgb[] = [[gray, gray, gray], [next(), next(), next()]];
    for (const input of inputs) {
      const output = sampleIdentity(input);
      for (let channel = 0; channel < 3; channel++) {
        expect(Math.abs(output[channel]! - input[channel]!)).toBeLessThanOrEqual(0.5 / 255 + 1e-14);
      }
    }
    const output = sampleIdentity([gray, gray, gray]);
    expect(output[0]).toBe(output[1]);
    expect(output[1]).toBe(output[2]);
  }
  // Encoded mid-gray remains near 0.5; do not decode or encode gamma a second time.
  expectRgb(sampleIdentity([0.5, 0.5, 0.5]), [128 / 255, 128 / 255, 128 / 255]);
});

test('uses all eight independently specified corners across a blue tile-row boundary', () => {
  const atlas = createLutAtlas(() => [0, 0, 0]);
  // Cell r=7..8, g=13..14, b=5..6. Coordinates are explicit, independent of the sampler.
  const corners = [
    { x: 183, y: 14, rgb: [0, 0, 0] },
    { x: 184, y: 14, rgb: [255, 0, 0] },
    { x: 183, y: 15, rgb: [0, 255, 0] },
    { x: 184, y: 15, rgb: [0, 0, 255] },
    { x: 8, y: 49, rgb: [32, 64, 128] },
    { x: 9, y: 49, rgb: [200, 100, 50] },
    { x: 8, y: 50, rgb: [50, 200, 100] },
    { x: 9, y: 50, rgb: [240, 120, 60] },
  ];
  for (const { x, y, rgb } of corners) atlas.pixels.set(rgb, (y * 210 + x) * 4);
  const sample = createLutSampler(atlas);
  // Fractions 1/4, 1/2, 3/4 give weights [3,1,3,1,9,3,9,3]/32.
  const result = sample([7.25 / 32, 13.5 / 32, 5.75 / 32]);
  expectRgb(result, [2313 / (32 * 255), 3801 / (32 * 255), 2637 / (32 * 255)]);
  expect(result[0] * 255).not.toBe(Math.round(result[0] * 255));
});

test('interpolates quantized grid values instead of reevaluating the analytic function', () => {
  const sample = createLutSampler(createLutAtlas(([red, green, blue]) => [red * red, green, blue]));
  const result = sample([0.05, 0, 0]);
  // Red grid points 1/32 and 2/32 quantize to bytes 0 and 1; fraction is 0.6.
  expectRgb(result, [0.6 / 255, 0, 0]);
  expect(result[0]).not.toBeCloseTo(0.05 ** 2, 6);
});

test('remains continuous on every blue slice and at RGB endpoints', () => {
  const epsilon = 1e-8;
  for (let slice = 1; slice < 32; slice++) {
    const blue = slice / 32;
    const below = sampleIdentity([0.37, 0.81, blue - epsilon]);
    const above = sampleIdentity([0.37, 0.81, blue + epsilon]);
    expect(below[0]).toBe(above[0]);
    expect(below[1]).toBe(above[1]);
    expect(Math.abs(above[2] - below[2])).toBeLessThan(3 * epsilon);
  }
  expectRgb(sampleIdentity([1, 1, 1]), [1, 1, 1]);
  expectRgb(sampleIdentity([1 - epsilon, epsilon, 1 - epsilon]), [1 - epsilon * 256 / 255, epsilon * 256 / 255, 1 - epsilon * 256 / 255]);
});

test('copies only a typed-array view and preserves input data and sampling after caller changes', () => {
  const storage = new Uint8Array(identity.pixels.length + 16);
  const view = storage.subarray(8, 8 + identity.pixels.length);
  view.set(identity.pixels);
  const sample = createLutSampler({ ...identity, pixels: view });
  const input: Rgb = Object.freeze([0.25, 0.5, 0.75] as const);
  const first = sample(input);
  expect(view).toEqual(identity.pixels);
  storage.fill(0);
  expect(sample(input)).toEqual(first);
  expect(sample(input)).not.toBe(first);
  expect(input).toEqual([0.25, 0.5, 0.75]);
});

test.each([0, 1, 2])('rejects non-finite or out-of-range channel %s without clamping', channel => {
  for (const invalid of [NaN, Infinity, -Infinity, -0.001, 1.001]) {
    const input: [number, number, number] = [0.5, 0.5, 0.5];
    input[channel] = invalid;
    expect(() => sampleIdentity(input)).toThrow(RangeError);
  }
});

test.each([{ input: [0, 0] }, { input: [0, 0, 0, 0] }])('rejects an invalid RGB tuple: $input', ({ input }) => {
  expect(() => Reflect.apply(sampleIdentity, undefined, [input])).toThrow(RangeError);
});

test('rejects invalid size, alpha, padding and unused tiles at sampler construction', () => {
  expect(() => createLutSampler({ ...identity, width: 209 })).toThrow(/210x210/);
  expect(() => createLutSampler({ ...identity, pixels: identity.pixels.subarray(4) })).toThrow(/210x210/);
  for (const offset of [3, 0, (175 * 210 + 105) * 4]) {
    const pixels = Uint8Array.from(identity.pixels);
    pixels[offset] = pixels[offset] === 0 ? 1 : 0;
    expect(() => createLutSampler({ ...identity, pixels })).toThrow();
  }
});
