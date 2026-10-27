import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';
import { assertLutPngContainer } from '../assets/lutPng';
import { assertLutAtlasStructure, LUT_CONTRACT, type LutAtlas } from '../reference/lutAtlas';

/** LUT data only. Caller verifies SHA-256; this checks format before decoding without a canvas. */
export function decodeLutWithSkia(bytes: Uint8Array): LutAtlas {
  assertLutPngContainer(bytes);
  const data = Skia.Data.fromBytes(Uint8Array.from(bytes));
  let image: SkImage | null = null;
  let operationFailed = false;
  try {
    image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) throw new Error('LUT PNG decode failed');
    if (image.width() !== LUT_CONTRACT.atlasWidth || image.height() !== LUT_CONTRACT.atlasHeight) {
      throw new Error('Decoded LUT dimensions mismatch');
    }
    const pixels = image.readPixels(0, 0, { width: image.width(), height: image.height(),
      colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul });
    if (!(pixels instanceof Uint8Array)) throw new Error('LUT RGBA8 decode readback failed');
    const atlas = { width: image.width(), height: image.height(), pixels: Uint8Array.from(pixels) };
    assertLutAtlasStructure(atlas);
    return atlas;
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    let failure: { error: unknown } | undefined;
    for (const resource of [image, data]) {
      try { resource?.dispose(); }
      catch (error) { failure ??= { error }; }
    }
    if (!operationFailed && failure) throw failure.error;
  }
}
