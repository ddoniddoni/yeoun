import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';
import { createLutAlphaPlanes } from '../../src/rendering/reference/lutPlanes';

const identity = createLutAtlas(rgb => rgb);

test('packs channels into alpha data without swapping axes or changing stored bytes', () => {
  const planes = createLutAlphaPlanes(identity);
  // Explicit atlas coordinates: r=7,g=13 on either side of the b=5/6 tile-row boundary.
  const samples = [
    { x: 183, y: 14, expected: [56, 104, 40] },
    { x: 8, y: 49, expected: [56, 104, 48] },
    { x: 103, y: 208, expected: [255, 255, 255] },
    { x: 104, y: 209, expected: [255, 255, 255] }, // replicated last-tile corner
    { x: 105, y: 175, expected: [0, 0, 0] }, // unused tile, not the PNG's opaque alpha
    { x: 209, y: 209, expected: [0, 0, 0] },
  ];
  for (const { x, y, expected } of samples) {
    expect(planes.map(plane => plane[y * 210 + x])).toEqual(expected);
  }
});

test('produces exact-size owned buffers from a nonzero-offset input view', () => {
  const storage = new Uint8Array(identity.pixels.length + 16);
  const view = storage.subarray(8, 8 + identity.pixels.length);
  view.set(identity.pixels);
  const planes = createLutAlphaPlanes({ ...identity, pixels: view });
  expect(view).toEqual(identity.pixels);
  for (const [channel, plane] of planes.entries()) {
    expect(plane.byteOffset).toBe(0);
    expect(plane.byteLength).toBe(44100);
    expect(plane.buffer.byteLength).toBe(44100);
    expect(plane.buffer).not.toBe(view.buffer);
    for (let pixel = 0; pixel < plane.length; pixel++) {
      expect(plane[pixel]).toBe(view[pixel * 4 + channel]);
    }
  }
  const snapshots = planes.map(plane => Uint8Array.from(plane));
  storage.fill(0);
  expect(planes).toEqual(snapshots);
  expect(new Set(planes.map(plane => plane.buffer)).size).toBe(3);
});

test('rejects damaged structure before packing', () => {
  expect(() => createLutAlphaPlanes({ ...identity, width: 209 })).toThrow(/210x210/);
  const pixels = Uint8Array.from(identity.pixels);
  pixels[3] = 254;
  expect(() => createLutAlphaPlanes({ ...identity, pixels })).toThrow(/alpha/);
});
