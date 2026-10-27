import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0/filter-manifest.json';
import type { LutManifestExpectation } from './lutManifest';

export const bundledLutManifest: unknown = manifest;
export const bundledLutExpectation: LutManifestExpectation = {
  sourceSeedSha256: '105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0',
  lookVersions: new Map(['identity', 'light-afternoon', 'time-summer', 'scene-dawn'].map(id => [id, '0.1.0-draft'])),
};

// Literal requires keep Metro's asset graph static. .lut files are byte copies of canonical PNGs.
// Manifest paths remain logical PNG names; arbitrary URLs/paths cannot become module imports.
export const bundledLutModules: Readonly<Record<string, number>> = Object.freeze({
  'luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.lut'),
  'luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0/luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.lut'),
  'luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0/luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.lut'),
  'luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0/luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.lut'),
});
