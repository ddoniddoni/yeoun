import { memo } from 'react';
import { Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import type { CameraFilterId } from '../domain/filters/cameraSettings';

// One bundled example rendered through each look at its default strength, never a camera frame.
const PREVIEWS: Record<CameraFilterId, ImageSourcePropType> = {
  'original': require('../../assets/filter-previews/original.png'),
  'light-afternoon': require('../../assets/filter-previews/light-afternoon.png'),
  'light-milk': require('../../assets/filter-previews/light-milk.png'),
  'light-spring': require('../../assets/filter-previews/light-spring.png'),
  'time-summer': require('../../assets/filter-previews/time-summer.png'),
  'time-diary': require('../../assets/filter-previews/time-diary.png'),
  'time-night': require('../../assets/filter-previews/time-night.png'),
  'scene-dawn': require('../../assets/filter-previews/scene-dawn.png'),
  'scene-rain': require('../../assets/filter-previews/scene-rain.png'),
  'scene-ending': require('../../assets/filter-previews/scene-ending.png'),
  'retro-film': require('../../assets/filter-previews/retro-film.png'),
  'retro-digital': require('../../assets/filter-previews/retro-digital.png'),
  'retro-rose': require('../../assets/filter-previews/retro-rose.png'),
  'retro-travel': require('../../assets/filter-previews/retro-travel.png'),
  'portrait-clear': require('../../assets/filter-previews/portrait-clear.png'),
  'portrait-peach': require('../../assets/filter-previews/portrait-peach.png'),
  'food-table': require('../../assets/filter-previews/food-table.png'),
  'food-cafe': require('../../assets/filter-previews/food-cafe.png'),
};
export const FilterThumbnail = memo(function FilterThumbnail({ id }: { id: CameraFilterId }) {
  return <Image source={PREVIEWS[id]} resizeMode="cover" fadeDuration={0} style={styles.photo}
    accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
});
const styles = StyleSheet.create({ photo: { width: '100%', height: '100%', borderRadius: 4 } });
