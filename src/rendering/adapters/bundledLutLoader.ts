import { readBundledLutBytes, digestLutBytes } from '../../platform/files/lutAssets';
import { bundledLutManifest, bundledLutExpectation, bundledLutModules } from '../assets/bundledLuts';
import { createLutAssetLoader, type LutAssetLoader, type LutSelection, type LoadedLut } from '../assets/lutLoader';
import { parseLutManifest } from '../assets/lutManifest';
import { decodeLutWithSkia } from './decodeLut';
import { createSkiaLutPipeline, type SkiaLutPipeline } from './lutSkia';

export type LoadedLutPipeline = Omit<LoadedLut, 'atlas'> & Readonly<{ pipeline: SkiaLutPipeline }>;

/** RN JS runtime only. Instantiation does not read files, compile shaders or draw. */
export function createBundledDraftLutLoader(): LutAssetLoader {
  const manifest = parseLutManifest(bundledLutManifest, bundledLutExpectation);
  if (Object.keys(bundledLutModules).length !== manifest.assets.length ||
      manifest.assets.some(asset => !Object.prototype.hasOwnProperty.call(bundledLutModules, asset.path))) {
    throw new Error('LUT manifest and bundled asset registry differ');
  }
  return createLutAssetLoader(manifest, bundledLutExpectation, {
    read(asset) {
      const moduleId = bundledLutModules[asset.path];
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
