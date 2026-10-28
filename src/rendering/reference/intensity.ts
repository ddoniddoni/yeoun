import type { Rgb } from '../../domain/filters/types';
import { assertRange, assertRgbRange } from './color';

/** Master mix in encoded sRGB. Called on synthetic samples, never on camera frames. */
export function mixMasterIntensity(original: Rgb, styled: Rgb, intensity: number): Rgb {
  assertRange(intensity, 0, 1, 'Intensity');
  assertRgbRange(original); assertRgbRange(styled);
  return [
    original[0] * (1 - intensity) + styled[0] * intensity,
    original[1] * (1 - intensity) + styled[1] * intensity,
    original[2] * (1 - intensity) + styled[2] * intensity,
  ];
}
