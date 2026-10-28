import { useEffect, useMemo, useRef } from 'react';
import { createSynchronizable } from 'react-native-worklets';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { createBundledDraftLutLoader } from '../../rendering/adapters/bundledLutLoader';
import { closePreviewLut, type FilterStatus, type PreviewLutCell, type PreviewLutRequest, type PreviewLutState } from '../../rendering/adapters/cameraLut';
import type { LutAssetLoader } from '../../rendering/assets/lutLoader';
import { createLutAlphaPlanes } from '../../rendering/reference/lutPlanes';

export function useCameraLut(settings: CameraSettings, grainSeed: number, key: string, onStatus: (status: FilterStatus) => void) {
  const cell = useMemo<PreviewLutCell>(() => ({
    request: createSynchronizable<PreviewLutRequest | undefined>(undefined),
    state: createSynchronizable<PreviewLutState>({ closed: false }),
  }), []);
  const loader = useRef<LutAssetLoader | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    cell.state.lock();
    try { cell.state.setBlocking({ ...cell.state.getBlocking(), closed: false }); } finally { cell.state.unlock(); }
    return () => {
      try { closePreviewLut(cell); } finally { loader.current?.clearCache(); }
    };
  }, [cell]);
  useEffect(() => {
    const id = ++generation.current;
    const bypass = settings.filterId === 'original' || settings.intensity === 0;
    let cancelled = false;
    // Publish a complete request without reading or blocking on the GPU cache.
    cell.request.setBlocking({ id, key, settings, grainSeed, loading: !bypass });
    onStatus({ key, phase: bypass ? 'applying' : 'loading' });
    if (!bypass) {
      void (async () => {
        try {
          loader.current ??= createBundledDraftLutLoader();
          const loaded = await loader.current.load(settings);
          if (cancelled) return;
          const channels = createLutAlphaPlanes(loaded.atlas);
          const planes: readonly [ArrayBuffer, ArrayBuffer, ArrayBuffer] = [
            Uint8Array.from(channels[0]).buffer, Uint8Array.from(channels[1]).buffer, Uint8Array.from(channels[2]).buffer,
          ];
          if (cancelled || generation.current !== id) return;
          cell.request.setBlocking({ id, key, settings, grainSeed, loading: false, planes, assetKey: loaded.asset.sha256 });
          onStatus({ key, phase: 'applying' });
        } catch (error) {
          if (cancelled) return;
          if (__DEV__) console.warn('[camera-lut-load]', String(error));
          const message = '필터를 불러오지 못해 원본으로 보여드려요. 다시 선택하거나 원본으로 촬영해 주세요.';
          if (generation.current !== id) return;
          cell.request.setBlocking({ id, key, settings, grainSeed, loading: false, error: message });
          onStatus({ key, phase: 'error', message });
        }
      })();
    }
    return () => { cancelled = true; };
  }, [cell, settings, grainSeed, key, onStatus]);
  return cell;
}
