import { assertLutAtlasStructure, type LutAtlas } from './lutAtlas.ts';

/** Owned Alpha_8 upload buffers in R/G/B order; alpha stores data, not image opacity. */
export function createLutAlphaPlanes(atlas: LutAtlas): readonly [Uint8Array, Uint8Array, Uint8Array] {
  assertLutAtlasStructure(atlas);
  const count = atlas.width * atlas.height;
  // Full, offset-zero buffers also avoid Skia 2.4.18 fromBytes reading a view's entire backing buffer.
  const red = new Uint8Array(count);
  const green = new Uint8Array(count);
  const blue = new Uint8Array(count);
  for (let pixel = 0; pixel < count; pixel++) {
    red[pixel] = atlas.pixels[pixel * 4]!;
    green[pixel] = atlas.pixels[pixel * 4 + 1]!;
    blue[pixel] = atlas.pixels[pixel * 4 + 2]!;
  }
  return [red, green, blue];
}
