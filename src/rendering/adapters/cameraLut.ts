import { FilterMode, MipmapMode, Skia, TileMode } from '@shopify/react-native-skia';
import type { SkiaCameraProps } from 'react-native-vision-camera-skia';
import { getCurrentThreadMarker } from 'react-native-vision-camera-worklets';
import type { Synchronizable } from 'react-native-worklets';
import { previewGeometry } from '../reference/spatialGeometry';
import { bindSpatialSource, createSpatialResources, type SpatialResources } from './spatialEffects';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { bindLutSource, createLutResources, releaseNativeResources,
  type LutPlanes, type LutResources, type NativeResource } from './lutResources';

export type FilterStatus = Readonly<{ key: string; phase: 'loading' | 'applying' | 'ready' | 'error'; message?: string }>;
export type PreviewLutRequest = {
  id: number; key: string; settings: CameraSettings; grainSeed: number; loading: boolean;
  assetKey?: string; planes?: LutPlanes; error?: string;
};
export type PreviewLutState = {
  closed: boolean; request?: PreviewLutRequest; reportedId?: number;
  cached?: { key: string; thread: number; resources: LutResources; spatial?: SpatialResources };
};
export type PreviewLutCell = Synchronizable<PreviewLutState>;
type RenderFrame = Parameters<SkiaCameraProps['onFrame']>[1];

/** Drop only raster LUT/compiled shader resources; camera textures never enter the cache. */
function clearCachedLut(state: PreviewLutState): void {
  'worklet';
  const previous = state.cached;
  state.cached = undefined;
  if (previous) releaseNativeResources([...previous.resources.owned, ...(previous.spatial?.owned ?? [])]);
}

export function closePreviewLut(cell: PreviewLutCell): void {
  // Worklets 0.7.4's setter callback does not unlock on throw. Use explicit finally.
  cell.lock();
  try {
    const state = cell.getBlocking();
    state.closed = true; state.request = undefined;
    try { clearCachedLut(state); } finally { cell.setBlocking(state); }
  } finally { cell.unlock(); }
}

/** Hold the lock through SkiaCamera's snapshot, then release per-frame bindings on this thread. */
export function renderCameraLut(cell: PreviewLutCell, render: RenderFrame,
  frame: { orientation: 'up' | 'down' | 'left' | 'right'; isMirrored: boolean } = { orientation: 'up', isMirrored: false }): FilterStatus | undefined {
  'worklet';
  cell.lock();
  const frameResources: NativeResource[] = [];
  try {
    const state = cell.getBlocking();
    if (state.closed) return;
    const request = state.request;
    let drew = false;
    try {
      render(({ canvas, frameTexture }) => {
        const bypass = !request || request.loading || !!request.error ||
          request.settings.filterId === 'original' || request.settings.intensity === 0;
        if (bypass) {
          canvas.drawImage(frameTexture, 0, 0);
          drew = true;
          return;
        }
        try {
          if (!request.planes || !request.assetKey) throw new Error('필터 자산이 준비되지 않았어요.');
          const thread = getCurrentThreadMarker();
          if (!state.cached || state.cached.key !== request.assetKey || state.cached.thread !== thread) {
            clearCachedLut(state);
            state.cached = { key: request.assetKey, thread, resources: createLutResources(request.planes) };
          }
          const source = frameTexture.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
          frameResources.push(source);
          const spatial = request.settings.grain > 0 || request.settings.bloom > 0;
          let shader = bindLutSource(state.cached.resources, source, spatial ? 1 : request.settings.intensity);
          frameResources.push(shader);
          if (spatial) {
            state.cached.spatial ??= createSpatialResources();
            shader = bindSpatialSource(state.cached.spatial, source, shader, request.settings,
              previewGeometry(frameTexture.width(), frameTexture.height(), frame.orientation, frame.isMirrored),
              request.grainSeed, frameResources);
          }
          const paint = Skia.Paint();
          frameResources.push(paint);
          paint.setShader(shader);
          // drawImage ignores a paint's shader; draw the source's rect with the bound shader instead.
          canvas.drawRect({ x: 0, y: 0, width: frameTexture.width(), height: frameTexture.height() }, paint);
          drew = true;
        } catch {
          request.error = '필터를 적용하지 못해 원본으로 보여드려요.';
          state.reportedId = undefined;
          canvas.drawImage(frameTexture, 0, 0);
          drew = true;
        }
      });
    } finally {
      // render() has now completed snapshot/readback (or failed). No source survives this frame.
      try { releaseNativeResources(frameResources); } finally { cell.setBlocking(state); }
    }
    if (!request || request.loading || !drew || state.reportedId === request.id) return;
    state.reportedId = request.id;
    cell.setBlocking(state);
    return { key: request.key, phase: request.error ? 'error' : 'ready', message: request.error };
  } finally { cell.unlock(); }
}
