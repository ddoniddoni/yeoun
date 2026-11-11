import { memo } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import type { CameraFilterId } from '../domain/filters/cameraSettings';

// Bundled illustrations identify the look; they are not filtered photo previews.
// Literal sources let Metro include every icon without SVG/Canvas work at runtime.
const ARTWORK: Record<CameraFilterId, ImageSourcePropType> = {
  original: require('../../assets/filter-icons/original.png'),
  'light-afternoon': require('../../assets/filter-icons/light-afternoon.png'),
  'light-milk': require('../../assets/filter-icons/light-milk.png'),
  'light-spring': require('../../assets/filter-icons/light-spring.png'),
  'portrait-clear': require('../../assets/filter-icons/portrait-clear.png'),
  'portrait-peach': require('../../assets/filter-icons/portrait-peach.png'),
  'food-table': require('../../assets/filter-icons/food-table.png'),
  'food-cafe': require('../../assets/filter-icons/food-cafe.png'),
  'time-summer': require('../../assets/filter-icons/time-summer.png'),
  'retro-travel': require('../../assets/filter-icons/retro-travel.png'),
  'retro-rose': require('../../assets/filter-icons/retro-rose.png'),
  'time-diary': require('../../assets/filter-icons/time-diary.png'),
  'retro-film': require('../../assets/filter-icons/retro-film.png'),
  'retro-digital': require('../../assets/filter-icons/retro-digital.png'),
  'scene-dawn': require('../../assets/filter-icons/scene-dawn.png'),
  'scene-rain': require('../../assets/filter-icons/scene-rain.png'),
  'time-night': require('../../assets/filter-icons/time-night.png'),
  'scene-ending': require('../../assets/filter-icons/scene-ending.png'),
};

export const FilterSwatch = memo(function FilterSwatch({ id, size = 44 }: { id: CameraFilterId; size?: number }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={styles.art}>
    <Image source={ARTWORK[id]} resizeMode="contain" fadeDuration={0} style={{ width: size, height: size }} accessible={false} />
  </View>;
});
const styles = StyleSheet.create({
  art: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
});
