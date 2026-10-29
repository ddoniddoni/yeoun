import manifest from '../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/filter-manifest.json';
import type { LutManifestExpectation } from './lutManifest';

export const bundledLutManifest: unknown = manifest;
export const bundledLutExpectation: LutManifestExpectation = {
  sourceSeedSha256: 'a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6',
  lookVersions: new Map(["identity", "light-afternoon", "time-summer", "scene-dawn", "retro-film", "retro-digital", "retro-rose", "retro-travel"].map(id => [id, '0.1.0-draft'])),
};

// Literal Metro modules; each .lut is an exact byte copy of its canonical PNG.
// Paths/checksums stay pinned to the immutable manifest. Never load arbitrary URLs.
export const bundledLutModules: Readonly<Record<string, number>> = Object.freeze({
  'luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.lut'),
  'luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/light-afternoon-14836d7e195ea12374272fe2bf4946137f3fb1a59fcb5e577c67c42742bface0.lut'),
  'luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/time-summer-d7f56bb99f487543d8d93066426cecd46041461b685bc0bdae26013e0c421477.lut'),
  'luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/scene-dawn-a5a38e22587bfcd5e2b45f4bf0ab04a492ad47cdf4c85e95a2db99fed7936490.lut'),
  'luts/retro-film-17db6122498fbb3b3b8f2433f36a0b08d397c4e3dc6306f5d88ca2ec263eb4ab.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/retro-film-17db6122498fbb3b3b8f2433f36a0b08d397c4e3dc6306f5d88ca2ec263eb4ab.lut'),
  'luts/retro-digital-b3e462a4ab6438f0155437e12bbc75c2429031861eedc7e325ca2a5b5b78561b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/retro-digital-b3e462a4ab6438f0155437e12bbc75c2429031861eedc7e325ca2a5b5b78561b.lut'),
  'luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/retro-rose-dc976438cf30ca02e194fe1f004fced01c2735c76dfe72f8c6f9feda6292370b.lut'),
  'luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.png': require('../../../assets/lut-drafts/lut-authoring-0.1.0/a8f45d69531b3554902333ecf99621a7cab1809e2c36767eb9dbd2f4b3da96f6/luts/retro-travel-b00637adadf4f7fc884a921a4f12418251542d0f27a48fdf4dd1e824589bee46.lut'),
});
