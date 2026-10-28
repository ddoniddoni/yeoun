import { FilterMode, MipmapMode, Skia, TileMode, type SkRuntimeEffect, type SkShader } from '@shopify/react-native-skia';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { assertGrainSeed } from '../../domain/filters/grainSeed';
import { bloomGeometry, type SpatialGeometry } from '../reference/spatialGeometry';
import { BLUR_SKSL, BRIGHT_SKSL, SPATIAL_SKSL } from '../shaders/spatial';
import { releaseNativeResources, type NativeResource } from './lutResources';

export type SpatialResources = { bright: SkRuntimeEffect; blur: SkRuntimeEffect; composite: SkRuntimeEffect; owned: NativeResource[] };
export function createSpatialResources(): SpatialResources {
  'worklet';
  const owned: NativeResource[] = [];
  try {
    const compile = (source: string) => {
      const effect = Skia.RuntimeEffect.Make(source);
      if (!effect) throw new Error('Spatial SkSL compilation failed');
      owned.push(effect); return effect;
    };
    return { bright: compile(BRIGHT_SKSL), blur: compile(BLUR_SKSL), composite: compile(SPATIAL_SKSL), owned };
  } catch (error) {
    try { releaseNativeResources(owned); } catch { /* Preserve compile failure. */ }
    throw error;
  }
}

// Intermediates live only through this frame/export. All allocations occur on the
// consuming GPU context; the cache owns compiled effects, never surfaces/images.
function renderSmall(shader: SkShader, width: number, height: number, owned: NativeResource[]): SkShader {
  'worklet';
  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('Bloom surface allocation failed');
  owned.push(surface);
  const paint = Skia.Paint(); owned.push(paint); paint.setShader(shader);
  surface.getCanvas().drawRect({ x: 0, y: 0, width, height }, paint);
  surface.flush();
  const image = surface.makeImageSnapshot(); owned.push(image);
  const child = image.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Nearest, MipmapMode.None);
  owned.push(child);
  return child;
}

/** Borrow source and full-strength LUT. Caller releases owned in reverse AFTER draw/snapshot. */
export function bindSpatialSource(resources: SpatialResources, source: SkShader, looked: SkShader,
  settings: CameraSettings, geometry: SpatialGeometry, seed: number, owned: NativeResource[]): SkShader {
  'worklet';
  assertGrainSeed(seed);
  for (const value of [settings.intensity, settings.grain, settings.bloom]) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid spatial strength');
  }
  const small = bloomGeometry(geometry.width, geometry.height);
  let blurred = looked; // Unused child when bloom=0; no intermediate allocation.
  if (settings.bloom > 0 && settings.intensity > 0) {
    const bright = resources.bright.makeShaderWithChildren([
      ...geometry.inverse, geometry.width, geometry.height, small.scaleX, small.scaleY,
    ], [looked]); owned.push(bright);
    const brightImage = renderSmall(bright, small.width, small.height, owned);
    const horizontal = resources.blur.makeShaderWithChildren([1, 0, small.sigmaX], [brightImage]); owned.push(horizontal);
    const horizontalImage = renderSmall(horizontal, small.width, small.height, owned);
    const vertical = resources.blur.makeShaderWithChildren([0, 1, small.sigmaY], [horizontalImage]); owned.push(vertical);
    blurred = renderSmall(vertical, small.width, small.height, owned);
  }
  const final = resources.composite.makeShaderWithChildren([
    ...geometry.forward, geometry.width, geometry.height, small.scaleX, small.scaleY,
    settings.intensity, settings.grain, settings.bloom, seed,
  ], [source, looked, blurred]);
  owned.push(final); return final;
}
