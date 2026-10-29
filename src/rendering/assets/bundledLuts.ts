import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/filter-manifest.json';
import type { LutManifestExpectation } from './lutManifest';

export const bundledLutManifest: unknown = manifest;
export const bundledLutExpectation: LutManifestExpectation = {
  sourceSeedSha256: '2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0',
  lookVersions: new Map([
    ['identity', '0.1.0-draft'],
    ['light-afternoon', '0.1.0-draft'],
    ['time-summer', '0.1.0-draft'],
    ['scene-dawn', '0.1.0-draft'],
    ['retro-film', '0.3.0-draft'],
    ['retro-digital', '0.2.0-draft'],
    ['retro-rose', '0.1.0-draft'],
    ['retro-travel', '0.1.0-draft'],
  ]),
};

// Literal Metro modules; each .lut is an exact byte copy of its canonical PNG.
// Paths/checksums stay pinned to the immutable manifest. Never load arbitrary URLs.
export const bundledLutModules: Readonly<Record<string, number>> = Object.freeze({
  'luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.lut'),
  'luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.lut'),
  'luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.lut'),
  'luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.lut'),
  'luts/retro-film-64c55626a96ef6e346f1f2d6417fe4180f34d1618c4c46c83a6b9492cb2f35fe.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/retro-film-64c55626a96ef6e346f1f2d6417fe4180f34d1618c4c46c83a6b9492cb2f35fe.lut'),
  'luts/retro-digital-22afcb0e11be9079dcac937825a26d0d8ad259ee1627a34680498edb1a327df4.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/retro-digital-22afcb0e11be9079dcac937825a26d0d8ad259ee1627a34680498edb1a327df4.lut'),
  'luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.lut'),
  'luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/2c314f81399ef9933eff6b8a3c335957ac4a87a5638cf9b4fc48518508aa76b0/luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.lut'),
});
