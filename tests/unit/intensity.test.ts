import { mixMasterIntensity } from '../../src/rendering/reference/intensity';

test('zero is original and one is styled, without changing inputs', () => {
  const original = [0.1, 0.7, 0.3] as const;
  const styled = [0.8, 0.2, 0.6] as const;
  expect(mixMasterIntensity(original, styled, 0)).toEqual(original);
  expect(mixMasterIntensity(original, styled, 1)).toEqual(styled);
  expect(original).toEqual([0.1, 0.7, 0.3]);
});

test('midpoint blends encoded channels; it is neither linear-light mixing nor squared strength', () => {
  expect(mixMasterIntensity([0, 1, 0.2], [1, 0, 0.6], 0.5)).toEqual([0.5, 0.5, 0.4]);
  expect(mixMasterIntensity([0, 0, 0], [1, 1, 1], 0.8)).toEqual([0.8, 0.8, 0.8]);
});

test('nonfinite and out-of-range values are rejected', () => {
  for (const value of [NaN, Infinity, -0.1, 1.1]) {
    expect(() => mixMasterIntensity([0, 0, 0], [1, 1, 1], value)).toThrow();
  }
  expect(() => mixMasterIntensity([NaN, 0, 0], [1, 1, 1], 0)).toThrow();
});
