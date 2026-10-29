import type { SkCanvas, SkImage } from '@shopify/react-native-skia';
import { getCurrentThreadMarker } from 'react-native-vision-camera-worklets';
import { cameraSettings } from '../../src/domain/filters/cameraSettings';
import { closePreviewLut, renderCameraLut, type PreviewLutCell, type PreviewLutRequest, type PreviewLutState } from '../../src/rendering/adapters/cameraLut';
import { bindSpatialSource, createSpatialResources } from '../../src/rendering/adapters/spatialEffects';
import { bindLutSource, createLutResources } from '../../src/rendering/adapters/lutResources';

jest.mock('../../src/rendering/adapters/spatialEffects', () => ({ createSpatialResources: jest.fn(), bindSpatialSource: jest.fn() }));

// Control flow/resource ownership doubles only; no shader compilation or camera execution.
jest.mock('react-native-vision-camera-worklets', () => ({ getCurrentThreadMarker: jest.fn() }));
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
  jest.mocked(getCurrentThreadMarker).mockReturnValue(1);
  const events: string[] = [];
  const resource = (name: string) => ({ dispose: jest.fn(() => { events.push(name); }) });
  const cached = resource('cache');
  jest.mocked(createLutResources).mockReturnValue({ owned: [cached] } as ReturnType<typeof createLutResources>);
  const source = resource('source');
  const shader = resource('shader');
  jest.mocked(bindLutSource).mockReturnValue(shader as ReturnType<typeof bindLutSource>);
  const paint = { ...resource('paint'), setShader: jest.fn() };
  jest.requireMock<{ Skia: { Paint: jest.Mock } }>('@shopify/react-native-skia').Skia.Paint.mockReturnValue(paint);
  let state: PreviewLutState = { closed: false };
  let request: PreviewLutRequest | undefined = {
    id: 1, key: 'selection-1', loading: false, grainSeed: 17, settings: { ...cameraSettings('time-summer', 0.8), grain: 0, bloom: 0 },
    assetKey: 'summer', planes: [new ArrayBuffer(1), new ArrayBuffer(1), new ArrayBuffer(1)],
  };
  const cell = { state: {
    lock: jest.fn(), unlock: jest.fn(), getBlocking: () => state,
    setBlocking: (value: PreviewLutState) => { state = value; },
  }, request: {
    getBlocking: () => request,
    setBlocking: jest.fn((value: PreviewLutRequest | undefined) => { request = value; }),
  } } as unknown as PreviewLutCell;
  const canvas = { drawImage: jest.fn(), drawRect: jest.fn() };
  const texture = { width: () => 100, height: () => 150, makeShaderOptions: jest.fn(() => source) };
  const render: Parameters<typeof renderCameraLut>[1] = draw => {
    draw({ canvas: canvas as unknown as SkCanvas, frameTexture: texture as unknown as SkImage });
    events.push('snapshot');
  };
  return { cell, canvas, texture, render, events, cached, source, shader, paint };
}
afterEach(() => jest.resetAllMocks());

test('shared LUT payload stays as raw buffers while upload views stay local to the renderer', () => {
  const r = setup();
  const planes = r.cell.request.getBlocking()!.planes!;
  new Uint8Array(planes[0])[0] = 10;
  new Uint8Array(planes[1])[0] = 20;
  new Uint8Array(planes[2])[0] = 30;
  renderCameraLut(r.cell, r.render);
  const uploaded = jest.mocked(createLutResources).mock.calls[0]![0];
  expect(uploaded.every(plane => plane instanceof Uint8Array)).toBe(true);
  expect(uploaded.map(plane => plane[0])).toEqual([10, 20, 30]);
  expect(r.cell.request.getBlocking()!.planes!.every(buffer => buffer instanceof ArrayBuffer)).toBe(true);
  // A later RN selection/read/close must not encounter TypedArray initializers.
  expect(r.cell.request.setBlocking).not.toHaveBeenCalled();
  r.cell.request.setBlocking({ id: 2, key: 'original', loading: false, grainSeed: 17, settings: cameraSettings('original') });
  expect(renderCameraLut(r.cell, r.render)?.phase).toBe('ready');
  closePreviewLut(r.cell);
  expect(r.cached.dispose).toHaveBeenCalledTimes(1);
});

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
  expect(r.cell.state.unlock).toHaveBeenCalledTimes(5);
});

