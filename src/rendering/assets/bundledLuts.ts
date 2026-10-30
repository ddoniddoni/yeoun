import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/filter-manifest.json';
import type { LutManifestExpectation } from './lutManifest';

export const bundledLutManifest: unknown = manifest;
export const bundledLutExpectation: LutManifestExpectation = {
  sourceSeedSha256: 'c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6',
  lookVersions: new Map([
    ['identity', '0.1.0-draft'],
    ['light-afternoon', '0.2.0-draft'],
    ['light-milk', '0.3.0-draft'],
    ['light-spring', '0.3.0-draft'],
    ['time-summer', '0.3.0-draft'],
    ['time-diary', '0.2.0-draft'],
    ['time-night', '0.2.0-draft'],
    ['scene-dawn', '0.1.0-draft'],
    ['scene-rain', '0.2.0-draft'],
    ['scene-ending', '0.2.0-draft'],
    ['retro-film', '0.6.0-draft'],
    ['retro-digital', '0.3.0-draft'],
    ['retro-rose', '0.3.0-draft'],
    ['retro-travel', '0.3.0-draft'],
    ['portrait-clear', '0.2.0-draft'],
    ['portrait-peach', '0.2.0-draft'],
    ['food-table', '0.2.0-draft'],
    ['food-cafe', '0.2.0-draft'],
  ]),
};

// Literal Metro modules; each .lut is an exact byte copy of its canonical PNG.
// Paths/checksums stay pinned to the immutable manifest. Never load arbitrary URLs.
export const bundledLutModules: Readonly<Record<string, number>> = Object.freeze({
  'luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.lut'),
  'luts/light-afternoon-12ff730ffdb6a9c056bab574e534fa37d05ec6b10abc39bb70ec905a95511888.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/light-afternoon-12ff730ffdb6a9c056bab574e534fa37d05ec6b10abc39bb70ec905a95511888.lut'),
  'luts/light-milk-be1f13c137448100412619c87e701a7e6051724c8585fb42f78a1829a7859426.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/light-milk-be1f13c137448100412619c87e701a7e6051724c8585fb42f78a1829a7859426.lut'),
  'luts/light-spring-be946ab4254d2ecce82154e3c1f2a3910420846363b786ccd11e91b3dd71cfe9.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/light-spring-be946ab4254d2ecce82154e3c1f2a3910420846363b786ccd11e91b3dd71cfe9.lut'),
  'luts/time-summer-969d6c263c71c63430d6df700168e24d6d2a4b57a40e065d13547131b080dfe0.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/time-summer-969d6c263c71c63430d6df700168e24d6d2a4b57a40e065d13547131b080dfe0.lut'),
  'luts/time-diary-c6ff4b50a68bb7a41d7314954715fd3e47fdc41af05da56c346ae6fbd3c7eceb.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/time-diary-c6ff4b50a68bb7a41d7314954715fd3e47fdc41af05da56c346ae6fbd3c7eceb.lut'),
  'luts/time-night-55380bf9790a5b4b31180e6f85f1982f6405f6ff080873cf596a0c5c5fce865b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/time-night-55380bf9790a5b4b31180e6f85f1982f6405f6ff080873cf596a0c5c5fce865b.lut'),
  'luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.lut'),
  'luts/scene-rain-65402c2274863d5fbe1f87f21b98428e6451b26282d2fe2112202ca902c026a2.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/scene-rain-65402c2274863d5fbe1f87f21b98428e6451b26282d2fe2112202ca902c026a2.lut'),
  'luts/scene-ending-e03df795d91b08999ef3ff75e0e3237797467b84a229c47433d890939d89a2a8.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/scene-ending-e03df795d91b08999ef3ff75e0e3237797467b84a229c47433d890939d89a2a8.lut'),
  'luts/retro-film-443d25a734554282bc4300de67edd93e9665fdc7b1a107f30ad10f6cbb33d623.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/retro-film-443d25a734554282bc4300de67edd93e9665fdc7b1a107f30ad10f6cbb33d623.lut'),
  'luts/retro-digital-f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/retro-digital-f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74.lut'),
  'luts/retro-rose-9913c0c1f41b373369543464b69ec88e8fef3bcb67d016d7c48faac99a9c6ddf.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/retro-rose-9913c0c1f41b373369543464b69ec88e8fef3bcb67d016d7c48faac99a9c6ddf.lut'),
  'luts/retro-travel-9bcbb852797f9f58a6ab0ab3d875da946f42ea96f7f4f8223a804068a67784f9.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/retro-travel-9bcbb852797f9f58a6ab0ab3d875da946f42ea96f7f4f8223a804068a67784f9.lut'),
  'luts/portrait-clear-6e7d657fc3f4ef241616e715941e8c2d016c27adf33ab85d9671c05885d9a47b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/portrait-clear-6e7d657fc3f4ef241616e715941e8c2d016c27adf33ab85d9671c05885d9a47b.lut'),
  'luts/portrait-peach-5a060248b59e369e4ebbcc79ee7566c9b4cf6920f598573ba1de8fe08d451798.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/portrait-peach-5a060248b59e369e4ebbcc79ee7566c9b4cf6920f598573ba1de8fe08d451798.lut'),
  'luts/food-table-0f266056128e288dcc5e7954995315692e3faac816ee0a345dc317c141a3d59e.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/food-table-0f266056128e288dcc5e7954995315692e3faac816ee0a345dc317c141a3d59e.lut'),
  'luts/food-cafe-2af30d4d9653e704d1b86de370d71adb382ee8364004524e43a71a72dd1f9a34.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/luts/food-cafe-2af30d4d9653e704d1b86de370d71adb382ee8364004524e43a71a72dd1f9a34.lut'),
});
