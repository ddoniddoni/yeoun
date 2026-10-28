import { FilterMode, MipmapMode, Skia, TileMode } from '@shopify/react-native-skia';
import type { SkiaCameraProps } from 'react-native-vision-camera-skia';
import { getCurrentThreadMarker } from 'react-native-vision-camera-worklets';
import type { Synchronizable } from 'react-native-worklets';
import { previewGeometry } from '../reference/spatialGeometry';
import { bindSpatialSource, createSpatialResources, type SpatialResources } from './spatialEffects';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { bindLutSource, createLutResources, releaseNativeResources,
  type LutResources, type NativeResource } from './lutResources';

export type FilterStatus = Readonly<{ key: string; phase: 'loading' | 'applying' | 'ready' | 'error'; message?: string }>;
export type PreviewLutRequest = {
  id: number; key: string; settings: CameraSettings; grainSeed: number; loading: boolean;
  // Worklets 0.7 serializes TypedArrays through a worklet initializer, which
  // cannot be unpacked back on RN. Shared payloads must use raw ArrayBuffers.
  assetKey?: string; planes?: readonly [ArrayBuffer, ArrayBuffer, ArrayBuffer]; error?: string;
};
type ThreadLutCache = { key: string; thread: number; resources: LutResources; spatial?: SpatialResources };
const MAX_THREAD_CACHES = 16;
export type PreviewLutState = {
  closed: boolean; reportedId?: number; failedId?: number; error?: string;
  caches?: ThreadLutCache[];
};
// RN writes requests; the camera only reads them. Worklets 0.7's reverse
// serializer strips ArrayBuffers. Never round-trip payloads through camera state.
export type PreviewLutCell = {
  request: Synchronizable<PreviewLutRequest | undefined>;
  state: Synchronizable<PreviewLutState>;
};
type RenderFrame = Parameters<SkiaCameraProps['onFrame']>[1];

/** Drop only raster LUT/compiled shader resources; camera textures never enter the cache. */
function clearCachedLut(state: PreviewLutState): void {
  'worklet';
  const previous = state.caches ?? [];
  state.caches = [];
  releaseNativeResources(previous.flatMap(entry => [...entry.resources.owned, ...(entry.spatial?.owned ?? [])]));
}

export function closePreviewLut(cell: PreviewLutCell): void {
  // Worklets 0.7.4's setter callback does not unlock on throw. Use explicit finally.
  const stateCell = cell.state;
  stateCell.lock();
  try {
    const state = stateCell.getBlocking();
    state.closed = true; cell.request.setBlocking(undefined);
    try { clearCachedLut(state); } finally { stateCell.setBlocking(state); }
  } finally { stateCell.unlock(); }
}

/** Hold the lock through SkiaCamera's snapshot, then release per-frame bindings on this thread. */
export function renderCameraLut(cell: PreviewLutCell, render: RenderFrame,
  frame: { orientation: 'up' | 'down' | 'left' | 'right'; isMirrored: boolean } = { orientation: 'up', isMirrored: false }): FilterStatus | undefined {
  'worklet';
  const stateCell = cell.state;
  stateCell.lock();
  const frameResources: NativeResource[] = [];
  try {
    const state = stateCell.getBlocking();
    if (state.closed) return;
    const request = cell.request.getBlocking();
    let drew = false;
    try {
      render(({ canvas, frameTexture }) => {
        const bypass = !request || request.loading || !!request.error || state.failedId === request.id ||
          request.settings.filterId === 'original' || request.settings.intensity === 0;
        if (bypass) {
          canvas.drawImage(frameTexture, 0, 0);
          drew = true;
          return;
        }
        try {
          if (!request.planes || !request.assetKey) throw new Error('필터 자산이 준비되지 않았어요.');
          const thread = getCurrentThreadMarker();
          if (state.caches?.some(entry => entry.key !== request.assetKey)) clearCachedLut(state);
          const caches = state.caches ??= [];
          const index = caches.findIndex(entry => entry.thread === thread);
          let cached = index >= 0 ? caches.splice(index, 1)[0] : undefined;
          if (!cached) {
            // A serial camera queue can move between OS threads. Retain a bounded
            // LRU per thread instead of recompiling on each switch; never share GPU bindings.
            if (caches.length >= MAX_THREAD_CACHES) {
              const oldest = caches.shift()!;
              releaseNativeResources([...oldest.resources.owned, ...(oldest.spatial?.owned ?? [])]);
            }
            cached = { key: request.assetKey, thread, resources: createLutResources([
              new Uint8Array(request.planes[0]), new Uint8Array(request.planes[1]), new Uint8Array(request.planes[2]),
            ]) };
          }
          caches.push(cached);
          const source = frameTexture.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
          frameResources.push(source);
          const spatial = request.settings.grain > 0 || request.settings.bloom > 0;
          let shader = bindLutSource(cached.resources, source, spatial ? 1 : request.settings.intensity);
          frameResources.push(shader);
          if (spatial) {
            cached.spatial ??= createSpatialResources();
            shader = bindSpatialSource(cached.spatial, source, shader, request.settings,
              previewGeometry(frameTexture.width(), frameTexture.height(), frame.orientation, frame.isMirrored),
              request.grainSeed, frameResources);
          }
          const paint = Skia.Paint();
          frameResources.push(paint);
          paint.setShader(shader);
          // drawImage ignores a paint's shader; draw the source's rect with the bound shader instead.
          canvas.drawRect({ x: 0, y: 0, width: frameTexture.width(), height: frameTexture.height() }, paint);
          drew = true;
        } catch (error) {
          if (__DEV__) console.warn('[camera-lut-render]', String(error));
          state.failedId = request.id; state.error = '필터를 적용하지 못해 원본으로 보여드려요.';
          state.reportedId = undefined;
          canvas.drawImage(frameTexture, 0, 0);
          drew = true;
        }
      });
    } finally {
      // render() has now completed snapshot/readback (or failed). No source survives this frame.
      try { releaseNativeResources(frameResources); } finally { stateCell.setBlocking(state); }
    }
    if (!request || request.loading || !drew || state.reportedId === request.id) return;
    state.reportedId = request.id;
    stateCell.setBlocking(state);
    const error = request.error ?? (state.failedId === request.id ? state.error : undefined);
    return { key: request.key, phase: error ? 'error' : 'ready', message: error };
  } finally { stateCell.unlock(); }
}