test('loading draws an original without claiming the selected filter is ready', () => {
  const r = setup(); r.cell.request.getBlocking()!.loading = true;
  expect(renderCameraLut(r.cell, r.render)).toBeUndefined();
  expect(r.canvas.drawImage).toHaveBeenCalled();
  expect(createLutResources).not.toHaveBeenCalled();
});

test('returning camera threads reuse their own LUTs and a new LUT releases every old entry', () => {
  const r = setup();
  const resources = Array.from({ length: 3 }, () => ({ owned: [{ dispose: jest.fn() }] }));
  for (const resource of resources) {
    jest.mocked(createLutResources).mockReturnValueOnce(resource as ReturnType<typeof createLutResources>);
  }
  renderCameraLut(r.cell, r.render);
  jest.mocked(getCurrentThreadMarker).mockReturnValue(2);
  renderCameraLut(r.cell, r.render);
  jest.mocked(getCurrentThreadMarker).mockReturnValue(1);
  renderCameraLut(r.cell, r.render);
  expect(createLutResources).toHaveBeenCalledTimes(2);
  expect(jest.mocked(bindLutSource).mock.calls.map(call => call[0])).toEqual([resources[0], resources[1], resources[0]]);
  expect(resources[0]!.owned[0]!.dispose).not.toHaveBeenCalled();
  r.cell.request.setBlocking({ ...r.cell.request.getBlocking()!, id: 2, key: 'next', assetKey: 'next-lut' });
  renderCameraLut(r.cell, r.render);
  expect(resources[0]!.owned[0]!.dispose).toHaveBeenCalledTimes(1);
  expect(resources[1]!.owned[0]!.dispose).toHaveBeenCalledTimes(1);
  closePreviewLut(r.cell);
  expect(resources[2]!.owned[0]!.dispose).toHaveBeenCalledTimes(1);
});

test('thread cache is bounded and evicts the least recently used entry', () => {
  const r = setup();
  const resources = Array.from({ length: 17 }, () => ({ owned: [{ dispose: jest.fn() }] }));
  for (const resource of resources) {
    jest.mocked(createLutResources).mockReturnValueOnce(resource as ReturnType<typeof createLutResources>);
  }
  for (let thread = 1; thread <= 16; thread++) {
    jest.mocked(getCurrentThreadMarker).mockReturnValue(thread);
    renderCameraLut(r.cell, r.render);
  }
  jest.mocked(getCurrentThreadMarker).mockReturnValue(1);
  renderCameraLut(r.cell, r.render);
  jest.mocked(getCurrentThreadMarker).mockReturnValue(17);
  renderCameraLut(r.cell, r.render);
  expect(r.cell.state.getBlocking().caches).toHaveLength(16);
  expect(resources[0]!.owned[0]!.dispose).not.toHaveBeenCalled();
  expect(resources[1]!.owned[0]!.dispose).toHaveBeenCalledTimes(1);
  closePreviewLut(r.cell);
  for (const resource of resources) expect(resource.owned[0]!.dispose).toHaveBeenCalledTimes(1);
});

test('zero intensity bypasses even a missing LUT', () => {
  const r = setup();
  r.cell.request.setBlocking({ id: 2, key: 'zero', loading: false, grainSeed: 17, settings: cameraSettings('scene-dawn', 0) });
  expect(renderCameraLut(r.cell, r.render)).toMatchObject({ key: 'zero', phase: 'ready' });
  expect(r.canvas.drawImage).toHaveBeenCalled();
  expect(r.texture.makeShaderOptions).not.toHaveBeenCalled();
});

