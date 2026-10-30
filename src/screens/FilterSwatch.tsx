import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CameraFilterId } from '../domain/filters/cameraSettings';
import { CameraIcon, type CameraIconName } from './CameraIcon';

// Palette artwork identifies the look; it is not a rendered photo thumbnail.
const PALETTES: Record<CameraFilterId, { sky: string; light: string; land: string; icon: CameraIconName }> = {
  original: { sky: '#C3C3BB', light: '#F1F1EA', land: '#737974', icon: 'compare' },
  'light-afternoon': { sky: '#B99063', light: '#F2D2A0', land: '#72604E', icon: 'sun' },
  'light-milk': { sky: '#CFD8D6', light: '#F4EDE1', land: '#A5B1A6', icon: 'sun' },
  'light-spring': { sky: '#C8C2C0', light: '#F0CED6', land: '#879A7B', icon: 'sun' },
  'portrait-clear': { sky: '#B9CCD4', light: '#F3E6DF', land: '#7F919A', icon: 'focus' },
  'portrait-peach': { sky: '#C6B3AD', light: '#F4D2C0', land: '#9F8F87', icon: 'softness' },
  'food-table': { sky: '#B2B991', light: '#F1DCAD', land: '#BB6E51', icon: 'sun' },
  'food-cafe': { sky: '#B9A18A', light: '#EEDBC2', land: '#796957', icon: 'bloom' },
  'time-diary': { sky: '#B7B1A0', light: '#DED4BD', land: '#7E8574', icon: 'film' },
  'time-night': { sky: '#5A626D', light: '#E6BA7E', land: '#363E4B', icon: 'film' },
  'scene-rain': { sky: '#99ABA9', light: '#D8D1A8', land: '#4D736E', icon: 'city' },
  'scene-ending': { sky: '#78928F', light: '#D8B98F', land: '#3F5557', icon: 'scene' },
  'time-summer': { sky: '#89B8BB', light: '#F0DBA2', land: '#627D68', icon: 'clock' },
  'scene-dawn': { sky: '#697B99', light: '#B8C8DC', land: '#394B65', icon: 'scene' },
  'retro-film': { sky: '#8F9878', light: '#E0C297', land: '#525D4F', icon: 'film' },
  'retro-digital': { sky: '#C1C4CE', light: '#FAE8DF', land: '#919CAB', icon: 'camera' },
  'retro-rose': { sky: '#CC9BA7', light: '#F4DAD2', land: '#728A84', icon: 'city' },
  'retro-travel': { sky: '#8DBACB', light: '#EDF0D5', land: '#668B9C', icon: 'scene' },
};
export const FilterSwatch = memo(function FilterSwatch({ id }: { id: CameraFilterId }) {
  const palette = PALETTES[id];
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.art, { backgroundColor: palette.sky }]}>
    <View style={[styles.light, { backgroundColor: palette.light }]} />
    <View style={[styles.land, { backgroundColor: palette.land }]} />
    <View style={styles.mark}><CameraIcon name={palette.icon} size={18} color="#FFFFFF" /></View>
    {id === 'retro-film' ? <View style={styles.perforations}>
      {[0, 1, 2, 3, 4].map(index => <View key={index} style={styles.perforation} />)}
    </View> : null}
  </View>;
});
const styles = StyleSheet.create({
  art: { flex: 1, overflow: 'hidden', borderRadius: 9 },
  light: { position: 'absolute', width: 54, height: 54, borderRadius: 27, top: -17, right: -12, opacity: 0.9 },
  land: { position: 'absolute', width: 92, height: 68, borderRadius: 30, bottom: -44, left: -14, transform: [{ rotate: '-18deg' }] },
  mark: { position: 'absolute', bottom: 6, left: 7 },
  perforations: { position: 'absolute', right: 4, top: 5, bottom: 5, justifyContent: 'space-between' },
  perforation: { width: 3, height: 4, borderRadius: 1, backgroundColor: '#242724' },
});
