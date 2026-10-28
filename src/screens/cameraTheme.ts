import { Platform } from 'react-native';
import type { CameraFilterId } from '../domain/filters/cameraSettings';

// Stitch's matte palette, with system fonts for Korean and Dynamic Type.
export const cameraTheme = {
  background: '#171717', surface: '#242424', inset: '#1F1F1F',
  text: '#F4F1EA', secondary: '#BDB8B0', line: '#383838',
  light: '#E7CFAE', time: '#B49B7A', scene: '#8D9EAD', error: '#F3A5A5',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const filterPresentation: Record<CameraFilterId, { collection: string; color: string }> = {
  original: { collection: '원본', color: cameraTheme.secondary },
  'light-afternoon': { collection: '빛', color: cameraTheme.light },
  'time-summer': { collection: '시간', color: cameraTheme.time },
  'scene-dawn': { collection: '장면', color: cameraTheme.scene },
};
