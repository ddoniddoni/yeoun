import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/filter-manifest.json';
import type { LutManifestExpectation } from './lutManifest';

export const bundledLutManifest: unknown = manifest;
export const bundledLutExpectation: LutManifestExpectation = {
  sourceSeedSha256: '12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d',
  lookVersions: new Map([
    ['identity', '0.1.0-draft'],
    ['light-afternoon', '0.1.0-draft'],
    ['time-summer', '0.1.0-draft'],
    ['scene-dawn', '0.1.0-draft'],
    ['retro-film', '0.4.0-draft'],
    ['retro-digital', '0.3.0-draft'],
    ['retro-rose', '0.1.0-draft'],
    ['retro-travel', '0.1.0-draft'],
  ]),
};

// Literal Metro modules; each .lut is an exact byte copy of its canonical PNG.
// Paths/checksums stay pinned to the immutable manifest. Never load arbitrary URLs.
export const bundledLutModules: Readonly<Record<string, number>> = Object.freeze({
  'luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.lut'),
  'luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.lut'),
  'luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.lut'),
  'luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.lut'),
  'luts/retro-film-5194359ad78665b3213ca721a5fc4d62aa5cb3ce0b84d900970e324221cfee9b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/retro-film-5194359ad78665b3213ca721a5fc4d62aa5cb3ce0b84d900970e324221cfee9b.lut'),
  'luts/retro-digital-f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/retro-digital-f4f34d739a5f44b42347d3133e6a2ceb806912cc4e0379a34d0f09f4d648bc74.lut'),
  'luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.lut'),
  'luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/12659a3220a3de0677a130ade4e098feda55ddbe7824ffcf37d69061f174ac2d/luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.lut'),
});