test('temporary original comparison reuses the LUT cache and reports a fresh restored draw without changing the selection', () => {
  const r = setup();
  const selected = r.cell.request.getBlocking()!;
  const settings = selected.settings;
  expect(renderCameraLut(r.cell, r.render)?.key).toBe('selection-1');
  r.cell.request.setBlocking({ id: 2, key: 'comparison-2', loading: false,
    settings: cameraSettings('original'), grainSeed: selected.grainSeed });
  expect(renderCameraLut(r.cell, r.render)).toMatchObject({ key: 'comparison-2', phase: 'ready' });
  expect(r.canvas.drawImage).toHaveBeenCalledTimes(1);
  expect(bindLutSource).toHaveBeenCalledTimes(1);
  expect(r.cached.dispose).not.toHaveBeenCalled();
  r.cell.request.setBlocking({ ...selected, id: 3, key: 'restored-3' });
  expect(renderCameraLut(r.cell, r.render)).toMatchObject({ key: 'restored-3', phase: 'ready' });
  expect(createLutResources).toHaveBeenCalledTimes(1);
  expect(bindLutSource).toHaveBeenCalledTimes(2);
  expect(r.cell.request.getBlocking()!.settings).toBe(settings);
  expect(settings.filterId).toBe('time-summer');
  expect(settings.intensity).toBe(0.8);
  expect(r.cell.request.getBlocking()!.grainSeed).toBe(17);
});

test('binding failure after a ready frame revokes readiness and stays on original until retry', () => {
  const r = setup(); renderCameraLut(r.cell, r.render);
  jest.mocked(bindLutSource).mockImplementationOnce(() => { throw new Error('GPU'); });
  expect(renderCameraLut(r.cell, r.render)?.phase).toBe('error');
  expect(r.canvas.drawImage).toHaveBeenCalled();
  const calls = jest.mocked(bindLutSource).mock.calls.length;
  renderCameraLut(r.cell, r.render);
  expect(bindLutSource).toHaveBeenCalledTimes(calls);
  expect(r.cell.state.unlock).toHaveBeenCalledTimes(3);
});

test('draw failure and cleanup failure cannot strand the exclusive lock', () => {
  const r = setup();
  r.canvas.drawRect.mockImplementation(() => { throw new Error('draw'); });
  r.canvas.drawImage.mockImplementation(() => { throw new Error('fallback'); });
  expect(() => renderCameraLut(r.cell, r.render)).toThrow('fallback');
  expect(r.source.dispose).toHaveBeenCalled();
  expect(r.cell.state.unlock).toHaveBeenCalledTimes(1);
  r.cached.dispose.mockImplementation(() => { throw new Error('dispose'); });
  expect(() => closePreviewLut(r.cell)).toThrow('dispose');
  expect(r.cell.state.getBlocking().closed).toBe(true);
  expect(r.cell.state.unlock).toHaveBeenCalledTimes(2);
});

test('spatial effects borrow full strength LUT and retain resources through snapshot', () => {
  const r = setup();
  r.cell.request.getBlocking()!.settings = cameraSettings('time-summer');
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
  r.cell.request.getBlocking()!.settings = cameraSettings('time-summer');
  jest.mocked(createSpatialResources).mockImplementation(() => { throw new Error('compile'); });
  expect(renderCameraLut(r.cell, r.render)?.phase).toBe('error');
  expect(r.canvas.drawImage).toHaveBeenCalled();
  expect(r.source.dispose).toHaveBeenCalled();
  expect(r.shader.dispose).toHaveBeenCalled();
  renderCameraLut(r.cell, r.render);
  expect(createSpatialResources).toHaveBeenCalledTimes(1);
  expect(r.cell.state.unlock).toHaveBeenCalledTimes(2);
});

test('retro effects and the preview date use the spatial path even with grain and bloom off', () => {
  const r = setup();
  const settings = { ...cameraSettings('retro-digital'), grain: 0, bloom: 0, dateStamp: true, lightLeak: 0.3, dust: 0.2 };
  r.cell.request.setBlocking({ ...r.cell.request.getBlocking()!, settings, stampDate: 261029 });
  jest.mocked(createSpatialResources).mockReturnValue({ owned: [] } as ReturnType<typeof createSpatialResources>);
  jest.mocked(bindSpatialSource).mockReturnValue(r.shader as ReturnType<typeof bindSpatialSource>);
  expect(renderCameraLut(r.cell, r.render)?.phase).toBe('ready');
  expect(bindLutSource).toHaveBeenCalledWith(expect.anything(), r.source, 1);
  expect(jest.mocked(bindSpatialSource).mock.calls[0]![3]).toBe(settings);
  expect(jest.mocked(bindSpatialSource).mock.calls[0]![7]).toBe(261029);
  expect(r.cell.request.setBlocking).toHaveBeenCalledTimes(1); // RN publication only.
});
