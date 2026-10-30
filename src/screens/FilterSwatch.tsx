import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CameraFilterId } from '../domain/filters/cameraSettings';
import { CameraIcon, type CameraIconName } from './CameraIcon';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';

// Palette artwork identifies the look; it is not a rendered photo thumbnail.
const PALETTES: Record<CameraFilterId, { sky: string; light: string; land: string; icon: CameraIconName }> = {
  original: { sky: '#E6E5DF', light: '#FFFFFF', land: '#A4B6AB', icon: 'compare' },
  'light-afternoon': { sky: '#F6C781', light: '#FFF2BA', land: '#D69B65', icon: 'sun' },
  'light-milk': { sky: '#E8EEE5', light: '#FFFAE8', land: '#B7CEC0', icon: 'sun' },
  'light-spring': { sky: '#F3C8D5', light: '#FFE7EA', land: '#A6C6A4', icon: 'sun' },
  'portrait-clear': { sky: '#CBE6EE', light: '#FFF3E7', land: '#98C4CD', icon: 'focus' },
  'portrait-peach': { sky: '#F6C7AF', light: '#FFF0D9', land: '#D7A09C', icon: 'softness' },
  'food-table': { sky: '#E2E9B1', light: '#FFF2BE', land: '#E8AC78', icon: 'sun' },
  'food-cafe': { sky: '#EAC9A7', light: '#FFF0D9', land: '#BA916D', icon: 'bloom' },
  'time-diary': { sky: '#D8DDBC', light: '#FBEDC9', land: '#A7B18A', icon: 'film' },
  'time-night': { sky: '#929EBE', light: '#FFE1A6', land: '#657597', icon: 'film' },
  'scene-rain': { sky: '#B7DAD4', light: '#EAF0CC', land: '#7CB6AC', icon: 'city' },
  'scene-ending': { sky: '#B7CBC5', light: '#F5D6B2', land: '#80A59E', icon: 'scene' },
  'time-summer': { sky: '#ADE1DD', light: '#FFE899', land: '#A4BD78', icon: 'clock' },
  'scene-dawn': { sky: '#B8C7EC', light: '#F3DDF0', land: '#929ECE', icon: 'scene' },
  'retro-film': { sky: '#CDD1A0', light: '#FFE2A6', land: '#97A36E', icon: 'film' },
  'retro-digital': { sky: '#D3DDF6', light: '#FFF1EC', land: '#A4B5DA', icon: 'camera' },
  'retro-rose': { sky: '#F4BAD1', light: '#FFE3DA', land: '#A0CABB', icon: 'city' },
  'retro-travel': { sky: '#ADE0EF', light: '#FFF5C7', land: '#88BFCF', icon: 'scene' },
};
export const FilterSwatch = memo(function FilterSwatch({ id }: { id: CameraFilterId }) {
  const palette = PALETTES[id];
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.art, { backgroundColor: palette.sky }]}>
    <View style={[styles.light, { backgroundColor: palette.light }]} />
    <View style={[styles.land, { backgroundColor: palette.land }]} />
    <View style={styles.mark}><CameraIcon name={palette.icon} size={16} color={filterPresentation[id].color} /></View>
    {id === 'retro-film' ? <View style={styles.perforations}>
      {[0, 1, 2, 3, 4].map(index => <View key={index} style={styles.perforation} />)}
    </View> : null}
  </View>;
});
const styles = StyleSheet.create({
  art: { flex: 1, overflow: 'hidden', borderRadius: 10 },
  light: { position: 'absolute', width: 38, height: 38, borderRadius: 19, top: -7, right: -5 },
  land: { position: 'absolute', width: 92, height: 68, borderRadius: 30, bottom: -44, left: -14, transform: [{ rotate: '-18deg' }] },
  mark: { position: 'absolute', bottom: 5, left: 5, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
  perforations: { position: 'absolute', right: 4, top: 5, bottom: 5, justifyContent: 'space-between' },
  perforation: { width: 3, height: 4, borderRadius: 1, backgroundColor: filterPresentation['retro-film'].color },
});
