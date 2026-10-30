import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { localStampDate } from '../../domain/filters/retroControls';
import { createSynchronizable } from 'react-native-worklets';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { createBundledDraftLutLoader } from '../../rendering/adapters/bundledLutLoader';
import { closePreviewLut, type FilterStatus, type PreviewLutCell, type PreviewLutRequest, type PreviewLutState } from '../../rendering/adapters/cameraLut';
import type { LutAssetLoader } from '../../rendering/assets/lutLoader';
import { createPreviewLutPublisher } from './previewLutPublisher';

export function useCameraLut(settings: CameraSettings, grainSeed: number, key: string, onStatus: (status: FilterStatus) => void) {
  const cell = useMemo<PreviewLutCell>(() => ({
    request: createSynchronizable<PreviewLutRequest | undefined>(undefined),
    state: createSynchronizable<PreviewLutState>({ closed: false }),
  }), []);
  const loader = useRef<LutAssetLoader | null>(null);
  const publisher = useMemo(() => createPreviewLutPublisher({
    load(selection) {
      loader.current ??= createBundledDraftLutLoader();
      return loader.current.load(selection);
    },
    publish: request => cell.request.setBlocking(request),
    status: onStatus,
    reportError: error => { if (__DEV__) console.warn('[camera-lut-load]', String(error)); },
  }), [cell, onStatus]);
  const [stampDate, setStampDate] = useState(localStampDate);
  useEffect(() => {
    if (!settings.dateStamp) return;
    const refresh = () => setStampDate(localStampDate());
    refresh();
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [settings.dateStamp]);
  useEffect(() => {
    cell.state.lock();
    // Cleanup disposed the previous session; its acknowledged/failed IDs must not survive a reopen.
    try { cell.state.setBlocking({ closed: false }); } finally { cell.state.unlock(); }
    return () => {
      publisher.clear();
      try { closePreviewLut(cell); } finally { loader.current?.clearCache(); }
    };
  }, [cell, publisher]);
  useEffect(() => publisher.select({ key, settings, grainSeed, stampDate }),
    [publisher, settings, grainSeed, stampDate, key]);
  return cell;
}
