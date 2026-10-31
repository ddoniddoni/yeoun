import { neutralizeOrientation, orientationTransform, centerCrop43, photoFrame, type ExifOrientation } from '../../src/rendering/adapters/jpegOrientation';
function jpeg(orientation: number, little: boolean) {
  const bytes = new Uint8Array(40); const v = new DataView(bytes.buffer);
  bytes.set([0xff, 0xd8, 0xff, 0xe1, 0, 34, 0x45, 0x78, 0x69, 0x66, 0, 0]);
  bytes.set(little ? [0x49, 0x49] : [0x4d, 0x4d], 12);
  v.setUint16(14, 42, little); v.setUint32(16, 8, little); v.setUint16(20, 1, little);
  v.setUint16(22, 0x112, little); v.setUint16(24, 3, little); v.setUint32(26, 1, little);
  v.setUint16(30, orientation, little); bytes.set([0xff, 0xd9], 38); return bytes;
}
test.each([[4000, 2000], [1200, 1200], [900, 2400]])('library photo keeps all %i×%i pixels without the camera crop', (width, height) => {
  expect(photoFrame(width, height, 'full')).toEqual({ x: 0, y: 0, width, height });
  expect(photoFrame(width, height, 'camera')).toEqual(centerCrop43(width, height));
});
test.each([1, 2, 3, 4, 5, 6, 7, 8] as ExifOrientation[])('EXIF %i handles both endian orders without mutating source', o => {
  for (const little of [false, true]) {
    const input = jpeg(o, little); const original = input.slice();
    const result = neutralizeOrientation(input);
    expect(result.orientation).toBe(o); expect(input).toEqual(original);
    expect(neutralizeOrientation(result.bytes).orientation).toBe(1);
  }
});
test.each([
  [1, [0, 0]], [2, [4, 0]], [3, [4, 3]], [4, [0, 3]],
  [5, [0, 0]], [6, [3, 0]], [7, [3, 4]], [8, [0, 4]],
] as const)('EXIF %i places top-left correctly', (o, expected) => {
  const [, , , , x, y] = orientationTransform(o, 4, 3); expect([x, y]).toEqual(expected);
});
test('rejects invalid EXIF offset, value and truncated input', () => {
  const bytes = jpeg(6, true); new DataView(bytes.buffer).setUint32(16, 400, true);
  expect(() => neutralizeOrientation(bytes)).toThrow('bounds');
  expect(() => neutralizeOrientation(jpeg(9, true))).toThrow();
  expect(() => neutralizeOrientation(bytes.slice(0, 15))).toThrow();
});
test('crop preserves 12MP, never upscales, matches 4:3 in both orientations', () => {
  expect(centerCrop43(4032, 3024)).toEqual({ x: 0, y: 0, width: 4032, height: 3024 });
  expect(centerCrop43(3000, 4000)).toEqual({ x: 0, y: 0, width: 3000, height: 4000 });
  expect(centerCrop43(4000, 2000)).toEqual({ x: 667, y: 0, width: 2666, height: 2000 });
});
test.each([1, 2, 3, 4, 5, 6, 7, 8] as ExifOrientation[])('EXIF %i maps all corners inside the upright rectangle', o => {
  const [a, b, c, d, tx, ty] = orientationTransform(o, 4, 3);
  const transformed = [[0, 0], [4, 0], [0, 3], [4, 3]].map(([x, y]) => [a! * x! + c! * y! + tx!, b! * x! + d! * y! + ty!]);
  const w = o >= 5 ? 3 : 4; const h = o >= 5 ? 4 : 3;
  expect(transformed.map(point => point.join(',')).sort()).toEqual([[0, 0], [w, 0], [0, h], [w, h]].map(point => point.join(',')).sort());
});
