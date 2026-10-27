import type { Rgb } from '../../domain/filters/types.ts';

export type Hsv = readonly [hueDegrees: number, saturation: number, value: number];

export function assertRange(value: unknown, minimum: number, maximum: number, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be finite and within [${minimum}, ${maximum}]`);
  }
}

export function assertRgbRange(rgb: Rgb, minimum = 0, maximum = 1, name = 'RGB'): void {
  if (rgb.length !== 3) throw new RangeError(`${name} must have three channels`);
  for (let index = 0; index < 3; index++) {
    assertRange(rgb[index], minimum, maximum, `${name}[${index}]`);
  }
}

// Clipping is only for intermediate effect results. Invalid input is rejected first.
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Cannot clamp a non-finite value');
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(lower: number, upper: number, value: number): number {
  if (![lower, upper, value, upper - lower].every(Number.isFinite) || lower >= upper) {
    throw new RangeError('smoothstep requires finite values and lower < upper');
  }
  const t = clamp01((value - lower) / (upper - lower));
  return t * t * (3 - 2 * t);
}

/** SDR sRGB encoded channel -> linear channel, both normalized to [0, 1]. */
export function srgbToLinearChannel(encoded: number): number {
  assertRange(encoded, 0, 1, 'sRGB channel');
  return encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4;
}

/** Linear channel -> SDR sRGB encoded channel; this does not normalize P3/HDR input. */
export function linearToSrgbChannel(linear: number): number {
  assertRange(linear, 0, 1, 'Linear channel');
  return linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
}

/** Style-mask brightness approximation in encoded RGB, not physical luminance. */
export function encodedLuma(rgb: Rgb): number {
  assertRgbRange(rgb);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

export function wrapHue(degrees: number): number {
  if (!Number.isFinite(degrees)) throw new RangeError('Hue must be finite');
  return ((degrees % 360) + 360) % 360;
}

export function rgbToHsv(rgb: Rgb): Hsv {
  assertRgbRange(rgb);
  const [red, green, blue] = rgb;
  const maximum = Math.max(red, green, blue);
  const delta = maximum - Math.min(red, green, blue);
  if (delta === 0) return [0, 0, maximum];

  let sector: number;
  if (maximum === red) sector = (green - blue) / delta;
  else if (maximum === green) sector = (blue - red) / delta + 2;
  else sector = (red - green) / delta + 4;
  return [wrapHue(sector * 60), delta / maximum, maximum];
}

export function hsvToRgb(hsv: Hsv): Rgb {
  if (hsv.length !== 3) throw new RangeError('HSV must have three components');
  const [hue, saturation, value] = hsv;
  assertRange(hue, 0, 360, 'Hue');
  if (hue === 360) throw new RangeError('Hue must be less than 360; use wrapHue first');
  assertRange(saturation, 0, 1, 'HSV saturation');
  assertRange(value, 0, 1, 'HSV value');
  if (saturation === 0) return [value, value, value];

  const sector = hue / 60;
  const chroma = value * saturation;
  const secondary = chroma * (1 - Math.abs(sector % 2 - 1));
  const offset = value - chroma;
  let channels: Rgb;
  if (sector < 1) channels = [chroma, secondary, 0];
  else if (sector < 2) channels = [secondary, chroma, 0];
  else if (sector < 3) channels = [0, chroma, secondary];
  else if (sector < 4) channels = [0, secondary, chroma];
  else if (sector < 5) channels = [secondary, 0, chroma];
  else channels = [chroma, 0, secondary];
  return [clamp01(channels[0] + offset), clamp01(channels[1] + offset), clamp01(channels[2] + offset)];
}
