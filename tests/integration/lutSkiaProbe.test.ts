import { AlphaType, ColorType } from '@shopify/react-native-skia';
import { measureLutSkia } from '../../src/rendering/adapters/lutSkiaProbe';
import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';

// Exercises measurement/error reporting only; no actual Skia rendering in these tests.
jest.mock('@shopify/react-native-skia', () => ({
  Skia: {
    Data: { fromBytes: jest.fn() }, Image: { MakeImage: jest.fn() },
    Surface: { MakeOffscreen: jest.fn() }, Paint: jest.fn(), Color: jest.fn(),
  },
  AlphaType: { Opaque: 1, Unpremul: 3 }, ColorType: { RGBA_8888: 4 },
  TileMode: { Clamp: 0 }, FilterMode: { Nearest: 0 }, MipmapMode: { None: 0 },
}));
jest.mock('../../src/rendering/adapters/lutSkia', () => ({ createSkiaLutPipeline: jest.fn() }));
const mockSkia = jest.requireMock<{ Skia: {
  Data: { fromBytes: jest.Mock }; Image: { MakeImage: jest.Mock }; Surface: { MakeOffscreen: jest.Mock }; Paint: jest.Mock;
} }>('@shopify/react-native-skia').Skia;
const mockCreatePipeline = jest.requireMock<{ createSkiaLutPipeline: jest.Mock }>('../../src/rendering/adapters/lutSkia').createSkiaLutPipeline;
const identity = createLutAtlas(rgb => rgb);

function setup() {
  const data = { dispose: jest.fn() };
  const source = { dispose: jest.fn() };
  const input = { dispose: jest.fn(), makeShaderOptions: jest.fn(() => source) };
  const binding = { shader: {}, dispose: jest.fn() };
  const pipeline = { bindSource: jest.fn(() => binding), dispose: jest.fn() };
  const paint = { setAlphaf: jest.fn(), setShader: jest.fn(), dispose: jest.fn() };
  const pixels = new Uint8Array(64 * 4);
  for (let index = 3; index < pixels.length; index += 4) pixels[index] = 254;
  const output = { readPixels: jest.fn(() => pixels), dispose: jest.fn() };
  const canvas = { clear: jest.fn(), drawPaint: jest.fn() };
  const surface = { getCanvas: () => canvas, flush: jest.fn(), makeImageSnapshot: () => output, dispose: jest.fn() };
  mockSkia.Data.fromBytes.mockReturnValue(data);
  mockSkia.Image.MakeImage.mockReturnValue(input);
  mockSkia.Surface.MakeOffscreen.mockReturnValue(surface);
  mockSkia.Paint.mockReturnValue(paint);
  mockCreatePipeline.mockReturnValue(pipeline);
  return { data, source, input, binding, pipeline, paint, output, surface };
}

afterEach(() => jest.resetAllMocks());

test('reports RGB and alpha discrepancies without forcing opaque readback or declaring PASS', () => {
  const r = setup();
  expect(measureLutSkia(identity)).toEqual({
    sampleCount: 64, maxRgbErrorLsb: 255, maxAlphaErrorLsb: 1, worstSample: 1, execution: 'skia-offscreen',
  });
  expect(r.output.readPixels).toHaveBeenCalledWith(0, 0, {
    width: 64, height: 1, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul,
  });
  for (const resource of Object.values(r)) expect(resource.dispose).toHaveBeenCalledTimes(1);
});

test('releases an existing binding and source when an offscreen surface is unavailable', () => {
  const r = setup();
  mockSkia.Surface.MakeOffscreen.mockReturnValue(null);
  expect(() => measureLutSkia(identity)).toThrow(/surface unavailable/);
  for (const resource of [r.binding, r.pipeline, r.source, r.input, r.data]) expect(resource.dispose).toHaveBeenCalledTimes(1);
  expect(mockSkia.Paint).not.toHaveBeenCalled();
});

test('measurement forwards the requested intensity and rejects invalid strength before allocation', () => {
  const r = setup();
  expect(() => measureLutSkia(identity, NaN)).toThrow();
  expect(mockSkia.Data.fromBytes).not.toHaveBeenCalled();
  measureLutSkia(identity, 0.5);
  expect(r.pipeline.bindSource).toHaveBeenCalledWith(r.source, 0.5);
});

test('failed readback still releases every resource and preserves the measurement error', () => {
  const r = setup();
  r.output.readPixels.mockReturnValue(new Uint8Array(3));
  r.output.dispose.mockImplementation(() => { throw new Error('cleanup failed'); });
  expect(() => measureLutSkia(identity)).toThrow(/readback failed/);
  for (const resource of Object.values(r)) expect(resource.dispose).toHaveBeenCalledTimes(1);
});
