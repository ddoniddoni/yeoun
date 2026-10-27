import { assertLutAtlasStructure, createLutAtlas, type LutAtlas } from '../../src/rendering/reference/lutAtlas';

const identity = createLutAtlas(input => input);

function pixel(atlas: LutAtlas, x: number, y: number): number[] {
  const offset = (y * atlas.width + x) * 4;
  return Array.from(atlas.pixels.slice(offset, offset + 4));
}

test.each([
  { x: 1, y: 1, rgba: [0, 0, 0, 255] },
  { x: 33, y: 1, rgba: [255, 0, 0, 255] },
  { x: 1, y: 33, rgba: [0, 255, 0, 255] },
  { x: 36, y: 1, rgba: [0, 0, 8, 255] },
  { x: 176, y: 1, rgba: [0, 0, 40, 255] },
  { x: 1, y: 36, rgba: [0, 0, 48, 255] },
  { x: 36, y: 176, rgba: [0, 0, 247, 255] },
  { x: 71, y: 176, rgba: [0, 0, 255, 255] },
  { x: 157, y: 87, rgba: [128, 128, 128, 255] },
  { x: 103, y: 208, rgba: [255, 255, 255, 255] },
])('identity axes, row wrap and quantization at $x,$y', ({ x, y, rgba }) => {
  expect(pixel(identity, x, y)).toEqual(rgba);
});

test('edge padding keeps adjacent slices separate, including all four corners', () => {
  expect(pixel(identity, 0, 0)).toEqual([0, 0, 0, 255]);
  expect(pixel(identity, 34, 0)).toEqual([255, 0, 0, 255]);
  expect(pixel(identity, 0, 34)).toEqual([0, 255, 0, 255]);
  expect(pixel(identity, 34, 34)).toEqual([255, 255, 0, 255]);
  expect(pixel(identity, 34, 17)).toEqual([255, 128, 0, 255]);
  expect(pixel(identity, 35, 17)).toEqual([0, 128, 8, 255]);
  expect(pixel(identity, 70, 175)).toEqual([0, 0, 255, 255]);
  expect(pixel(identity, 104, 209)).toEqual([255, 255, 255, 255]);
});

test('unused tiles have black RGB while the entire atlas stays opaque', () => {
  for (let offset = 3; offset < identity.pixels.length; offset += 4) {
    if (identity.pixels[offset] !== 255) throw new Error(`Non-opaque pixel at ${offset}`);
  }
  for (let y = 175; y < 210; y++) {
    for (let x = 105; x < 210; x++) {
      const offset = (y * 210 + x) * 4;
      if (identity.pixels[offset] || identity.pixels[offset + 1] || identity.pixels[offset + 2]) {
        throw new Error(`Non-black unused pixel at ${x},${y}`);
      }
    }
  }
  expect(() => assertLutAtlasStructure(identity)).not.toThrow();
});

test('samples only 33 cubed grid points and rounds normalized channels once', () => {
  const transform = jest.fn(() => [0.5, 0.1, 0.9] as const);
  const atlas = createLutAtlas(transform);
  expect(transform).toHaveBeenCalledTimes(35_937);
  expect(pixel(atlas, 17, 17)).toEqual([128, 26, 230, 255]);
  expect(pixel(atlas, 0, 0)).toEqual([128, 26, 230, 255]);
});

test.each([NaN, Infinity, -Infinity, -0.001, 1.001])('rejects invalid transform output %s', value => {
  expect(() => createLutAtlas(() => [value, 0, 0])).toThrow(RangeError);
});

test.each([
  { offset: 3, value: 0, error: /alpha/ },
  { offset: 0, value: 1, error: /padding/ },
  { offset: (175 * 210 + 105) * 4, value: 1, error: /Unused/ },
])('rejects structural damage at byte $offset', ({ offset, value, error }) => {
  const atlas = { ...identity, pixels: identity.pixels.slice() };
  atlas.pixels[offset] = value;
  expect(() => assertLutAtlasStructure(atlas)).toThrow(error);
});

test('rejects a wrong size or incomplete pixel buffer', () => {
  expect(() => assertLutAtlasStructure({ ...identity, width: 209 })).toThrow(/210x210/);
  expect(() => assertLutAtlasStructure({ ...identity, pixels: identity.pixels.slice(4) })).toThrow(/210x210/);
});
