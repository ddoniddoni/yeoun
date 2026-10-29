import type { Rgb } from '../../domain/filters/types';
import { assertGrainSeed } from '../../domain/filters/grainSeed';
import { grainStyle } from '../../domain/filters/grainStyle';
import { assertRange, assertRgbRange, clamp01, encodedLuma, linearToSrgbChannel, smoothstep, srgbToLinearChannel } from './color';
import { mixMasterIntensity } from './intensity';

/** Synthetic CPU reference only. Never feed camera pixels through JS. */
export function grainHash(x: number, y: number, seed: number): number {
  assertGrainSeed(seed);
  if (![x, y].every(Number.isInteger)) throw new Error('Integer grain cell required');
  x = Math.max(0, Math.min(1599, x)); y = Math.max(0, Math.min(1599, y));
  let h = (x + y * 131 + seed * 17) % 4093;
  const h2 = h * h % 4093;
  const h4 = h2 * h2 % 4093;
  h = h4 * h % 4093;
  return ((h * 109 + 1021) % 4093) / 2046 - 1;
}

export function sampleGrain(x: number, y: number, width: number, height: number, seed: number, filterId = ''): number {
  assertGrainSeed(seed);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('Invalid grain geometry');
  const longest = Math.max(width, height);
  const { resolution } = grainStyle(filterId);
  const px = Math.max(0, Math.min(width, x)) * resolution / longest;
  const py = Math.max(0, Math.min(height, y)) * resolution / longest;
  const noise = (nx: number, ny: number) => {
    const ix = Math.floor(nx), iy = Math.floor(ny);
    const fx = smoothstep(0, 1, nx - ix), fy = smoothstep(0, 1, ny - iy);
    const low = grainHash(ix, iy, seed) * (1 - fx) + grainHash(ix + 1, iy, seed) * fx;
    const high = grainHash(ix, iy + 1, seed) * (1 - fx) + grainHash(ix + 1, iy + 1, seed) * fx;
    return low * (1 - fy) + high * fy;
  };
  const offset = Math.max(1, resolution / longest) * 0.25;
  return (noise(px - offset, py - offset) + noise(px + offset, py - offset) +
    noise(px - offset, py + offset) + noise(px + offset, py + offset)) * 0.25 * Math.min(1, longest / resolution);
}

export function extractBright(looked: Rgb): Rgb {
  assertRgbRange(looked);
  const linear: Rgb = [srgbToLinearChannel(looked[0]), srgbToLinearChannel(looked[1]), srgbToLinearChannel(looked[2])];
  const mask = smoothstep(0.65, 0.95, encodedLuma(linear));
  return [linear[0] * mask, linear[1] * mask, linear[2] * mask];
}

export function gaussianWeights(sigma: number): readonly number[] {
  assertRange(sigma, 0, 1.536, 'Bloom sigma');
  const weights = Array.from({ length: 11 }, (_, index) => Math.exp(-0.5 * (index - 5) ** 2 / Math.max(sigma * sigma, 0.000001)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map(value => value / total);
}

export function composeSpatial(original: Rgb, looked: Rgb, blurredLinear: Rgb,
  settings: { intensity: number; grain: number; bloom: number; filterId?: string }, noise: number): Rgb {
  assertRgbRange(original); assertRgbRange(looked); assertRgbRange(blurredLinear);
  assertRange(noise, -1, 1, 'Grain noise');
  for (const amount of [settings.intensity, settings.grain, settings.bloom]) assertRange(amount, 0, 1, 'Strength');
  if (settings.intensity === 0) return [...original];
  const channel = (index: 0 | 1 | 2) => linearToSrgbChannel(clamp01(
    srgbToLinearChannel(looked[index]) + 0.6 * settings.bloom * blurredLinear[index],
  ));
  const bloomed: Rgb = [channel(0), channel(1), channel(2)];
  const envelope = 0.35 + 0.65 * (1 - Math.abs(2 * encodedLuma(bloomed) - 1));
  const offset = noise * grainStyle(settings.filterId ?? '').amplitude * settings.grain * envelope;
  const styled: Rgb = [clamp01(bloomed[0] + offset), clamp01(bloomed[1] + offset), clamp01(bloomed[2] + offset)];
  return mixMasterIntensity(original, styled, settings.intensity);
}
