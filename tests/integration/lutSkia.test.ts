import { AlphaType, ColorType, FilterMode, MipmapMode, TileMode, type SkShader } from '@shopify/react-native-skia';
import { createSkiaLutPipeline } from '../../src/rendering/adapters/lutSkia';
import { createLutAtlas } from '../../src/rendering/reference/lutAtlas';

// Lifecycle/argument contract only. These mocks cannot compile SkSL or validate GPU colors.
jest.mock('@shopify/react-native-skia', () => ({
  Skia: { Data: { fromBytes: jest.fn() }, Image: { MakeImage: jest.fn() }, RuntimeEffect: { Make: jest.fn() } },
  AlphaType: { Premul: 2 }, ColorType: { Alpha_8: 1 },
  TileMode: { Clamp: 0 }, FilterMode: { Linear: 1 }, MipmapMode: { None: 0 },
}));
const mockSkia = jest.requireMock<{ Skia: {
  Data: { fromBytes: jest.Mock }; Image: { MakeImage: jest.Mock }; RuntimeEffect: { Make: jest.Mock };
} }>('@shopify/react-native-skia').Skia;
const atlas = createLutAtlas(() => [17 / 255, 91 / 255, 203 / 255]);

function setup() {
  const released: string[] = [];
  const resource = (name: string) => ({ dispose: jest.fn(() => { released.push(name); }) });
  const data = [0, 1, 2].map(index => resource(`data${index}`));
  const children = [0, 1, 2].map(index => resource(`child${index}`));
  const images = children.map((child, index) => ({
    ...resource(`image${index}`), makeShaderOptions: jest.fn(() => child),
  }));
  const roots: ReturnType<typeof resource>[] = [];
  const effect = {
    ...resource('effect'),
    makeShaderWithChildren: jest.fn(() => {
      const root = resource(`root${roots.length}`);
      roots.push(root);
      return root;
    }),
  };
  const source = { __typename__: 'Shader', ...resource('source') } as SkShader;
  mockSkia.RuntimeEffect.Make.mockReturnValue(effect);
  for (const item of data) mockSkia.Data.fromBytes.mockReturnValueOnce(item);
  for (const image of images) mockSkia.Image.MakeImage.mockReturnValueOnce(image);
  return { released, data, children, images, roots, effect, source };
}

afterEach(() => jest.resetAllMocks());

