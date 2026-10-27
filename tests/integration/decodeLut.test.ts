import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AlphaType, ColorType } from '@shopify/react-native-skia';
import { decodeLutWithSkia } from '../../src/rendering/adapters/decodeLut';
import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';

jest.mock('@shopify/react-native-skia', () => ({
  Skia: { Data: { fromBytes: jest.fn() }, Image: { MakeImageFromEncoded: jest.fn() } },
  AlphaType: { Unpremul: 3 }, ColorType: { RGBA_8888: 4 },
}));
const mockSkia = jest.requireMock<{ Skia: {
  Data: { fromBytes: jest.Mock }; Image: { MakeImageFromEncoded: jest.Mock };
} }>('@shopify/react-native-skia').Skia;
const png = readFileSync(join(__dirname, '../../assets/lut-drafts/lut-authoring-0.1.0/105988cbda3910f7ec200311ee3d96da5ae19a0eb7623574b16614451a578be0/luts/identity-5f6daa0568b6ae9153b1d8af6b88c716904e0eed03b7d10b71ec78c09ae32a7a.png'));

function setup() {
  const pixels = createLutAtlas(rgb => rgb).pixels;
  const data = { dispose: jest.fn() };
  const image = { width: jest.fn(() => 210), height: jest.fn(() => 210), dispose: jest.fn(),
    readPixels: jest.fn<Uint8Array | null, unknown[]>(() => pixels) };
  mockSkia.Data.fromBytes.mockReturnValue(data);
  mockSkia.Image.MakeImageFromEncoded.mockReturnValue(image);
  return { pixels, data, image };
}
afterEach(() => jest.resetAllMocks());

test('reads RGBA8 without forcing alpha and returns owned pixels after disposing native data', () => {
  const r = setup();
  const atlas = decodeLutWithSkia(png);
  expect(r.image.readPixels).toHaveBeenCalledWith(0, 0, {
    width: 210, height: 210, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888,
  });
  const upload = mockSkia.Data.fromBytes.mock.calls[0]![0] as Uint8Array;
  expect(upload.byteOffset).toBe(0);
  expect(upload.buffer.byteLength).toBe(png.length);
  expect(upload.buffer).not.toBe(png.buffer);
  expect(atlas.pixels).toEqual(r.pixels);
  r.pixels.fill(0);
  expect(atlas.pixels[3]).toBe(255);
  expect(r.image.dispose).toHaveBeenCalledTimes(1);
  expect(r.data.dispose).toHaveBeenCalledTimes(1);
});

test('malformed PNG allocates nothing; a null decoder result releases its data', () => {
  const r = setup();
  expect(() => decodeLutWithSkia(new Uint8Array(10))).toThrow(/PNG/);
  expect(mockSkia.Data.fromBytes).not.toHaveBeenCalled();
  mockSkia.Image.MakeImageFromEncoded.mockReturnValue(null);
  expect(() => decodeLutWithSkia(png)).toThrow(/decode failed/);
  expect(r.data.dispose).toHaveBeenCalledTimes(1);
  expect(r.image.dispose).not.toHaveBeenCalled();
});

test('dimension/readback/alpha failures release both native objects', () => {
  const r = setup();
  r.image.width.mockReturnValueOnce(209);
  expect(() => decodeLutWithSkia(png)).toThrow(/dimensions/);
  r.image.readPixels.mockReturnValueOnce(null);
  expect(() => decodeLutWithSkia(png)).toThrow(/readback/);
  r.pixels[3] = 254;
  expect(() => decodeLutWithSkia(png)).toThrow(/alpha/);
  expect(r.data.dispose).toHaveBeenCalledTimes(3);
  expect(r.image.dispose).toHaveBeenCalledTimes(3);
});

test('attempts every release and preserves the decode error when cleanup fails too', () => {
  const r = setup();
  r.image.readPixels.mockReturnValue(null);
  r.image.dispose.mockImplementation(() => { throw new Error('cleanup'); });
  expect(() => decodeLutWithSkia(png)).toThrow(/readback/);
  expect(r.data.dispose).toHaveBeenCalledTimes(1);
});
