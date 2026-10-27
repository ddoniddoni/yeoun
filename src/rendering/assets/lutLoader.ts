import { assertLutAtlasStructure, type LutAtlas } from '../reference/lutAtlas.ts';
import { parseLutManifest, type LutAsset, type LutManifestExpectation } from './lutManifest.ts';
import { assertLutPngContainer, MAX_LUT_PNG_BYTES } from './lutPng.ts';

export type LutSelection = Readonly<{ filterId: string; lookVersion: string; engineVersion: string }>;
export type LoadedLut = Readonly<{
  asset: LutAsset; engineVersion: string; sourceSeedSha256: string; atlas: LutAtlas;
}>;
export type LutAssetPorts = Readonly<{
  read(asset: LutAsset): Promise<Uint8Array>;
  sha256(bytes: Uint8Array): Promise<string>;
  decode(bytes: Uint8Array): LutAtlas;
}>;
export type LutAssetLoader = Readonly<{
  load(selection: LutSelection): Promise<LoadedLut>;
  /** Drops owned CPU caches; pending callers still finish. Does not own native pipelines. */
  clearCache(): void;
}>;

/** Cache by the immutable manifest's ID/version/hash; no camera pixels or native objects in this cache. */
export function createLutAssetLoader(input: unknown, expected: LutManifestExpectation, ports: LutAssetPorts): LutAssetLoader {
  const manifest = parseLutManifest(input, expected);
  const assets = new Map(manifest.assets.map(asset => [asset.filterId, asset]));
  const cache = new Map<string, Promise<LutAtlas>>();
  async function readAtlas(asset: LutAsset): Promise<LutAtlas> {
    const read = await ports.read(asset);
    if (read.length < 33 || read.length > MAX_LUT_PNG_BYTES) throw new Error('Invalid LUT file size');
    // Own the exact bytes across the asynchronous digest and synchronous decoder.
    const bytes = Uint8Array.from(read);
    if (await ports.sha256(bytes) !== asset.sha256) throw new Error(`LUT checksum mismatch: ${asset.filterId}`);
    assertLutPngContainer(bytes);
    const decoded = ports.decode(bytes);
    assertLutAtlasStructure(decoded);
    return { width: decoded.width, height: decoded.height, pixels: Uint8Array.from(decoded.pixels) };
  }
  return {
    async load(selection) {
      const asset = assets.get(selection.filterId);
      if (!asset || selection.lookVersion !== asset.lookVersion || selection.engineVersion !== manifest.engineVersion) {
        throw new Error(`Unknown or mismatched LUT selection: ${selection.filterId}`);
      }
      let pending = cache.get(asset.filterId);
      if (!pending) {
        const work: Promise<LutAtlas> = readAtlas(asset).catch(error => {
          // An old failed request must not evict a newer request made after clearCache().
          if (cache.get(asset.filterId) === work) cache.delete(asset.filterId);
          throw error;
        });
        pending = work;
        cache.set(asset.filterId, work);
      }
      const atlas = await pending;
      // Callers can mutate their copy without corrupting later loads or another pipeline.
      return Object.freeze({ asset, engineVersion: manifest.engineVersion, sourceSeedSha256: manifest.sourceSeedSha256,
        atlas: Object.freeze({ width: atlas.width, height: atlas.height, pixels: Uint8Array.from(atlas.pixels) }) });
    },
    clearCache() { cache.clear(); },
  };
}
