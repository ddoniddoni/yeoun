import { Skia } from '@shopify/react-native-skia';
import { bindSpatialSource, createSpatialResources } from '../../src/rendering/adapters/spatialEffects';
import { renderJpeg, renderLutJpeg } from '../../src/rendering/adapters/exportPhoto';
import { matrixFor } from '../../src/domain/filters/testFilter';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import type { SkiaLutPipeline } from '../../src/rendering/adapters/lutSkia';
jest.mock('../../src/rendering/adapters/spatialEffects', () => ({ createSpatialResources: jest.fn(), bindSpatialSource: jest.fn() }));
jest.mock('../../src/rendering/adapters/bundledLutLoader', () => ({
  createBundledDraftLutLoader: jest.fn(), loadDraftLutPipeline: jest.fn(),
}));
jest.mock('expo-file-system', () => ({ Directory: jest.fn(), Paths: { cache: 'cache' }, File: jest.fn() }));
jest.mock('@shopify/react-native-skia', () => ({
  Skia: { Data: { fromBytes: jest.fn() }, Image: { MakeImageFromEncoded: jest.fn() }, Surface: { MakeOffscreen: jest.fn() }, Paint: jest.fn(), ColorFilter: { MakeMatrix: jest.fn() }, Color: jest.fn(), XYWHRect: jest.fn() },
  ImageFormat: { JPEG: 3 }, AlphaType: { Opaque: 1 }, ColorType: { RGBA_8888: 4 },
  FilterMode: { Linear: 1 }, MipmapMode: { None: 0 }, TileMode: { Clamp: 0 },
}));
const mockSkia = jest.requireMock<{ Skia: {
  Data: { fromBytes: jest.Mock }; Image: { MakeImageFromEncoded: jest.Mock };
  Surface: { MakeOffscreen: jest.Mock }; Paint: jest.Mock; ColorFilter: { MakeMatrix: jest.Mock };
} }>('@shopify/react-native-skia').Skia;
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
function setup() {
  const data = { dispose: jest.fn() };
  const source = { dispose: jest.fn() };
  const image = { dispose: jest.fn(), width: () => 4032, height: () => 3024, makeShaderOptions: jest.fn(() => source) };
  const paint = { dispose: jest.fn(), setColorFilter: jest.fn(), setShader: jest.fn() };
  const filter = { dispose: jest.fn() };
  const rendered = { dispose: jest.fn(), encodeToBytes: jest.fn(() => new Uint8Array([1, 2, 3])) };
  const canvas = { clear: jest.fn(), translate: jest.fn(), concat: jest.fn(), drawImage: jest.fn(), drawRect: jest.fn() };
  const surface = { dispose: jest.fn(), getCanvas: () => canvas, flush: jest.fn(), makeImageSnapshot: () => rendered };
  // Jest mocks accept plain test doubles; production signatures remain checked by tsc.
  mockSkia.Data.fromBytes.mockReturnValue(data);
  mockSkia.Image.MakeImageFromEncoded.mockReturnValue(image);
  mockSkia.Surface.MakeOffscreen.mockReturnValue(surface);
  mockSkia.Paint.mockReturnValue(paint);
  mockSkia.ColorFilter.MakeMatrix.mockReturnValue(filter);
  return { data, image, paint, filter, rendered, canvas, surface, source };
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

test('original and zero intensity bypass LUT and Matrix without changing output dimensions', () => {
  for (const settings of [cameraSettings('original'), cameraSettings('time-summer', 0)]) {
    const r = setup();
    expect(renderLutJpeg(jpeg, settings)).toMatchObject({ width: 4032, height: 3024 });
    expect(r.canvas.drawImage).toHaveBeenCalledWith(r.image, 0, 0);
    expect(r.image.makeShaderOptions).not.toHaveBeenCalled();
  }
  expect(Skia.ColorFilter.MakeMatrix).not.toHaveBeenCalled();
});

test('missing LUT refuses filtered export instead of silently saving an original', () => {
  const r = setup();
  expect(() => renderLutJpeg(jpeg, cameraSettings('time-summer'))).toThrow('선택한 필터');
  expect(r.rendered.encodeToBytes).not.toHaveBeenCalled();
  expect(r.image.dispose).toHaveBeenCalled();
});

test('export passes exact master intensity and releases frame binding after JPEG encoding fails', () => {
  const r = setup();
  const binding = { shader: {} as ReturnType<SkiaLutPipeline['bindSource']>['shader'], dispose: jest.fn() };
  const pipeline: SkiaLutPipeline = { bindSource: jest.fn(() => binding), dispose: jest.fn() };
  r.rendered.encodeToBytes.mockImplementation(() => { throw new Error('encode'); });
  expect(() => renderLutJpeg(jpeg, { ...cameraSettings('scene-dawn', 0.3), grain: 0, bloom: 0 }, pipeline)).toThrow('encode');
  expect(pipeline.bindSource).toHaveBeenCalledWith(r.source, 0.3);
  expect(r.canvas.drawRect).toHaveBeenCalled();
  expect(r.canvas.drawImage).not.toHaveBeenCalled();
  expect(r.source.dispose).toHaveBeenCalledTimes(1);
  expect(binding.dispose).toHaveBeenCalledTimes(1);
  expect(pipeline.dispose).not.toHaveBeenCalled(); // Export caller owns the cached LUT.
});

test('export shares spatial settings/seed, full strength LUT and normalized geometry; errors release bindings', () => {
  const r = setup();
  const binding = { shader: {} as ReturnType<SkiaLutPipeline['bindSource']>['shader'], dispose: jest.fn() };
  const pipeline: SkiaLutPipeline = { bindSource: jest.fn(() => binding), dispose: jest.fn() };
  const compiled = { dispose: jest.fn() }, root = { dispose: jest.fn() };
  jest.mocked(createSpatialResources).mockReturnValue({ owned: [compiled] } as ReturnType<typeof createSpatialResources>);
  jest.mocked(bindSpatialSource).mockImplementation((_resources, _source, _looked, _settings, _geometry, _seed, owned) => {
    owned.push(root); return root as ReturnType<typeof bindSpatialSource>;
  });
  r.rendered.encodeToBytes.mockImplementation(() => { throw new Error('encode'); });
  const settings = cameraSettings('time-summer', 0.5);
  expect(() => renderLutJpeg(jpeg, settings, pipeline, 23)).toThrow('encode');
  expect(pipeline.bindSource).toHaveBeenCalledWith(r.source, 1);
  expect(jest.mocked(bindSpatialSource).mock.calls[0]!.slice(3, 6)).toEqual([
    settings, expect.objectContaining({ width: 4032, height: 3024, forward: [1, 0, 0, 1, 0, 0] }), 23,
  ]);
  for (const resource of [compiled, root, binding, r.source, r.image, r.surface]) expect(resource.dispose).toHaveBeenCalledTimes(1);
});
