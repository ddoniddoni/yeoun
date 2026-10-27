import {
  AlphaType, ColorType, FilterMode, MipmapMode, Skia, TileMode,
  type SkImage, type SkPaint, type SkShader, type SkSurface,
} from '@shopify/react-native-skia';
import type { LutAtlas } from '../reference/lutAtlas';
import { createLutSampler } from '../reference/lutSampling';
import { createSkiaLutPipeline, type LutShaderBinding, type SkiaLutPipeline } from './lutSkia';

export type LutSkiaMeasurement = Readonly<{
  sampleCount: number;
  maxRgbErrorLsb: number;
  maxAlphaErrorLsb: number;
  worstSample: number;
  execution: 'skia-offscreen';
}>;

/**
 * Explicitly invoked, synthetic-only measurement. Never called at import or from the camera UI.
 * No PASS label: offscreen backend, color-space behavior and real GPU/device must be identified separately.
 */
export function measureLutSkia(atlas: LutAtlas): LutSkiaMeasurement {
  const sample = createLutSampler(atlas);
  const levels = [0, 1, 7, 8, 39, 40, 47, 48, 127, 128, 247, 248, 254, 255];
  const colors: [number, number, number][] = [];
  for (const red of [0, 255]) for (const green of [0, 255]) for (const blue of [0, 255]) colors.push([red, green, blue]);
  for (const level of levels) {
    colors.push([level, level, level], [level, 93, 207], [93, level, 207], [93, 207, level]);
  }
  const bytes = new Uint8Array(colors.length * 4);
  colors.forEach((rgb, index) => bytes.set([...rgb, 255], index * 4));
  const info = { width: colors.length, height: 1, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Opaque };
  const data = Skia.Data.fromBytes(bytes);
  let input: SkImage | null = null;
  let inputShader: SkShader | undefined;
  let pipeline: SkiaLutPipeline | undefined;
  let binding: LutShaderBinding | undefined;
  let surface: SkSurface | null = null;
  let paint: SkPaint | undefined;
  let output: SkImage | undefined;
  let operationFailed = false;
  try {
    input = Skia.Image.MakeImage(info, data, info.width * 4);
    if (!input) throw new Error('Synthetic LUT input allocation failed');
    inputShader = input.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Nearest, MipmapMode.None);
    pipeline = createSkiaLutPipeline(atlas);
    binding = pipeline.bindSource(inputShader);
    surface = Skia.Surface.MakeOffscreen(info.width, info.height);
    if (!surface) throw new Error('LUT offscreen surface unavailable');
    paint = Skia.Paint();
    paint.setAlphaf(1);
    paint.setShader(binding.shader);
    surface.getCanvas().clear(Skia.Color('transparent'));
    surface.getCanvas().drawPaint(paint);
    surface.flush();
    output = surface.makeImageSnapshot();
    // Opaque readback would hide an incorrect output alpha by forcing it to 255.
    const actual = output.readPixels(0, 0, { ...info, alphaType: AlphaType.Unpremul });
    if (!(actual instanceof Uint8Array) || actual.length !== bytes.length) throw new Error('LUT RGBA8 readback failed');
    let maxRgbErrorLsb = 0;
    let maxAlphaErrorLsb = 0;
    let worstSample = 0;
    colors.forEach(([red, green, blue], index) => {
      const expected = sample([red / 255, green / 255, blue / 255]);
      for (let channel = 0; channel < 3; channel++) {
        const error = Math.abs(actual[index * 4 + channel]! - Math.round(expected[channel]! * 255));
        if (error > maxRgbErrorLsb) { maxRgbErrorLsb = error; worstSample = index; }
      }
      maxAlphaErrorLsb = Math.max(maxAlphaErrorLsb, Math.abs(actual[index * 4 + 3]! - 255));
    });
    return { sampleCount: colors.length, maxRgbErrorLsb, maxAlphaErrorLsb, worstSample, execution: 'skia-offscreen' };
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    let failure: { error: unknown } | undefined;
    for (const resource of [output, paint, surface, binding, pipeline, inputShader, input, data]) {
      try { resource?.dispose(); }
      catch (error) { failure ??= { error }; }
    }
    if (!operationFailed && failure) throw failure.error;
  }
}
