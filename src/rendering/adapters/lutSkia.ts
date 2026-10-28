import type { SkShader } from '@shopify/react-native-skia';
import type { LutAtlas } from '../reference/lutAtlas';
import { createLutAlphaPlanes } from '../reference/lutPlanes';
import { bindLutSource, createLutResources, releaseNativeResources } from './lutResources';

type Resource = { dispose(): void };
export type LutShaderBinding = Readonly<{ shader: SkShader; dispose(): void }>;
export type SkiaLutPipeline = Readonly<{
  /** Borrow a source shader from the same runtime/context. Caller owns its lifetime. */
  bindSource(source: SkShader, intensity?: number): LutShaderBinding;
  /** Call after pending draws finish; releases outstanding bindings and all owned LUT resources. */
  dispose(): void;
}>;

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
    try { releaseNativeResources([...owned.splice(0), ...bindings]); }
    finally { bindings.clear(); }
  };
  try {
    const resources = createLutResources(planes);
    owned.push(...resources.owned);
    return {
      bindSource(source, intensity = 1) {
        if (disposed) throw new Error('LUT pipeline is disposed');
        const shader = bindLutSource(resources, source, intensity);
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
