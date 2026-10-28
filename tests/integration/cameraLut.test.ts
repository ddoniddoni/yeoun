import type { SkCanvas, SkImage } from '@shopify/react-native-skia';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { closePreviewLut, renderCameraLut, type PreviewLutCell, type PreviewLutState } from '../../src/rendering/adapters/cameraLut';
import { bindSpatialSource, createSpatialResources } from '../../src/rendering/adapters/spatialEffects';
import { bindLutSource, createLutResources } from '../../src/rendering/adapters/lutResources';

jest.mock('../../src/rendering/adapters/spatialEffects', () => ({ createSpatialResources: jest.fn(), bindSpatialSource: jest.fn() }));

// Control flow/resource ownership doubles only; no shader compilation or camera execution.
jest.mock('react-native-vision-camera-worklets', () => ({ getCurrentThreadMarker: () => 1 }));
jest.mock('@shopify/react-native-skia', () => ({
  Skia: { Paint: jest.fn(), XYWHRect: (x: number, y: number, width: number, height: number) => ({ x, y, width, height }) },
  FilterMode: { Linear: 1 }, MipmapMode: { None: 0 }, TileMode: { Clamp: 0 },
}));
jest.mock('../../src/rendering/adapters/lutResources', () => ({
  createLutResources: jest.fn(), bindLutSource: jest.fn(),
  releaseNativeResources: (resources: { dispose(): void }[]) => {
    let error: unknown;
    while (resources.length) { try { resources.pop()!.dispose(); } catch (failure) { error = failure; } }
    if (error) throw error;
  },
}));

function setup() {
  const events: string[] = [];
  const resource = (name: string) => ({ dispose: jest.fn(() => { events.push(name); }) });
  const cached = resource('cache');
  jest.mocked(createLutResources).mockReturnValue({ owned: [cached] } as ReturnType<typeof createLutResources>);
  const source = resource('source');
  const shader = resource('shader');
  jest.mocked(bindLutSource).mockReturnValue(shader as ReturnType<typeof bindLutSource>);
  const paint = { ...resource('paint'), setShader: jest.fn() };
  jest.requireMock<{ Skia: { Paint: jest.Mock } }>('@shopify/react-native-skia').Skia.Paint.mockReturnValue(paint);
  let state: PreviewLutState = { closed: false, request: {
    id: 1, key: 'selection-1', loading: false, grainSeed: 17, settings: { ...cameraSettings('time-summer', 0.8), grain: 0, bloom: 0 },
    assetKey: 'summer', planes: [new Uint8Array(1), new Uint8Array(1), new Uint8Array(1)],
  } };
  const cell = {
    lock: jest.fn(), unlock: jest.fn(), getBlocking: () => state,
    setBlocking: (value: PreviewLutState) => { state = value; },
  } as unknown as PreviewLutCell;
  const canvas = { drawImage: jest.fn(), drawRect: jest.fn() };
  const texture = { width: () => 100, height: () => 150, makeShaderOptions: jest.fn(() => source) };
  const render: Parameters<typeof renderCameraLut>[1] = draw => {
    draw({ canvas: canvas as unknown as SkCanvas, frameTexture: texture as unknown as SkImage });
    events.push('snapshot');
  };
  return { cell, canvas, texture, render, events, cached, source, shader, paint };
}
afterEach(() => jest.resetAllMocks());

test('bindings live through snapshot; LUT cache survives frames and closes exactly once', () => {
  const r = setup();
  expect(renderCameraLut(r.cell, r.render)).toMatchObject({ key: 'selection-1', phase: 'ready' });
  expect(r.events).toEqual(['snapshot', 'paint', 'shader', 'source']);
  expect(renderCameraLut(r.cell, r.render)).toBeUndefined();
  expect(createLutResources).toHaveBeenCalledTimes(1);
  expect(r.cached.dispose).not.toHaveBeenCalled();
  closePreviewLut(r.cell); closePreviewLut(r.cell);
  expect(r.cached.dispose).toHaveBeenCalledTimes(1);
  const stoppedRender = jest.fn();
  renderCameraLut(r.cell, stoppedRender);
  expect(stoppedRender).not.toHaveBeenCalled();
  expect(r.cell.unlock).toHaveBeenCalledTimes(5);
});

