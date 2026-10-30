/** @jest-environment node */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { decodeLutPng, loadLutSeed, validateLutBundle } from '../../scripts/lib/lutAssets';
import { LUT_ENGINE_VERSION } from '../../scripts/lib/lutManifest';
import type { Rgb } from '../../src/domain/filters/types';
import { createAuthoringTransform } from '../../src/rendering/reference/authoring';
import type { LutAtlas } from '../../src/rendering/reference/lutAtlas';
import { createLutSampler } from '../../src/rendering/reference/lutSampling';
import seedData from '../../spec/filters.seed.json';

type Fixture = Readonly<{
  filterId: string;
  atlas: LutAtlas;
  analytic: (input: Rgb) => Rgb;
}>;
let fixtures: Fixture[];

beforeAll(async () => {
  const root = join(__dirname, '../..');
  const { seed, hash } = await loadLutSeed(join(root, 'spec/filters.seed.json'), join(root, 'spec/filters.schema.json'));
  const manifestPath = join(root, 'assets/lut-drafts', LUT_ENGINE_VERSION, hash, 'filter-manifest.json');
  const manifest = await validateLutBundle(manifestPath, seed, hash);
  fixtures = await Promise.all(manifest.assets.map(async asset => {
    const atlas = decodeLutPng(await readFile(join(dirname(manifestPath), asset.path)));
    if (asset.role === 'identity') return { filterId: asset.filterId, atlas, analytic: (input: Rgb) => input };
    const filter = seed.filters.find(item => item.id === asset.filterId);
    if (!filter) throw new Error(`Missing source filter ${asset.filterId}`);
    return { filterId: asset.filterId, atlas, analytic: createAuthoringTransform(filter.authoring) };
  }));
});

test.each(['identity', ...seedData.filters.map(filter => filter.id)])(
  'tracked %s PNG matches the quantized analytic transform at every grid point', filterId => {
    const fixture = fixtures.find(item => item.filterId === filterId);
    if (!fixture) throw new Error(`Missing fixture ${filterId}`);
    const sample = createLutSampler(fixture.atlas);
    let maximumError = 0;
    for (let blue = 0; blue <= 32; blue++) {
      for (let green = 0; green <= 32; green++) {
        for (let red = 0; red <= 32; red++) {
          const input: Rgb = [red / 32, green / 32, blue / 32];
          const analytic = fixture.analytic(input);
          const actual = sample(input);
          for (let channel = 0; channel < 3; channel++) {
            const expected = Math.round(analytic[channel]! * 255) / 255;
            maximumError = Math.max(maximumError, Math.abs(actual[channel]! - expected));
          }
        }
      }
    }
    expect(maximumError).toBe(0);
  },
);

test('PNG Buffer ownership is independent of later decoder-buffer mutation', () => {
  const fixture = fixtures.find(item => item.filterId === 'identity');
  if (!fixture) throw new Error('Missing identity fixture');
  // Buffer is a Uint8Array subtype whose slice method aliases rather than copies.
  const pixels = Buffer.from(fixture.atlas.pixels);
  const sample = createLutSampler({ ...fixture.atlas, pixels });
  const input: Rgb = [0.13, 0.47, 0.83];
  const expected = sample(input);
  pixels.fill(0);
  expect(sample(input)).toEqual(expected);
});
