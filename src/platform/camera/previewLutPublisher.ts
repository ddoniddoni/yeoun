import type { FilterStatus, PreviewLutRequest } from '../../rendering/adapters/cameraLut';
import type { LoadedLut, LutSelection } from '../../rendering/assets/lutLoader';
import { createLutAlphaPlanes } from '../../rendering/reference/lutPlanes';

type Selection = Pick<PreviewLutRequest, 'key' | 'settings' | 'grainSeed' | 'stampDate'>;
type PreparedLut = Required<Pick<PreviewLutRequest, 'assetKey' | 'planes'>>;
const MAX_PREPARED_LOOKS = 3;

/** RN-only preparation. Publish complete requests atomically; never read camera state back.
 * While loading, the renderer continues drawing live frames with the last published look.
 * The current selection remains non-ready until the camera acknowledges its own request key.
 */
export function createPreviewLutPublisher(ports: {
  load(selection: LutSelection): Promise<LoadedLut>;
  publish(request: PreviewLutRequest): void;
  status(status: FilterStatus): void;
  reportError(error: unknown): void;
}) {
  let generation = 0;
  // Only immutable LUT planes, never frame pixels or GPU objects (~397 KB maximum).
  const prepared = new Map<string, PreparedLut>();
  return {
    select(selection: Selection): () => void {
      const id = ++generation;
      const request = { ...selection, id, loading: false };
      const { settings, key } = selection;
      const cancel = () => { if (generation === id) generation += 1; };
      const publish = (lut?: PreparedLut) => {
        ports.publish({ ...request, ...lut });
        ports.status({ key, phase: 'applying' });
      };
      if (settings.filterId === 'original' || settings.intensity === 0) {
        publish(); return cancel;
      }
      const assetId = `${settings.engineVersion}/${settings.lookVersion}/${settings.filterId}`;
      const cached = prepared.get(assetId);
      if (cached) {
        prepared.delete(assetId); prepared.set(assetId, cached);
        publish(cached); return cancel;
      }
      // Do not replace the live request with an unfiltered "loading" request.
      ports.status({ key, phase: 'loading' });
      void (async () => {
        try {
          const loaded = await ports.load(settings);
          if (generation !== id) return;
          const channels = createLutAlphaPlanes(loaded.atlas);
          const lut: PreparedLut = { assetKey: loaded.asset.sha256, planes: [
            Uint8Array.from(channels[0]).buffer, Uint8Array.from(channels[1]).buffer, Uint8Array.from(channels[2]).buffer,
          ] };
          prepared.set(assetId, lut);
          if (prepared.size > MAX_PREPARED_LOOKS) prepared.delete(prepared.keys().next().value!);
          publish(lut);
        } catch (error) {
          if (generation !== id) return;
          ports.reportError(error);
          const message = '필터를 불러오지 못해 원본으로 보여드려요. 다시 선택하거나 원본으로 촬영해 주세요.';
          ports.publish({ ...request, error: message });
          ports.status({ key, phase: 'error', message });
        }
      })();
      return cancel;
    },
    clear() { generation += 1; prepared.clear(); },
  };
}
