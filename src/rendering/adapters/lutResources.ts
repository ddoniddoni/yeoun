import {
  AlphaType, ColorType, FilterMode, MipmapMode, Skia, TileMode,
  type SkRuntimeEffect, type SkShader,
} from '@shopify/react-native-skia';
import { LUT_CONTRACT } from '../reference/lutAtlas';
import { LUT_SKSL } from '../shaders/lut';

export type NativeResource = { dispose(): void };
export type LutPlanes = readonly [Uint8Array, Uint8Array, Uint8Array];
// Plain records and native host objects only: no RN closures in camera caches.
export type LutResources = { effect: SkRuntimeEffect; children: SkShader[]; owned: NativeResource[] };

export function releaseNativeResources(resources: NativeResource[]): void {
  'worklet';
  let failure: { error: unknown } | undefined;
  while (resources.length) {
    try { resources.pop()!.dispose(); } catch (error) { failure ??= { error }; }
  }
  if (failure) throw failure.error;
}

/** Construct on the consuming runtime. Only LUT data, never frame pixels, enters JS. */
export function createLutResources(planes: LutPlanes): LutResources {
  'worklet';
  const owned: NativeResource[] = [];
  try {
    const effect = Skia.RuntimeEffect.Make(LUT_SKSL);
    if (!effect) throw new Error('LUT SkSL compilation failed');
    owned.push(effect);
    const children: SkShader[] = [];
    for (const plane of planes) {
      const data = Skia.Data.fromBytes(plane);
      owned.push(data);
      const image = Skia.Image.MakeImage({ width: LUT_CONTRACT.atlasWidth, height: LUT_CONTRACT.atlasHeight,
        colorType: ColorType.Alpha_8, alphaType: AlphaType.Premul }, data, LUT_CONTRACT.atlasWidth);
      if (!image) throw new Error('LUT Alpha_8 image allocation failed');
      owned.push(image);
      const shader = image.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
      owned.push(shader); children.push(shader);
    }
    return { effect, children, owned };
  } catch (error) {
    try { releaseNativeResources(owned); } catch { /* Preserve construction failure. */ }
    throw error;
  }
}

export function bindLutSource(resources: LutResources, source: SkShader, intensity: number): SkShader {
  'worklet';
  if (!Number.isFinite(intensity) || intensity < 0 || intensity > 1) throw new Error('Invalid LUT intensity');
  return resources.effect.makeShaderWithChildren([intensity], [source, ...resources.children]);
}
