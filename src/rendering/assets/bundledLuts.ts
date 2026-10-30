import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/filter-manifest.json';
import type { LutManifestExpectation } from './lutManifest';

export const bundledLutManifest: unknown = manifest;
export const bundledLutExpectation: LutManifestExpectation = {
  sourceSeedSha256: '0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3',
  lookVersions: new Map([
    ['identity', '0.1.0-draft'],
    ['light-afternoon', '0.1.0-draft'],
    ['light-milk', '0.2.0-draft'],
    ['light-spring', '0.2.0-draft'],
    ['time-summer', '0.1.0-draft'],
    ['time-diary', '0.2.0-draft'],
    ['time-night', '0.2.0-draft'],
    ['scene-dawn', '0.1.0-draft'],
    ['scene-rain', '0.2.0-draft'],
    ['scene-ending', '0.2.0-draft'],
    ['retro-film', '0.6.0-draft'],
    ['retro-digital', '0.3.0-draft'],
    ['retro-rose', '0.1.0-draft'],
    ['retro-travel', '0.1.0-draft'],
    ['portrait-clear', '0.1.0-draft'],
    ['portrait-peach', '0.1.0-draft'],
    ['food-table', '0.1.0-draft'],
    ['food-cafe', '0.1.0-draft'],
  ]),
};

// Literal Metro modules; each .lut is an exact byte copy of its canonical PNG.
// Paths/checksums stay pinned to the immutable manifest. Never load arbitrary URLs.
export const bundledLutModules: Readonly<Record<string, number>> = Object.freeze({
  'luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.lut'),
  'luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.lut'),
  'luts/light-milk-3357005f34e4ef3a5f254f1bf7d5f1717fc410dbb78c47a668dfab47c911159a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/light-milk-3357005f34e4ef3a5f254f1bf7d5f1717fc410dbb78c47a668dfab47c911159a.lut'),
  'luts/light-spring-3c52fb0f119faf3d1520b00ec7b2299de464244f366de535e1e31d28b9bd3e86.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/light-spring-3c52fb0f119faf3d1520b00ec7b2299de464244f366de535e1e31d28b9bd3e86.lut'),
  'luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.lut'),
  'luts/time-diary-c6ff4b50a68bb7a41d7314954715fd3e47fdc41af05da56c346ae6fbd3c7eceb.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/time-diary-c6ff4b50a68bb7a41d7314954715fd3e47fdc41af05da56c346ae6fbd3c7eceb.lut'),
  'luts/time-night-55380bf9790a5b4b31180e6f85f1982f6405f6ff080873cf596a0c5c5fce865b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/time-night-55380bf9790a5b4b31180e6f85f1982f6405f6ff080873cf596a0c5c5fce865b.lut'),
  'luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.lut'),
  'luts/scene-rain-65402c2274863d5fbe1f87f21b98428e6451b26282d2fe2112202ca902c026a2.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/scene-rain-65402c2274863d5fbe1f87f21b98428e6451b26282d2fe2112202ca902c026a2.lut'),
  'luts/scene-ending-e03df795d91b08999ef3ff75e0e3237797467b84a229c47433d890939d89a2a8.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/scene-ending-e03df795d91b08999ef3ff75e0e3237797467b84a229c47433d890939d89a2a8.lut'),
  'luts/retro-film-443d25a734554282bc4300de67edd93e9665fdc7b1a107f30ad10f6cbb33d623.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/retro-film-443d25a734554282bc4300de67edd93e9665fdc7b1a107f30ad10f6cbb33d623.lut'),
  'luts/retro-digital-f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/retro-digital-f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74.lut'),
  'luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.lut'),
  'luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.lut'),
  'luts/portrait-clear-c93bf2ecf29bc497e002d37c17901a68bc392d3dc81ccca9455036898b00f3b8.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/portrait-clear-c93bf2ecf29bc497e002d37c17901a68bc392d3dc81ccca9455036898b00f3b8.lut'),
  'luts/portrait-peach-28d0c40c4be860255da5b9cbfc40cca652fce436e03f8c4b96e56598b4386a0d.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/portrait-peach-28d0c40c4be860255da5b9cbfc40cca652fce436e03f8c4b96e56598b4386a0d.lut'),
  'luts/food-table-cd55c6d898bb2940ec8e88b1bfbe9fd8eeea0bb559a2b98a827dcc49f3125ee7.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/food-table-cd55c6d898bb2940ec8e88b1bfbe9fd8eeea0bb559a2b98a827dcc49f3125ee7.lut'),
  'luts/food-cafe-5d7cad53d61e714ee15a81c2fe75a294c07c7cd55c951071c71135f2a7e953eb.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/0fb99cc4fd30cac0668d59a5c693a32c27459fefc255612556f81929d262f6e3/luts/food-cafe-5d7cad53d61e714ee15a81c2fe75a294c07c7cd55c951071c71135f2a7e953eb.lut'),
});