test('uploads three owned alpha planes once and borrows the source for each binding', () => {
  const r = setup();
  const pipeline = createSkiaLutPipeline(atlas);
  const first = pipeline.bindSource(r.source);
  const second = pipeline.bindSource(r.source);
  expect(mockSkia.RuntimeEffect.Make).toHaveBeenCalledTimes(1);
  expect(mockSkia.Image.MakeImage).toHaveBeenCalledTimes(3);
  for (let channel = 0; channel < 3; channel++) {
    const bytes = mockSkia.Data.fromBytes.mock.calls[channel]![0] as Uint8Array;
    expect(bytes.byteOffset).toBe(0);
    expect(bytes.buffer.byteLength).toBe(44100);
    expect(bytes[211]).toBe([17, 91, 203][channel]);
    expect(mockSkia.Image.MakeImage).toHaveBeenNthCalledWith(channel + 1, {
      width: 210, height: 210, colorType: ColorType.Alpha_8, alphaType: AlphaType.Premul,
    }, r.data[channel], 210);
    expect(r.images[channel]!.makeShaderOptions).toHaveBeenCalledWith(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
  }
  expect(r.effect.makeShaderWithChildren).toHaveBeenNthCalledWith(1, [], [r.source, ...r.children]);
  expect(first.shader).toBe(r.roots[0]);
  expect(second.shader).toBe(r.roots[1]);
  first.dispose();
  first.dispose();
  expect(() => first.shader).toThrow(/disposed/);
  pipeline.dispose();
  pipeline.dispose();
  second.dispose();
  expect(() => second.shader).toThrow(/disposed/);
  expect(() => pipeline.bindSource(r.source)).toThrow(/disposed/);
  expect(r.released).toEqual([
    'root0', 'root1', 'child2', 'image2', 'data2', 'child1', 'image1', 'data1', 'child0', 'image0', 'data0', 'effect',
  ]);
  expect(r.source.dispose).not.toHaveBeenCalled();
});

test('rejects a malformed atlas before native allocation', () => {
  setup();
  expect(() => createSkiaLutPipeline({ ...atlas, height: 209 })).toThrow(/210x210/);
  expect(mockSkia.RuntimeEffect.Make).not.toHaveBeenCalled();
  expect(mockSkia.Data.fromBytes).not.toHaveBeenCalled();
});

test('reports compilation failure without allocating textures', () => {
  setup();
  mockSkia.RuntimeEffect.Make.mockReturnValue(null);
  expect(() => createSkiaLutPipeline(atlas)).toThrow(/compilation/);
  expect(mockSkia.Data.fromBytes).not.toHaveBeenCalled();
});

test.each([0, 1, 2])('releases partial construction when image %s cannot allocate', failedIndex => {
  const r = setup();
  mockSkia.Image.MakeImage.mockReset();
  for (let index = 0; index < failedIndex; index++) mockSkia.Image.MakeImage.mockReturnValueOnce(r.images[index]);
  mockSkia.Image.MakeImage.mockReturnValueOnce(null);
  expect(() => createSkiaLutPipeline(atlas)).toThrow(/allocation/);
  expect(r.effect.dispose).toHaveBeenCalledTimes(1);
  for (let index = 0; index < 3; index++) {
    expect(r.data[index]!.dispose).toHaveBeenCalledTimes(index <= failedIndex ? 1 : 0);
    expect(r.images[index]!.dispose).toHaveBeenCalledTimes(index < failedIndex ? 1 : 0);
    expect(r.children[index]!.dispose).toHaveBeenCalledTimes(index < failedIndex ? 1 : 0);
  }
  expect(r.source.dispose).not.toHaveBeenCalled();
});

test('preserves the allocation error and releases everything else if cleanup also fails', () => {
  const r = setup();
  r.images[1]!.makeShaderOptions.mockImplementation(() => { throw new Error('shader failed'); });
  r.data[1]!.dispose.mockImplementation(() => { throw new Error('dispose failed'); });
  expect(() => createSkiaLutPipeline(atlas)).toThrow('shader failed');
  expect(r.images[1]!.dispose).toHaveBeenCalledTimes(1);
  expect(r.data[1]!.dispose).toHaveBeenCalledTimes(1);
  expect(r.released).toEqual(['image1', 'child0', 'image0', 'data0', 'effect']);
});

test('failed binding leaves the cached pipeline usable', () => {
  const r = setup();
  const pipeline = createSkiaLutPipeline(atlas);
  r.effect.makeShaderWithChildren.mockImplementationOnce(() => { throw new Error('binding failed'); });
  expect(() => pipeline.bindSource(r.source)).toThrow('binding failed');
  expect(r.effect.dispose).not.toHaveBeenCalled();
  const binding = pipeline.bindSource(r.source);
  expect(binding.shader).toBe(r.roots[0]);
  pipeline.dispose();
  expect(r.roots[0]!.dispose).toHaveBeenCalledTimes(1);
});

test('continues cleanup after a binding disposal failure and never disposes the borrowed source', () => {
  const r = setup();
  const pipeline = createSkiaLutPipeline(atlas);
  const binding = pipeline.bindSource(r.source);
  r.roots[0]!.dispose.mockImplementation(() => { throw new Error('root dispose failed'); });
  expect(() => pipeline.dispose()).toThrow('root dispose failed');
  pipeline.dispose();
  binding.dispose();
  expect(r.roots[0]!.dispose).toHaveBeenCalledTimes(1);
  expect(r.effect.dispose).toHaveBeenCalledTimes(1);
  for (const resource of [...r.children, ...r.images, ...r.data]) expect(resource.dispose).toHaveBeenCalledTimes(1);
  expect(r.source.dispose).not.toHaveBeenCalled();
});
