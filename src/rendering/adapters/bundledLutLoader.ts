import { readBundledLutBytes, digestLutBytes } from '../../platform/files/lutAssets';
import { bundledLutManifest, bundledLutExpectation, bundledLutModules } from '../assets/bundledLuts';
import { retainedLutManifest, retainedLutExpectation, retainedLutModules } from '../assets/retainedLuts';
import { isRetainedLook } from '../../domain/filters/retainedLooks';
import { createLutAssetLoader, type LutAssetLoader, type LutSelection, type LoadedLut } from '../assets/lutLoader';
import { parseLutManifest, type LutManifestExpectation } from '../assets/lutManifest';
import { decodeLutWithSkia } from './decodeLut';
import { createSkiaLutPipeline, type SkiaLutPipeline } from './lutSkia';

export type LoadedLutPipeline = Omit<LoadedLut, 'atlas'> & Readonly<{ pipeline: SkiaLutPipeline }>;

/** RN JS runtime only. Instantiation does not read files, compile shaders or draw. */
export function createBundledDraftLutLoader(): LutAssetLoader {
  const current = createRegisteredLoader(bundledLutManifest, bundledLutExpectation, bundledLutModules);
  const retained = createRegisteredLoader(retainedLutManifest, retainedLutExpectation, retainedLutModules);
  return {
    load: selection => (isRetainedLook(selection.filterId, selection.lookVersion) ? retained : current).load(selection),
    clearCache() { current.clearCache(); retained.clearCache(); },
  };
}

function createRegisteredLoader(input: unknown, expectation: LutManifestExpectation, modules: Readonly<Record<string, number>>): LutAssetLoader {
  const manifest = parseLutManifest(input, expectation);
  if (Object.keys(modules).length !== manifest.assets.length ||
      manifest.assets.some(asset => !Object.prototype.hasOwnProperty.call(modules, asset.path))) {
    throw new Error('LUT manifest and bundled asset registry differ');
  }
  return createLutAssetLoader(manifest, expectation, {
    read(asset) {
      const moduleId = modules[asset.path];
      if (moduleId === undefined) throw new Error(`Unbundled LUT: ${asset.filterId}`);
      return readBundledLutBytes(moduleId);
    },
    sha256: digestLutBytes,
    decode: decodeLutWithSkia,
  });
}

/** Create on the consuming runtime; caller owns pipeline disposal after its last draw/flush. */
export async function loadDraftLutPipeline(loader: LutAssetLoader, selection: LutSelection): Promise<LoadedLutPipeline> {
  const { atlas, ...definition } = await loader.load(selection);
  return Object.freeze({ ...definition, pipeline: createSkiaLutPipeline(atlas) });
}
