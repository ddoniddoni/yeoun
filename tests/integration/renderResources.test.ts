import { Skia } from '@shopify/react-native-skia';
import { bindSpatialSource, createSpatialResources } from '../../src/rendering/adapters/spatialEffects';
import { exportOriginalComparison, exportPhoto, renderJpeg, renderLutJpeg, renderOriginalComparisonJpeg } from '../../src/rendering/adapters/exportPhoto';
import type { Draft, Snapshot } from '../../src/domain/capture/controller';
import { matrixFor } from '../../src/domain/filters/testFilter';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import type { SkiaLutPipeline } from '../../src/rendering/adapters/lutSkia';
jest.mock('../../src/rendering/adapters/spatialEffects', () => ({ createSpatialResources: jest.fn(), bindSpatialSource: jest.fn() }));
jest.mock('../../src/rendering/adapters/bundledLutLoader', () => ({
  createBundledDraftLutLoader: jest.fn(), loadDraftLutPipeline: jest.fn(),
}));
jest.mock('expo-file-system', () => ({ Directory: jest.fn(), Paths: { cache: 'cache' }, File: jest.fn() }));
jest.mock('../../src/platform/files/drafts', () => ({ draftFile: jest.fn(), removeFile: jest.fn() }));
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
  const canvas = { clear: jest.fn(), scale: jest.fn(), translate: jest.fn(), concat: jest.fn(), drawImage: jest.fn(), drawImageOptions: jest.fn(), drawRect: jest.fn() };
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
const editDraft: Draft = { sourceUri: 'file:///source.jpg', width: 4032, height: 3024, orientation: 'up', mirrored: false };
const editSnapshot: Snapshot = { id: 'shot', settings: cameraSettings('original'), position: 'back',
  capturedAt: '2026-10-30T00:00:00Z', grainSeed: 1, flashMode: 'off', stampDate: 261030 };
