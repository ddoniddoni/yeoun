import type { Rgb } from '../../domain/filters/types';
import type { RetroControls } from '../../domain/filters/retroControls';
import { assertGrainSeed } from '../../domain/filters/grainSeed';
import { assertRange, assertRgbRange, clamp01, encodedLuma, smoothstep } from './color';

// Synthetic CPU reference only. Production camera pixels never pass through JS.
export function retroHash(x: number, y: number, seed: number, salt: number): number {
  assertGrainSeed(seed);
  const mod = (value: number, divisor: number) => value - divisor * Math.floor(value / divisor);
  let h = mod(mod(Math.floor(x), 1600) + mod(Math.floor(y), 1600) * 131 + seed * 17 + salt * 43, 4093);
  const h2 = h * h % 4093;
  const h4 = h2 * h2 % 4093;
  h = h4 * h % 4093;
  return ((h * 109 + 1021) % 4093) / 4092;
}

export function sharpenLinear(center: Rgb, neighborAverage: Rgb, amount: number): Rgb {
  assertRgbRange(center); assertRgbRange(neighborAverage); assertRange(amount, 0, 1, 'Sharpness');
  const channel = (i: 0 | 1 | 2) => clamp01(center[i] + (center[i] - neighborAverage[i]) * amount * 1.5);
  return [channel(0), channel(1), channel(2)];
}

export function halationLinear(center: Rgb, blurredBright: Rgb, amount: number): Rgb {
  assertRgbRange(center); assertRgbRange(blurredBright); assertRange(amount, 0, 1, 'Halation');
  const luminance = encodedLuma(center);
  const edge = Math.max(0, encodedLuma(blurredBright) - luminance * smoothstep(0.65, 0.95, luminance));
  return [clamp01(center[0] + edge * amount * 0.9), clamp01(center[1] + edge * amount * 0.14),
    clamp01(center[2] + edge * amount * 0.025)];
}

/** Encoded RGB after grain, before date stamp and the single master mix. */
export function applyRetroSample(input: Rgb, settings: RetroControls,
  x: number, y: number, width: number, height: number, seed: number): Rgb {
  assertRgbRange(input); assertGrainSeed(seed);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('Invalid retro geometry');
  for (const value of [settings.digitalNoise, settings.vignette, settings.lightLeak, settings.dust]) assertRange(value, 0, 1, 'Retro amount');
  let color: Rgb = [...input];
  const longest = Math.max(width, height), u = x / width, v = y / height;
  if (settings.digitalNoise > 0) {
    const shadow = 0.25 + 0.75 * (1 - encodedLuma(color));
    const channel = (i: 0 | 1 | 2) => color[i] + (retroHash(x * 1600 / longest, y * 1600 / longest, seed, i + 1) * 2 - 1) *
      0.055 * settings.digitalNoise * shadow * Math.min(1, longest / 1600);
    color = [channel(0), channel(1), channel(2)];
  }
  if (settings.vignette > 0) {
    const factor = 1 - 0.55 * settings.vignette * smoothstep(0.2, 1.6, (2 * u - 1) ** 2 + (2 * v - 1) ** 2);
    color = [color[0] * factor, color[1] * factor, color[2] * factor];
  }
  if (settings.lightLeak > 0) {
    const side = seed % 2 < 1 ? u : 1 - u;
    const center = 0.2 + 0.6 * (seed % 17) / 16;
    const leak = Math.exp(-side * 9) * Math.exp(-(((v - center) * 1.7) ** 2)) * settings.lightLeak * 0.7;
    color = [1 - (1 - clamp01(color[0])) * (1 - leak), 1 - (1 - clamp01(color[1])) * (1 - 0.27 * leak),
      1 - (1 - clamp01(color[2])) * (1 - 0.055 * leak)];
  }
  if (settings.dust > 0) {
    const gx = x / longest * 64, gy = y / longest * 64;
    const cx = Math.floor(gx), cy = Math.floor(gy);
    const hash = (salt: number) => retroHash(cx, cy, seed, salt);
    const centerX = hash(5) * 0.6 + 0.2, centerY = hash(6) * 0.6 + 0.2;
    const radius = 0.035 + 0.055 * hash(7), aa = Math.max(0.003, 64 / longest);
    const fleck = (1 - smoothstep(radius, radius + aa, Math.hypot(gx - cx - centerX, gy - cy - centerY))) *
      (hash(4) >= 0.965 ? 1 : 0) * settings.dust * 0.65;
    const target = hash(8) >= 0.5 ? 1 : 0;
    color = [color[0] * (1 - fleck) + target * fleck, color[1] * (1 - fleck) + target * fleck,
      color[2] * (1 - fleck) + target * fleck];
  }
  return [clamp01(color[0]), clamp01(color[1]), clamp01(color[2])];
}
