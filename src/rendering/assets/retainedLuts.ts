import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/filter-manifest.json';
import { isRetainedLook, RETAINED_LOOK_VERSIONS } from '../../domain/filters/retainedLooks';
import type { LutManifestExpectation } from './lutManifest';

// Only the three revised looks and their original identity are bundled for compatibility.
export const retainedLutManifest: unknown = { ...manifest,
  assets: manifest.assets.filter(asset => asset.filterId === 'identity' || isRetainedLook(asset.filterId, asset.lookVersion)),
};
export const retainedLutExpectation: LutManifestExpectation = {
  sourceSeedSha256: 'c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6',
  lookVersions: new Map([['identity', '0.1.0-draft'], ...Object.entries(RETAINED_LOOK_VERSIONS)]),
};
export const retainedLutModules: Readonly<Record<string, number>> = Object.freeze({
  'luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.lut'),
  'luts/retro-travel-9bcbb852797f9f58a6ab0ab3d875da946f42ea96f7f4f8223a804068a67784f9.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/retro-travel-9bcbb852797f9f58a6ab0ab3d875da946f42ea96f7f4f8223a804068a67784f9.lut'),
  'luts/portrait-clear-6e7d657fc3f4ef241616e715941e8c2d016c27adf33ab85d9671c05885d9a47b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/portrait-clear-6e7d657fc3f4ef241616e715941e8c2d016c27adf33ab85d9671c05885d9a47b.lut'),
  'luts/food-cafe-2af30d4d9653e704d1b86de370d71adb382ee8364004524e43a71a72dd1f9a34.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/food-cafe-2af30d4d9653e704d1b86de370d71adb382ee8364004524e43a71a72dd1f9a34.lut'),
});
