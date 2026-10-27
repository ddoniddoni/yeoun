import type { Rgb } from '../../domain/filters/types.ts';
import { assertRgbRange } from './color.ts';
import { assertLutAtlasStructure, LUT_CONTRACT, type LutAtlas } from './lutAtlas.ts';

const LAST = LUT_CONTRACT.size - 1;
const TILE = LUT_CONTRACT.size + 2 * LUT_CONTRACT.paddingPixels;

// Integer grid coordinates address inner texels, not padding or GPU pixel centers.
function texelOffset(red: number, green: number, blue: number): number {
  const x = (blue % LUT_CONTRACT.tilesPerRow) * TILE + LUT_CONTRACT.paddingPixels + red;
  const y = Math.floor(blue / LUT_CONTRACT.tilesPerRow) * TILE + LUT_CONTRACT.paddingPixels + green;
  return (y * LUT_CONTRACT.atlasWidth + x) * 4;
}

function mix(lower: number, upper: number, fraction: number): number {
  return lower + (upper - lower) * fraction;
}

/**
 * CPU reference over an owned snapshot of a decoded RGBA8 LUT (not camera frames).
 * Input/output are normalized encoded sRGB. No gamma conversion or output quantization.
 * Construct once per LUT; structural validation does not establish look/color accuracy.
 */
export function createLutSampler(atlas: LutAtlas): (input: Rgb) => Rgb {
  assertLutAtlasStructure(atlas);
  // Uint8Array.from also copies Buffer inputs; Buffer.slice would retain shared storage.
  const pixels = Uint8Array.from(atlas.pixels);

  return input => {
    assertRgbRange(input);
    const red = input[0] * LAST;
    const green = input[1] * LAST;
    const blue = input[2] * LAST;
    const r0 = Math.floor(red);
    const g0 = Math.floor(green);
    const b0 = Math.floor(blue);
    // At input=1 the upper point stays at 32, never slice 33 (an unused tile).
    const r1 = Math.min(r0 + 1, LAST);
    const g1 = Math.min(g0 + 1, LAST);
    const b1 = Math.min(b0 + 1, LAST);
    const fr = red - r0;
    const fg = green - g0;
    const fb = blue - b0;
    const c000 = texelOffset(r0, g0, b0);
    const c100 = texelOffset(r1, g0, b0);
    const c010 = texelOffset(r0, g1, b0);
    const c110 = texelOffset(r1, g1, b0);
    const c001 = texelOffset(r0, g0, b1);
    const c101 = texelOffset(r1, g0, b1);
    const c011 = texelOffset(r0, g1, b1);
    const c111 = texelOffset(r1, g1, b1);

    const channel = (index: 0 | 1 | 2): number => {
      // The validated buffer and bounded grid indices guarantee these byte offsets exist.
      const lower = mix(
        mix(pixels[c000 + index]!, pixels[c100 + index]!, fr),
        mix(pixels[c010 + index]!, pixels[c110 + index]!, fr), fg,
      );
      const upper = mix(
        mix(pixels[c001 + index]!, pixels[c101 + index]!, fr),
        mix(pixels[c011 + index]!, pixels[c111 + index]!, fr), fg,
      );
      // Interpolate stored bytes directly and normalize once; preserve fractional output.
      return mix(lower, upper, fb) / 255;
    };
    return [channel(0), channel(1), channel(2)];
  };
}
