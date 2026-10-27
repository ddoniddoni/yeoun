import { Skia } from '@shopify/react-native-skia';
import { renderJpeg } from '../../src/rendering/adapters/exportPhoto';
import { matrixFor } from '../../src/domain/filters/testFilter';
jest.mock('expo-file-system', () => ({ Directory: jest.fn(), Paths: { cache: 'cache' }, File: jest.fn() }));
jest.mock('@shopify/react-native-skia', () => ({
  Skia: { Data: { fromBytes: jest.fn() }, Image: { MakeImageFromEncoded: jest.fn() }, Surface: { MakeOffscreen: jest.fn() }, Paint: jest.fn(), ColorFilter: { MakeMatrix: jest.fn() }, Color: jest.fn() },
  ImageFormat: { JPEG: 3 }, AlphaType: { Opaque: 1 }, ColorType: { RGBA_8888: 4 },
}));
const mockSkia = jest.requireMock<{ Skia: {
  Data: { fromBytes: jest.Mock }; Image: { MakeImageFromEncoded: jest.Mock };
  Surface: { MakeOffscreen: jest.Mock }; Paint: jest.Mock; ColorFilter: { MakeMatrix: jest.Mock };
} }>('@shopify/react-native-skia').Skia;
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
function setup() {
  const data = { dispose: jest.fn() };
  const image = { dispose: jest.fn(), width: () => 4032, height: () => 3024 };
  const paint = { dispose: jest.fn(), setColorFilter: jest.fn() };
  const filter = { dispose: jest.fn() };
  const rendered = { dispose: jest.fn(), encodeToBytes: jest.fn(() => new Uint8Array([1, 2, 3])) };
  const canvas = { clear: jest.fn(), translate: jest.fn(), concat: jest.fn(), drawImage: jest.fn() };
  const surface = { dispose: jest.fn(), getCanvas: () => canvas, flush: jest.fn(), makeImageSnapshot: () => rendered };
  // Jest mocks accept plain test doubles; production signatures remain checked by tsc.
  mockSkia.Data.fromBytes.mockReturnValue(data);
  mockSkia.Image.MakeImageFromEncoded.mockReturnValue(image);
  mockSkia.Surface.MakeOffscreen.mockReturnValue(surface);
  mockSkia.Paint.mockReturnValue(paint);
  mockSkia.ColorFilter.MakeMatrix.mockReturnValue(filter);
  return { data, image, paint, filter, rendered, canvas, surface };
}
afterEach(() => jest.resetAllMocks());
test('full source resolution and immutable matrix reach offscreen path; all owned resources release', () => {
  const resources = setup(); const matrix = matrixFor('warm');
  expect(renderJpeg(jpeg, matrix)).toMatchObject({ width: 4032, height: 3024 });
  expect(Skia.Surface.MakeOffscreen).toHaveBeenCalledWith(4032, 3024);
  expect(Skia.ColorFilter.MakeMatrix).toHaveBeenCalledWith(matrix);
  for (const key of ['data', 'image', 'paint', 'filter', 'rendered', 'surface'] as const) expect(resources[key].dispose).toHaveBeenCalledTimes(1);
});
test('GPU allocation failure releases decoded image and data, without low-res fallback', () => {
  const r = setup(); jest.mocked(Skia.Surface.MakeOffscreen).mockReturnValue(null);
  expect(() => renderJpeg(jpeg, matrixFor('warm'))).toThrow('no downscale');
  expect(r.data.dispose).toHaveBeenCalled(); expect(r.image.dispose).toHaveBeenCalled(); expect(Skia.Surface.MakeOffscreen).toHaveBeenCalledTimes(1);
});
test('encode failure still releases all high-resolution GPU objects', () => {
  const r = setup(); r.rendered.encodeToBytes.mockImplementation(() => { throw new Error('encode'); });
  expect(() => renderJpeg(jpeg, matrixFor('identity'))).toThrow('encode');
  for (const key of ['data', 'image', 'paint', 'filter', 'rendered', 'surface'] as const) expect(r[key].dispose).toHaveBeenCalledTimes(1);
});