test('edited export uses a revision file and keeps full resolution', async () => {
  const r = setup();
  const files = jest.requireMock<{ draftFile: jest.Mock; removeFile: jest.Mock }>('../../src/platform/files/drafts');
  const fs = jest.requireMock<{ File: jest.Mock }>('expo-file-system');
  const file = { uri: 'file:///filtered-3.jpg', exists: true, size: 2222,
    write: jest.fn(), bytes: jest.fn().mockResolvedValue(jpeg) };
  fs.File.mockReturnValue({ bytes: jest.fn().mockResolvedValue(jpeg) }); files.draftFile.mockReturnValue(file);
  const check = { width: () => 4032, height: () => 3024, readPixels: () => new Uint8Array(4), dispose: jest.fn() };
  mockSkia.Image.MakeImageFromEncoded.mockReturnValueOnce(r.image).mockReturnValueOnce(check);
  expect(await exportPhoto(editDraft, editSnapshot, 3)).toEqual({ uri: file.uri, width: 4032, height: 3024, bytes: 2222 });
  expect(files.draftFile).toHaveBeenCalledWith('shot', 'filtered-3.jpg');
  expect(fs.File).toHaveBeenCalledWith(editDraft.sourceUri);
  expect(Skia.Surface.MakeOffscreen).toHaveBeenCalledWith(4032, 3024);
  expect(files.removeFile).not.toHaveBeenCalled();
});
test('failed disk validation deletes only the rejected revision', async () => {
  const r = setup();
  const files = jest.requireMock<{ draftFile: jest.Mock; removeFile: jest.Mock }>('../../src/platform/files/drafts');
  const fs = jest.requireMock<{ File: jest.Mock }>('expo-file-system');
  const file = { uri: 'file:///filtered-2.jpg', exists: true, size: 2222,
    write: jest.fn(), bytes: jest.fn().mockResolvedValue(jpeg) };
  fs.File.mockReturnValue({ bytes: jest.fn().mockResolvedValue(jpeg) }); files.draftFile.mockReturnValue(file);
  mockSkia.Image.MakeImageFromEncoded.mockReturnValueOnce(r.image).mockReturnValueOnce(null);
  await expect(exportPhoto(editDraft, editSnapshot, 2)).rejects.toThrow('Written JPEG validation failed');
  expect(files.removeFile.mock.calls).toEqual([[file.uri]]);
  expect(files.draftFile).toHaveBeenCalledWith('shot', 'filtered-2.jpg');
});
test.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('invalid revision %s is rejected before file access', async revision => {
  const files = jest.requireMock<{ draftFile: jest.Mock }>('../../src/platform/files/drafts');
  await expect(exportPhoto(editDraft, editSnapshot, revision)).rejects.toThrow('Invalid photo revision');
  expect(files.draftFile).not.toHaveBeenCalled();
});
test('original comparison writes its own file and checks disk bytes without loading a LUT', async () => {
  const r = setup();
  const files = jest.requireMock<{ draftFile: jest.Mock; removeFile: jest.Mock }>('../../src/platform/files/drafts');
  const fs = jest.requireMock<{ File: jest.Mock }>('expo-file-system');
  const loader = jest.requireMock<{ createBundledDraftLutLoader: jest.Mock }>('../../src/rendering/adapters/bundledLutLoader');
  const file = { uri: 'file:///comparison-original.jpg', exists: true, size: 123,
    write: jest.fn(), bytes: jest.fn().mockResolvedValue(jpeg) };
  fs.File.mockReturnValue({ bytes: jest.fn().mockResolvedValue(jpeg) }); files.draftFile.mockReturnValue(file);
  const checkImage = { width: () => 1600, height: () => 1200, readPixels: jest.fn(() => new Uint8Array(4)), dispose: jest.fn() };
  mockSkia.Image.MakeImageFromEncoded.mockReturnValueOnce(r.image).mockReturnValueOnce(checkImage);
  const settings = { ...cameraSettings('retro-film'), dateStamp: true, lightLeak: 1, dust: 1 };
  const result = await exportOriginalComparison(
    { sourceUri: 'file:///source.jpg', width: 4032, height: 3024, orientation: 'up', mirrored: false },
    { id: 'shot', settings, position: 'back', capturedAt: '2026-10-30T00:00:00Z', grainSeed: 1, flashMode: 'off', stampDate: 261030 });
  expect(files.draftFile).toHaveBeenCalledWith('shot', 'comparison-original.jpg');
  expect(fs.File).toHaveBeenCalledWith('file:///source.jpg');
  expect(result).toEqual({ uri: file.uri, width: 1600, height: 1200, bytes: 123 });
  expect(file.write).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
  expect(file.bytes).toHaveBeenCalledTimes(1); expect(checkImage.readPixels).toHaveBeenCalledTimes(1);
  expect(checkImage.dispose).toHaveBeenCalledTimes(1);
  expect(loader.createBundledDraftLutLoader).not.toHaveBeenCalled();
  expect(createSpatialResources).not.toHaveBeenCalled();
  expect(settings.dateStamp).toBe(true); expect(settings.filterId).toBe('retro-film');
});
test('comparison uses a bounded surface and no effects; ordinary export stays full resolution', () => {
  const r = setup();
  expect(renderOriginalComparisonJpeg(jpeg)).toMatchObject({ width: 1600, height: 1200 });
  expect(Skia.Surface.MakeOffscreen).toHaveBeenCalledWith(1600, 1200);
  expect(r.canvas.scale).toHaveBeenCalledWith(1600 / 4032, 1200 / 3024);
  expect(r.canvas.drawImageOptions).toHaveBeenCalledWith(r.image, 0, 0, 1, 0);
  expect(r.image.makeShaderOptions).not.toHaveBeenCalled();
  expect(createSpatialResources).not.toHaveBeenCalled();
  for (const key of ['data', 'image', 'rendered', 'surface'] as const) expect(r[key].dispose).toHaveBeenCalledTimes(1);
  expect(renderLutJpeg(jpeg, cameraSettings('original'))).toMatchObject({ width: 4032, height: 3024 });
  expect(Skia.Surface.MakeOffscreen).toHaveBeenLastCalledWith(4032, 3024);
  expect(r.canvas.scale).toHaveBeenCalledTimes(1);
});
test('comparison retains the same non-4:3 crop and transform as the saved export', () => {
  const r = setup(); r.image.width = () => 4000; r.image.height = () => 2000;
  renderLutJpeg(jpeg, cameraSettings('original'));
  const crop = r.canvas.translate.mock.calls[0]; const transform = r.canvas.concat.mock.calls[0];
  renderOriginalComparisonJpeg(jpeg);
  expect(r.canvas.translate.mock.calls[1]).toEqual(crop);
  expect(r.canvas.concat.mock.calls[1]).toEqual(transform);
  expect(Skia.Surface.MakeOffscreen).toHaveBeenLastCalledWith(1600, 1200);
});
test.each([1, 2, 3, 4, 5, 6, 7, 8])('comparison and saved export agree on EXIF orientation %i', orientation => {
  const input = new Uint8Array(40); const view = new DataView(input.buffer);
  input.set([0xff, 0xd8, 0xff, 0xe1, 0, 34, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49]);
  view.setUint16(14, 42, true); view.setUint32(16, 8, true); view.setUint16(20, 1, true);
  view.setUint16(22, 0x112, true); view.setUint16(24, 3, true); view.setUint32(26, 1, true);
  view.setUint16(30, orientation, true); input.set([0xff, 0xd9], 38);
  const before = input.slice(); const r = setup();
  const saved = renderLutJpeg(input, cameraSettings('original'));
  const comparison = renderOriginalComparisonJpeg(input);
  expect(comparison.width / comparison.height).toBe(saved.width / saved.height);
  expect(Math.max(comparison.width, comparison.height)).toBe(1600);
  expect(r.canvas.translate.mock.calls[1]).toEqual(r.canvas.translate.mock.calls[0]);
  expect(r.canvas.concat.mock.calls[1]).toEqual(r.canvas.concat.mock.calls[0]);
  expect(input).toEqual(before);
});
test('comparison does not upscale small sources and releases resources after encode failure', () => {
  const r = setup(); r.image.width = () => 640; r.image.height = () => 480;
  expect(renderOriginalComparisonJpeg(jpeg)).toMatchObject({ width: 640, height: 480 });
  r.rendered.encodeToBytes.mockImplementation(() => { throw new Error('encode'); });
  expect(() => renderOriginalComparisonJpeg(jpeg)).toThrow('encode');
  for (const key of ['data', 'image', 'rendered', 'surface'] as const) expect(r[key].dispose).toHaveBeenCalledTimes(2);
});
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

test('retro export forwards all controls and the frozen date without reducing JPEG dimensions', () => {
  const r = setup();
  const binding = { shader: {} as ReturnType<SkiaLutPipeline['bindSource']>['shader'], dispose: jest.fn() };
  const pipeline: SkiaLutPipeline = { bindSource: jest.fn(() => binding), dispose: jest.fn() };
  jest.mocked(createSpatialResources).mockReturnValue({ owned: [] } as ReturnType<typeof createSpatialResources>);
  jest.mocked(bindSpatialSource).mockReturnValue(binding.shader);
  const settings = { ...cameraSettings('retro-digital'), dateStamp: true, dust: 0.2, lightLeak: 0.3 };
  expect(renderLutJpeg(jpeg, settings, pipeline, 91, 261029)).toMatchObject({ width: 4032, height: 3024 });
  expect(pipeline.bindSource).toHaveBeenCalledWith(r.source, 1);
  expect(jest.mocked(bindSpatialSource).mock.calls[0]![3]).toEqual(settings);
  expect(jest.mocked(bindSpatialSource).mock.calls[0]![7]).toBe(261029);
});