test('loading draws an original without claiming the selected filter is ready', () => {
  const r = setup(); r.cell.getBlocking().request!.loading = true;
  expect(renderCameraLut(r.cell, r.render)).toBeUndefined();
  expect(r.canvas.drawImage).toHaveBeenCalled();
  expect(createLutResources).not.toHaveBeenCalled();
});

test('zero intensity bypasses even a missing LUT', () => {
  const r = setup();
  r.cell.getBlocking().request = { id: 2, key: 'zero', loading: false, grainSeed: 17, settings: cameraSettings('scene-dawn', 0) };
  expect(renderCameraLut(r.cell, r.render)).toMatchObject({ key: 'zero', phase: 'ready' });
  expect(r.canvas.drawImage).toHaveBeenCalled();
  expect(r.texture.makeShaderOptions).not.toHaveBeenCalled();
});

test('binding failure after a ready frame revokes readiness and stays on original until retry', () => {
  const r = setup(); renderCameraLut(r.cell, r.render);
  jest.mocked(bindLutSource).mockImplementationOnce(() => { throw new Error('GPU'); });
  expect(renderCameraLut(r.cell, r.render)?.phase).toBe('error');
  expect(r.canvas.drawImage).toHaveBeenCalled();
  const calls = jest.mocked(bindLutSource).mock.calls.length;
  renderCameraLut(r.cell, r.render);
  expect(bindLutSource).toHaveBeenCalledTimes(calls);
  expect(r.cell.unlock).toHaveBeenCalledTimes(3);
});

test('draw failure and cleanup failure cannot strand the exclusive lock', () => {
  const r = setup();
  r.canvas.drawRect.mockImplementation(() => { throw new Error('draw'); });
  r.canvas.drawImage.mockImplementation(() => { throw new Error('fallback'); });
  expect(() => renderCameraLut(r.cell, r.render)).toThrow('fallback');
  expect(r.source.dispose).toHaveBeenCalled();
  expect(r.cell.unlock).toHaveBeenCalledTimes(1);
  r.cached.dispose.mockImplementation(() => { throw new Error('dispose'); });
  expect(() => closePreviewLut(r.cell)).toThrow('dispose');
  expect(r.cell.getBlocking().closed).toBe(true);
  expect(r.cell.unlock).toHaveBeenCalledTimes(2);
});

test('spatial effects borrow full strength LUT and retain resources through snapshot', () => {
  const r = setup();
  r.cell.getBlocking().request!.settings = cameraSettings('time-summer');
  const cache = { dispose: jest.fn(() => r.events.push('spatial-cache')) };
  const root = { dispose: jest.fn(() => r.events.push('spatial-root')) };
  jest.mocked(createSpatialResources).mockReturnValue({ owned: [cache] } as ReturnType<typeof createSpatialResources>);
  jest.mocked(bindSpatialSource).mockImplementation((_resources, _source, _looked, _settings, _geometry, _seed, owned) => {
    owned.push(root); return root as ReturnType<typeof bindSpatialSource>;
  });
  expect(renderCameraLut(r.cell, r.render)?.phase).toBe('ready');
  expect(bindLutSource).toHaveBeenCalledWith(expect.anything(), r.source, 1);
  expect(jest.mocked(bindSpatialSource).mock.calls[0]![5]).toBe(17);
  expect(r.events).toEqual(['snapshot', 'paint', 'spatial-root', 'shader', 'source']);
  renderCameraLut(r.cell, r.render);
  expect(createSpatialResources).toHaveBeenCalledTimes(1);
  closePreviewLut(r.cell);
  expect(cache.dispose).toHaveBeenCalledTimes(1);
});

test('spatial allocation failure revokes readiness and keeps original fallback until explicit retry', () => {
  const r = setup();
  r.cell.getBlocking().request!.settings = cameraSettings('time-summer');
  jest.mocked(createSpatialResources).mockImplementation(() => { throw new Error('compile'); });
  expect(renderCameraLut(r.cell, r.render)?.phase).toBe('error');
  expect(r.canvas.drawImage).toHaveBeenCalled();
  expect(r.source.dispose).toHaveBeenCalled();
  expect(r.shader.dispose).toHaveBeenCalled();
  renderCameraLut(r.cell, r.render);
  expect(createSpatialResources).toHaveBeenCalledTimes(1);
  expect(r.cell.unlock).toHaveBeenCalledTimes(2);
});
