import { useEffect, useMemo, useRef } from 'react';
import { createSynchronizable } from 'react-native-worklets';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { createBundledDraftLutLoader } from '../../rendering/adapters/bundledLutLoader';
import { closePreviewLut, type FilterStatus, type PreviewLutState } from '../../rendering/adapters/cameraLut';
import type { LutAssetLoader } from '../../rendering/assets/lutLoader';
import { createLutAlphaPlanes } from '../../rendering/reference/lutPlanes';

export function useCameraLut(settings: CameraSettings, grainSeed: number, key: string, onStatus: (status: FilterStatus) => void) {
  const cell = useMemo(() => createSynchronizable<PreviewLutState>({ closed: false }), []);
  const loader = useRef<LutAssetLoader | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    cell.lock();
    try { cell.setBlocking({ ...cell.getBlocking(), closed: false }); } finally { cell.unlock(); }
    return () => {
      try { closePreviewLut(cell); } finally { loader.current?.clearCache(); }
    };
  }, [cell]);
  useEffect(() => {
    const id = ++generation.current;
    const bypass = settings.filterId === 'original' || settings.intensity === 0;
    let cancelled = false;
    cell.lock();
    try {
      cell.setBlocking({ ...cell.getBlocking(), reportedId: undefined,
        request: { id, key, settings, grainSeed, loading: !bypass } });
    } finally { cell.unlock(); }
    onStatus({ key, phase: bypass ? 'applying' : 'loading' });
    if (!bypass) {
      void (async () => {
        try {
          loader.current ??= createBundledDraftLutLoader();
          const loaded = await loader.current.load(settings);
          if (cancelled) return;
          const planes = createLutAlphaPlanes(loaded.atlas);
          cell.lock();
          try {
            const state = cell.getBlocking();
            if (!state.closed && state.request?.id === id) {
              state.request = { id, key, settings, grainSeed, loading: false, planes, assetKey: loaded.asset.sha256 };
              cell.setBlocking(state);
            }
          } finally { cell.unlock(); }
          onStatus({ key, phase: 'applying' });
        } catch {
          if (cancelled) return;
          const message = '필터를 불러오지 못해 원본으로 보여드려요. 다시 선택하거나 원본으로 촬영해 주세요.';
          cell.lock();
          try {
            const state = cell.getBlocking();
            if (!state.closed && state.request?.id === id) {
              state.request = { id, key, settings, grainSeed, loading: false, error: message };
              cell.setBlocking(state);
            }
          } finally { cell.unlock(); }
          onStatus({ key, phase: 'error', message });
        }
      })();
    }
    return () => { cancelled = true; };
  }, [cell, settings, grainSeed, key, onStatus]);
  return cell;
}
