import type { SkShader } from '@shopify/react-native-skia';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { bindSpatialSource, createSpatialResources } from '../../src/rendering/adapters/spatialEffects';
import { releaseNativeResources } from '../../src/rendering/adapters/lutResources';
import { spatialGeometry } from '../../src/rendering/reference/spatialGeometry';

// Allocation/ownership assertions only: these doubles cannot compile or validate SkSL.
jest.mock('@shopify/react-native-skia', () => ({
  Skia: { RuntimeEffect: { Make: jest.fn() }, Surface: { MakeOffscreen: jest.fn() }, Paint: jest.fn() },
  FilterMode: { Nearest: 0, Linear: 1 }, MipmapMode: { None: 0 }, TileMode: { Clamp: 0 },
}));
const skia = jest.requireMock<{ Skia: {
  RuntimeEffect: { Make: jest.Mock }; Surface: { MakeOffscreen: jest.Mock }; Paint: jest.Mock;
} }>('@shopify/react-native-skia').Skia;
const geometry = spatialGeometry(3024, 4032, [1, 0, 0, 1, 0, 0]);
function setup() {
  const allocated: { dispose: jest.Mock }[] = [];
  const resource = () => { const value = { dispose: jest.fn() }; allocated.push(value); return value; };
  const source = { dispose: jest.fn() } as unknown as SkShader;
  const looked = { dispose: jest.fn() } as unknown as SkShader;
  const draws: jest.Mock[] = [];
  skia.RuntimeEffect.Make.mockImplementation(() => ({ ...resource(), makeShaderWithChildren: jest.fn(resource) }));
  skia.Paint.mockImplementation(() => ({ ...resource(), setShader: jest.fn() }));
  skia.Surface.MakeOffscreen.mockImplementation(() => {
    const drawRect = jest.fn(); draws.push(drawRect);
    return { ...resource(), getCanvas: () => ({ drawRect }), flush: jest.fn(),
      makeImageSnapshot: () => ({ ...resource(), makeShaderOptions: resource }) };
  });
  return { allocated, source, looked, draws };
}
afterEach(() => jest.resetAllMocks());

test('bloom builds three bounded passes and retains all objects until caller finishes drawing', () => {
  const r = setup(); const compiled = createSpatialResources(); const drawing: { dispose(): void }[] = [];
  const final = bindSpatialSource(compiled, r.source, r.looked, cameraSettings('time-summer'), geometry, 7, drawing);
  expect(skia.Surface.MakeOffscreen).toHaveBeenCalledTimes(3);
  for (const call of skia.Surface.MakeOffscreen.mock.calls) expect(call).toEqual([384, 512]);
  expect(r.draws.every(draw => draw.mock.calls.length === 1)).toBe(true);
  expect(drawing[drawing.length - 1]).toBe(final);
  for (const item of r.allocated) expect(item.dispose).not.toHaveBeenCalled();
  releaseNativeResources([...compiled.owned, ...drawing]);
  for (const item of r.allocated) expect(item.dispose).toHaveBeenCalledTimes(1);
  expect(r.source.dispose).not.toHaveBeenCalled(); expect(r.looked.dispose).not.toHaveBeenCalled();
});

test('grain only allocates no bloom surface; invalid seed binds nothing', () => {
  const r = setup(); const compiled = createSpatialResources(); const drawing: { dispose(): void }[] = [];
  const settings = { ...cameraSettings('time-summer'), bloom: 0 };
  expect(() => bindSpatialSource(compiled, r.source, r.looked, settings, geometry, NaN, drawing)).toThrow('seed');
  expect(drawing).toHaveLength(0);
  bindSpatialSource(compiled, r.source, r.looked, settings, geometry, 0, drawing);
  expect(skia.Surface.MakeOffscreen).not.toHaveBeenCalled(); expect(drawing).toHaveLength(1);
  releaseNativeResources([...compiled.owned, ...drawing]);
});

test.each([1, 2, 3])('allocation failure in pass %s remains an error and caller can release every partial resource', pass => {
  const r = setup(); const compiled = createSpatialResources(); const drawing: { dispose(): void }[] = [];
  const allocate = skia.Surface.MakeOffscreen.getMockImplementation()!;
  let calls = 0;
  skia.Surface.MakeOffscreen.mockImplementation((...args: unknown[]) => ++calls === pass ? null : allocate(...args));
  try {
    expect(() => bindSpatialSource(compiled, r.source, r.looked, cameraSettings('time-summer'), geometry, 0, drawing)).toThrow('allocation');
  } finally { releaseNativeResources([...compiled.owned, ...drawing]); }
  for (const item of r.allocated) expect(item.dispose).toHaveBeenCalledTimes(1);
});

test('partial shader compilation releases previous effects', () => {
  const r = setup();
  const compile = skia.RuntimeEffect.Make.getMockImplementation()!;
  skia.RuntimeEffect.Make.mockImplementationOnce(compile).mockReturnValueOnce(null);
  expect(() => createSpatialResources()).toThrow('compilation');
  for (const item of r.allocated) expect(item.dispose).toHaveBeenCalledTimes(1);
});

test('halation reuses the same three bounded bloom passes even when bloom is off', () => {
  const r = setup(); const compiled = createSpatialResources(); const drawing: { dispose(): void }[] = [];
  bindSpatialSource(compiled, r.source, r.looked, { ...cameraSettings('retro-film'), bloom: 0 }, geometry, 7, drawing);
  expect(skia.Surface.MakeOffscreen).toHaveBeenCalledTimes(3);
  releaseNativeResources([...compiled.owned, ...drawing]);
  for (const resource of r.allocated) expect(resource.dispose).toHaveBeenCalledTimes(1);
});

test('digital and overlay effects allocate no extra surface and forward the captured date as a scalar', () => {
  const r = setup(); const compiled = createSpatialResources(); const drawing: { dispose(): void }[] = [];
  const settings = { ...cameraSettings('retro-digital'), dateStamp: true, lightLeak: 0.4, dust: 0.3 };
  expect(() => bindSpatialSource(compiled, r.source, r.looked, settings, geometry, 7, drawing, 0)).toThrow('date');
  expect(drawing).toHaveLength(0);
  bindSpatialSource(compiled, r.source, r.looked, settings, geometry, 7, drawing, 261029);
  expect(skia.Surface.MakeOffscreen).not.toHaveBeenCalled();
  expect(compiled.composite.makeShaderWithChildren).toHaveBeenCalledWith([
    ...geometry.forward, 3024, 4032, 384 / 3024, 512 / 4032, 0.8, 0, 0, 7,
    0.12, 0, 0.5, 0.22, 0.4, 0.3, 1, 261029,
  ], [r.source, r.looked, r.looked]);
  releaseNativeResources([...compiled.owned, ...drawing]);
});
