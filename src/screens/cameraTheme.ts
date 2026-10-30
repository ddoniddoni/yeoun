import { Platform } from 'react-native';
import type { CameraFilterId } from '../domain/filters/cameraSettings';

// A bright paper shell. Photo overlays have separate tokens so changing the
// interface never turns camera guides dark or adds a tint to image pixels.
export const cameraTheme = {
  background: '#FFF9F3', surface: '#FFFFFF', inset: '#F8EEE6',
  text: '#302A28', secondary: '#776963', line: '#E6D8CE',
  accent: '#B84435', accentSoft: '#FCE5DC', onAccent: '#FFFFFF',
  shutter: '#EB816D', error: '#AC343D',
  photoMatte: '#191919', onPhoto: '#FFFFFF', photoOverlay: 'rgba(20,20,20,0.72)',
  focus: '#FFE0A3', scrim: 'rgba(36,28,24,0.32)',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

// Ink is for text/checkmarks; wash is for soft selection backgrounds.
export const filterPresentation: Record<CameraFilterId, { collection: string; color: string; wash: string }> = {
  original: { collection: '원본', color: '#6C6965', wash: '#F0EEEA' },
  'light-afternoon': { collection: '빛', color: '#916020', wash: '#FFF0D2' },
  'light-milk': { collection: '인물', color: '#756051', wash: '#F5EEE3' },
  'light-spring': { collection: '인물', color: '#A5486A', wash: '#FBE6ED' },
  'portrait-clear': { collection: '인물', color: '#4B6D80', wash: '#E5F1F6' },
  'portrait-peach': { collection: '인물', color: '#AA4E40', wash: '#FCE7DE' },
  'food-table': { collection: '푸드', color: '#7D6420', wash: '#F7F0D2' },
  'food-cafe': { collection: '푸드', color: '#875A3D', wash: '#F6E8DA' },
  'time-diary': { collection: '레트로', color: '#626B41', wash: '#EDF0DD' },
  'time-night': { collection: '야간', color: '#8E632F', wash: '#F7EAD8' },
  'scene-rain': { collection: '장면', color: '#356D67', wash: '#E1F1EB' },
  'scene-ending': { collection: '장면', color: '#536D68', wash: '#E7EFEB' },
  'time-summer': { collection: '시간', color: '#746628', wash: '#F7F0D0' },
  'scene-dawn': { collection: '장면', color: '#5D6595', wash: '#ECEBFA' },
  'retro-film': { collection: '필름', color: '#736235', wash: '#F4EBD4' },
  'retro-digital': { collection: '디카', color: '#566F91', wash: '#E7EEF9' },
  'retro-rose': { collection: '도시', color: '#AA496B', wash: '#FBE4EE' },
  'retro-travel': { collection: '도시', color: '#35788C', wash: '#E1F2F7' },
};
