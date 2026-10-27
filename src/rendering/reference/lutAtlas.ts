import type { LutContract, Rgb } from '../../domain/filters/types.ts';
import { assertRgbRange } from './color.ts';

export const LUT_CONTRACT: LutContract = Object.freeze({
  size: 33, tilesPerRow: 6, paddingPixels: 1, atlasWidth: 210, atlasHeight: 210,
  inputSpace: 'srgb-encoded', outputSpace: 'srgb-encoded', axisOrder: 'r-fastest-g-next-b-slice', alpha: 1,
});
const SIZE = LUT_CONTRACT.size;
const TILE = SIZE + 2 * LUT_CONTRACT.paddingPixels;
const WIDTH = LUT_CONTRACT.atlasWidth;
const HEIGHT = LUT_CONTRACT.atlasHeight;

export type LutAtlas = Readonly<{ width: number; height: number; pixels: Uint8Array }>;

/** Raw RGBA8 lookup data, with top-left origin; not camera frame data or a display image. */
export function createLutAtlas(transform: (input: Rgb) => Rgb): LutAtlas {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let offset = 3; offset < pixels.length; offset += 4) pixels[offset] = 255;

  for (let blue = 0; blue < SIZE; blue++) {
    const tileX = (blue % LUT_CONTRACT.tilesPerRow) * TILE;
    const tileY = Math.floor(blue / LUT_CONTRACT.tilesPerRow) * TILE;
    for (let green = 0; green < SIZE; green++) {
      for (let red = 0; red < SIZE; red++) {
        const output = transform([red / (SIZE - 1), green / (SIZE - 1), blue / (SIZE - 1)]);
        assertRgbRange(output);
        const offset = ((tileY + green + 1) * WIDTH + tileX + red + 1) * 4;
        pixels[offset] = Math.round(output[0] * 255);
        pixels[offset + 1] = Math.round(output[1] * 255);
        pixels[offset + 2] = Math.round(output[2] * 255);
      }
    }
    // Duplicate quantized edge texels (including corners); never evaluate padding separately.
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        if (x > 0 && x < TILE - 1 && y > 0 && y < TILE - 1) continue;
        const sourceX = Math.max(1, Math.min(SIZE, x));
        const sourceY = Math.max(1, Math.min(SIZE, y));
        const source = ((tileY + sourceY) * WIDTH + tileX + sourceX) * 4;
        const target = ((tileY + y) * WIDTH + tileX + x) * 4;
        pixels.set(pixels.subarray(source, source + 4), target);
      }
    }
  }
  return { width: WIDTH, height: HEIGHT, pixels };
}

/** Structural checks only: this cannot establish identity, LUT color accuracy or GPU sampling. */
export function assertLutAtlasStructure(atlas: LutAtlas): void {
  if (atlas.width !== WIDTH || atlas.height !== HEIGHT || atlas.pixels.length !== WIDTH * HEIGHT * 4) {
    throw new Error('Expected a 210x210 RGBA8 LUT atlas');
  }
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const offset = (y * WIDTH + x) * 4;
      if (atlas.pixels[offset + 3] !== 255) throw new Error(`LUT alpha must be 255 at ${x},${y}`);
      const tileX = Math.floor(x / TILE);
      const tileY = Math.floor(y / TILE);
      const slice = tileY * LUT_CONTRACT.tilesPerRow + tileX;
      if (slice >= SIZE) {
        if (atlas.pixels[offset] !== 0 || atlas.pixels[offset + 1] !== 0 || atlas.pixels[offset + 2] !== 0) {
          throw new Error(`Unused LUT tile must be opaque black at ${x},${y}`);
        }
        continue;
      }
      const localX = x % TILE;
      const localY = y % TILE;
      if (localX > 0 && localX < TILE - 1 && localY > 0 && localY < TILE - 1) continue;
      const innerX = tileX * TILE + Math.max(1, Math.min(SIZE, localX));
      const innerY = tileY * TILE + Math.max(1, Math.min(SIZE, localY));
      const inner = (innerY * WIDTH + innerX) * 4;
      for (let channel = 0; channel < 3; channel++) {
        if (atlas.pixels[offset + channel] !== atlas.pixels[inner + channel]) {
          throw new Error(`LUT padding does not duplicate its edge at ${x},${y}`);
        }
      }
    }
  }
}
