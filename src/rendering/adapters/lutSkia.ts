import {
  AlphaType, ColorType, FilterMode, MipmapMode, Skia, TileMode,
  type SkShader,
} from '@shopify/react-native-skia';
import { LUT_CONTRACT, type LutAtlas } from '../reference/lutAtlas';
import { createLutAlphaPlanes } from '../reference/lutPlanes';
import { LUT_SKSL } from '../shaders/lut';

type Resource = { dispose(): void };
export type LutShaderBinding = Readonly<{ shader: SkShader; dispose(): void }>;
export type SkiaLutPipeline = Readonly<{
  /** Borrow a source shader from the same runtime/context. Caller owns its lifetime. */
  bindSource(source: SkShader): LutShaderBinding;
  /** Call after pending draws finish; releases outstanding bindings and all owned LUT resources. */
  dispose(): void;
}>;

function disposeAll(resources: Resource[]): void {
  let failure: { error: unknown } | undefined;
  while (resources.length) {
    try { resources.pop()!.dispose(); }
    catch (error) { failure ??= { error }; }
  }
  if (failure) throw failure.error;
}

/**
 * Create/cache LUT resources on the consuming RN JS runtime. No cross-worklet transfer.
 * MakeImage creates raster-backed images; the backend controls any later GPU upload.
 * This adapter is not installed in the camera loop: frame binding cost is not measured.
 * Input atlas is decoded, checksum-checked authoring data; no photo/frame pixels enter JS here.
 */
export function createSkiaLutPipeline(atlas: LutAtlas): SkiaLutPipeline {
  const planes = createLutAlphaPlanes(atlas);
  const owned: Resource[] = [];
  const bindings = new Set<LutShaderBinding>();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    // Bindings depend on plane shaders, then images/data, then the compiled effect.
    try { disposeAll([...owned.splice(0), ...bindings]); }
    finally { bindings.clear(); }
  };
  try {
    const effect = Skia.RuntimeEffect.Make(LUT_SKSL);
    if (!effect) throw new Error('LUT SkSL compilation failed');
    owned.push(effect);
    const children: SkShader[] = [];
    for (const plane of planes) {
      const data = Skia.Data.fromBytes(plane);
      owned.push(data);
      const image = Skia.Image.MakeImage({
        width: LUT_CONTRACT.atlasWidth, height: LUT_CONTRACT.atlasHeight,
        colorType: ColorType.Alpha_8, alphaType: AlphaType.Premul,
      }, data, LUT_CONTRACT.atlasWidth);
      if (!image) throw new Error('LUT Alpha_8 image allocation failed');
      owned.push(image);
      const shader = image.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
      owned.push(shader);
      children.push(shader);
    }
    return {
      bindSource(source) {
        if (disposed) throw new Error('LUT pipeline is disposed');
        const shader = effect.makeShaderWithChildren([], [source, ...children]);
        let released = false;
        const binding: LutShaderBinding = {
          get shader() {
            if (released) throw new Error('LUT shader binding is disposed');
            return shader;
          },
          dispose() {
            if (released) return;
            released = true;
            bindings.delete(binding);
            shader.dispose();
          },
        };
        bindings.add(binding);
        return binding;
      },
      dispose,
    };
  } catch (error) {
    // Preserve the allocation/compile error while attempting every owned resource release.
    try { dispose(); } catch { /* The original failure is the actionable error. */ }
    throw error;
  }
}
