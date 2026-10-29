import filterSeed from '../../../spec/filters.seed.json';
import type { RenderSettings } from './types';
import { NO_RETRO, RETRO_AMOUNTS, type RetroControls } from './retroControls';

export const CAMERA_RENDER_VERSION = 'lut-camera-0.3.0';
export const CAMERA_FILTERS = [
  { id: 'original', name: '원본', caption: '색감 효과 없이' },
  { id: 'light-afternoon', name: '오후 네 시', caption: '따뜻한 빛, 맑은 그림자' },
  { id: 'time-summer', name: '여름방학', caption: '햇살과 바다를 닮은 필름색' },
  { id: 'scene-dawn', name: '푸른 새벽', caption: '차분한 푸른빛과 깊은 명암' },
  { id: 'retro-film', name: '일회용 필름', caption: '진한 색, 짙은 그림자와 거친 입자' },
  { id: 'retro-digital', name: '디카 2005', caption: '깊은 명암, 차가운 흰빛의 2000년대 스냅' },
  { id: 'retro-rose', name: '로즈 데이', caption: '분홍빛 하이라이트와 청록빛 거리' },
  { id: 'retro-travel', name: '맑은 여행', caption: '맑은 하늘색, 가벼운 햇빛과 부드러운 명암' },
] as const;
export type CameraFilterId = typeof CAMERA_FILTERS[number]['id'];
export const CAMERA_COLLECTIONS: readonly { name: string; ids: readonly CameraFilterId[] }[] = [
  { name: '원본', ids: ['original'] }, { name: '빛', ids: ['light-afternoon'] },
  { name: '시간', ids: ['time-summer'] }, { name: '장면', ids: ['scene-dawn'] },
  { name: '필름', ids: ['retro-film'] }, { name: '디카', ids: ['retro-digital'] },
  { name: '도시', ids: ['retro-rose', 'retro-travel'] },
];
export type CameraSettings = RenderSettings & RetroControls & Readonly<{
  filterId: CameraFilterId;
  rendererVersion: typeof CAMERA_RENDER_VERSION;
}>;

export function copyCameraSettings(input: CameraSettings): CameraSettings {
  const expectedVersion = input.filterId === 'original' ? '0.1.0-draft'
    : filterSeed.filters.find(filter => filter.id === input.filterId)?.lookVersion;
  if (!CAMERA_FILTERS.some(filter => filter.id === input.filterId) ||
      input.lookVersion !== expectedVersion || input.engineVersion !== 'lut-authoring-0.1.0' ||
      input.rendererVersion !== CAMERA_RENDER_VERSION) throw new Error('지원하지 않는 필터 버전이에요.');
  if (!Number.isFinite(input.intensity) || input.intensity < 0 || input.intensity > 1) {
    throw new Error('필터 강도는 0~100%여야 해요.');
  }
  for (const value of [input.grain, input.bloom]) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('입자와 빛 번짐은 0~100%여야 해요.');
  }
  for (const control of RETRO_AMOUNTS) {
    const value = input[control];
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('질감 효과는 0~100%여야 해요.');
  }
  if (typeof input.dateStamp !== 'boolean') throw new Error('날짜 도장 설정이 올바르지 않아요.');
  const retro: RetroControls = input.filterId === 'original' ? NO_RETRO : {
    vignette: input.vignette, halation: input.halation, sharpness: input.sharpness,
    digitalNoise: input.digitalNoise, lightLeak: input.lightLeak, dust: input.dust, dateStamp: input.dateStamp,
  };
  return Object.freeze({ filterId: input.filterId, lookVersion: input.lookVersion,
    engineVersion: input.engineVersion, rendererVersion: input.rendererVersion,
    ...retro, intensity: input.filterId === 'original' ? 0 : input.intensity,
    grain: input.filterId === 'original' ? 0 : input.grain, bloom: input.filterId === 'original' ? 0 : input.bloom });
}

export function cameraSettings(filterId: CameraFilterId, intensity?: number): CameraSettings {
  const filter = filterSeed.filters.find(filter => filter.id === filterId);
  const defaults = filter?.defaults;
  return copyCameraSettings({ ...NO_RETRO, ...defaults, filterId, intensity: intensity ?? defaults?.intensity ?? 0.8,
    grain: defaults?.grain ?? 0, bloom: defaults?.bloom ?? 0,
    lookVersion: filter?.lookVersion ?? '0.1.0-draft', engineVersion: 'lut-authoring-0.1.0', rendererVersion: CAMERA_RENDER_VERSION });
}

export function cameraSettingsKey(settings: CameraSettings): string {
  return `${settings.rendererVersion}/${settings.engineVersion}/${settings.lookVersion}/${settings.filterId}/${settings.intensity}/${settings.grain}/${settings.bloom}/${RETRO_AMOUNTS.map(control => settings[control]).join('/')}/${settings.dateStamp}`;
}
