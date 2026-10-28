import type { RenderSettings } from './types';

export const CAMERA_RENDER_VERSION = 'lut-camera-0.1.0';
export const CAMERA_FILTERS = [
  { id: 'original', name: '원본', caption: '색감 효과 없이' },
  { id: 'light-afternoon', name: '오후 네 시', caption: '따뜻한 빛, 맑은 그림자' },
  { id: 'time-summer', name: '여름방학', caption: '햇살과 바다를 닮은 필름색' },
  { id: 'scene-dawn', name: '푸른 새벽', caption: '차분한 푸른빛과 깊은 명암' },
] as const;
export type CameraFilterId = typeof CAMERA_FILTERS[number]['id'];
export type CameraSettings = RenderSettings & Readonly<{
  filterId: CameraFilterId;
  rendererVersion: typeof CAMERA_RENDER_VERSION;
}>;

export function copyCameraSettings(input: CameraSettings): CameraSettings {
  if (!CAMERA_FILTERS.some(filter => filter.id === input.filterId) ||
      input.lookVersion !== '0.1.0-draft' || input.engineVersion !== 'lut-authoring-0.1.0' ||
      input.rendererVersion !== CAMERA_RENDER_VERSION) throw new Error('지원하지 않는 필터 버전이에요.');
  if (!Number.isFinite(input.intensity) || input.intensity < 0 || input.intensity > 1) {
    throw new Error('필터 강도는 0~100%여야 해요.');
  }
  // Spatial effects are a later M1 slice; never silently drop requested effects.
  if (input.grain !== 0 || input.bloom !== 0) throw new Error('입자와 빛 번짐은 아직 지원하지 않아요.');
  return Object.freeze({ filterId: input.filterId, lookVersion: input.lookVersion,
    engineVersion: input.engineVersion, rendererVersion: input.rendererVersion,
    intensity: input.filterId === 'original' ? 0 : input.intensity, grain: 0, bloom: 0 });
}

export function cameraSettings(filterId: CameraFilterId, intensity = 0.8): CameraSettings {
  return copyCameraSettings({ filterId, intensity, grain: 0, bloom: 0,
    lookVersion: '0.1.0-draft', engineVersion: 'lut-authoring-0.1.0', rendererVersion: CAMERA_RENDER_VERSION });
}

export function cameraSettingsKey(settings: CameraSettings): string {
  return `${settings.rendererVersion}/${settings.engineVersion}/${settings.lookVersion}/${settings.filterId}/${settings.intensity}`;
}
