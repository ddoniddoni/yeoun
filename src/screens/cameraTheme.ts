import { Platform } from 'react-native';
import type { CameraFilterId } from '../domain/filters/cameraSettings';

// Photo overlays and the small illustrated paper cards keep their own colors.
// Theme changes never tint photo pixels or turn camera guides dark.
const shared = {
  photoMatte: '#191919', onPhoto: '#FFFFFF', photoOverlay: 'rgba(20,20,20,0.72)',
  focus: '#FFE0A3', shutter: '#EB816D', onShutter: '#302A28',
  paper: '#FFFFFF', paperLine: '#E6D8CE', paperAccent: '#B84435', onPaperAccent: '#FFFFFF',
  controlRadius: 12, panelRadius: 24,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

// Ink is for text/checkmarks; wash is for soft selection backgrounds.
const lightFilters: Record<CameraFilterId, { collection: string; color: string; wash: string }> = {
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

const darkColors: Record<CameraFilterId, { color: string; wash: string }> = {
  original: { color: '#D2CBC2', wash: '#363330' },
  'light-afternoon': { color: '#E9BF83', wash: '#3C3022' },
  'light-milk': { color: '#DCC9B5', wash: '#383129' },
  'light-spring': { color: '#E6A6BC', wash: '#3B2832' },
  'portrait-clear': { color: '#A6D0E2', wash: '#25343D' },
  'portrait-peach': { color: '#F0B19D', wash: '#3E2B25' },
  'food-table': { color: '#DDC482', wash: '#393222' },
  'food-cafe': { color: '#D8B08D', wash: '#3B2E25' },
  'time-diary': { color: '#C2CA98', wash: '#303425' },
  'time-night': { color: '#E5BC84', wash: '#3D3022' },
  'scene-rain': { color: '#9BCDC1', wash: '#233630' },
  'scene-ending': { color: '#B3CBC1', wash: '#2A3530' },
  'time-summer': { color: '#DDCE91', wash: '#383322' },
  'scene-dawn': { color: '#B6BFEA', wash: '#2E3042' },
  'retro-film': { color: '#D7C38E', wash: '#393223' },
  'retro-digital': { color: '#ADC5E7', wash: '#283341' },
  'retro-rose': { color: '#E8ADC4', wash: '#3E2933' },
  'retro-travel': { color: '#9BD0DE', wash: '#243740' },
};
const darkFilters = Object.fromEntries(Object.entries(lightFilters).map(([id, value]) => [id,
  { ...value, ...darkColors[id as CameraFilterId] },
])) as typeof lightFilters;

export const lightTheme = {
  ...shared, dark: false,
  background: '#FFF9F3', surface: '#FFFFFF', inset: '#F8EEE6',
  text: '#302A28', secondary: '#776963', line: '#E6D8CE',
  accent: '#B84435', accentSoft: '#FCE5DC', onAccent: '#FFFFFF',
  error: '#AC343D', scrim: 'rgba(36,28,24,0.32)', filters: lightFilters,
};
export type CameraTheme = typeof lightTheme;
export const darkTheme: CameraTheme = {
  ...shared, dark: true,
  background: '#1B1918', surface: '#272321', inset: '#332C29',
  text: '#F4EBE2', secondary: '#BEB0A5', line: '#4D413A',
  accent: '#F2A08C', accentSoft: '#482D27', onAccent: '#2D1B16',
  error: '#FFADA9', scrim: 'rgba(0,0,0,0.62)', filters: darkFilters,
};
