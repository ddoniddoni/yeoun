import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { cameraTheme as theme } from './cameraTheme';

type Line = readonly [number, number, number, number];
type Box = readonly [number, number, number, number, number];
type Glyph = { lines?: readonly Line[]; boxes?: readonly Box[]; dots?: readonly (readonly [number, number, number])[]; fills?: readonly Box[] };
function outline(points: readonly (readonly [number, number])[], closed = false): Line[] {
  return points.slice(0, closed ? points.length : -1).map((point, index): Line => {
    const next = points[(index + 1) % points.length]!;
    return [point[0], point[1], next[0], next[1]];
  });
}
const gear = outline(Array.from({ length: 32 }, (_, index): [number, number] => {
  const angle = index * Math.PI / 16;
  const radius = index % 4 === 1 || index % 4 === 2 ? 10 : 8;
  return [12 + Math.cos(angle) * radius, 12 + Math.sin(angle) * radius];
}), true);
const resetArc = outline(Array.from({ length: 25 }, (_, index): [number, number] => {
  const angle = (-150 + index * 285 / 24) * Math.PI / 180;
  return [12 + Math.cos(angle) * 8, 12 + Math.sin(angle) * 8];
}));
// Original 24pt line glyphs. Native views only: no font download or GPU canvas.
const GLYPHS = {
  album: { boxes: [[3, 3, 18, 18, 4]], dots: [[8, 8, 1.5]], lines: [[4, 18, 10, 12], [10, 12, 14, 16], [14, 16, 17, 12], [17, 12, 21, 16]] },
  star: { lines: outline([[12, 2], [15, 8.5], [22, 9.5], [17, 14.5], [18.2, 22],
    [12, 18.5], [5.8, 22], [7, 14.5], [2, 9.5], [9, 8.5]], true) },
  favorites: { lines: [...outline([[8, 3], [10, 7], [14, 7.6], [11, 10.5], [11.7, 15],
    [8, 12.9], [4.3, 15], [5, 10.5], [2, 7.6], [6, 7]], true), [17, 6, 22, 6], [17, 12, 22, 12], [3, 20, 22, 20]] },
  settings: { lines: gear, boxes: [[9, 9, 6, 6, 3]] },
  close: { lines: [[6, 6, 18, 18], [18, 6, 6, 18]] },
  plus: { lines: [[5, 12, 19, 12], [12, 5, 12, 19]] },
  minus: { lines: [[5, 12, 19, 12]] },
  check: { lines: [[5, 12, 10, 17], [10, 17, 20, 6]] },
  back: { lines: [[14, 5, 7, 12], [7, 12, 14, 19]] },
  down: { lines: [[6, 9, 12, 15], [12, 15, 18, 9]] },
  up: { lines: [[6, 15, 12, 9], [12, 9, 18, 15]] },
  flash: { lines: [[14, 2, 5, 13], [5, 13, 11, 13], [11, 13, 10, 22], [10, 22, 19, 10], [19, 10, 13, 10], [13, 10, 14, 2]] },
  flashOff: { lines: [[3, 3, 21, 21], [14, 2, 10, 7], [5, 13, 11, 13], [11, 13, 10, 22], [10, 22, 15, 16], [19, 10, 13, 10], [13, 10, 14, 2]] },
  sliders: { lines: [[4, 6, 20, 6], [4, 12, 20, 12], [4, 18, 20, 18]], boxes: [[7, 3, 3, 6, 1], [14, 9, 3, 6, 1], [8, 15, 3, 6, 1]] },
  compare: { boxes: [[3, 3, 18, 18, 4]], lines: [[12, 3, 12, 21]], fills: [[6, 6, 4, 12, 1]] },
  flip: { lines: [[4, 9, 4, 5], [4, 5, 16, 5], [16, 5, 20, 9], [20, 9, 20, 4], [20, 9, 15, 9], [20, 15, 20, 19], [20, 19, 8, 19], [8, 19, 4, 15], [4, 15, 4, 20], [4, 15, 9, 15]] },
  reset: { lines: [...resetArc, [4, 3, 4, 9], [4, 9, 10, 9]] },
  camera: { boxes: [[3, 6, 18, 15, 3], [8, 10, 8, 8, 4]], lines: [[8, 6, 9, 3], [9, 3, 15, 3], [15, 3, 16, 6]] },
  download: { lines: [[12, 3, 12, 15], [7, 10, 12, 15], [12, 15, 17, 10], [4, 16, 4, 21], [4, 21, 20, 21], [20, 21, 20, 16]] },
  grid: { boxes: [[3, 3, 18, 18, 3]], lines: [[9, 3, 9, 21], [15, 3, 15, 21], [3, 9, 21, 9], [3, 15, 21, 15]] },
  sun: { boxes: [[8, 8, 8, 8, 4]], lines: [[12, 2, 12, 4], [12, 20, 12, 22], [2, 12, 4, 12], [20, 12, 22, 12], [5, 5, 6.5, 6.5], [17.5, 17.5, 19, 19], [5, 19, 6.5, 17.5], [17.5, 6.5, 19, 5]] },
  film: { boxes: [[4, 2, 16, 20, 2], [8, 7, 8, 10, 1]], dots: [[6, 5, 1], [18, 5, 1], [6, 10, 1], [18, 10, 1], [6, 15, 1], [18, 15, 1], [6, 19, 1], [18, 19, 1]] },
  clock: { boxes: [[3, 3, 18, 18, 9]], lines: [[12, 7, 12, 12], [12, 12, 16, 14]] },
  scene: { lines: [[3, 19, 21, 19], [3, 19, 9, 9], [9, 9, 15, 19], [12, 14, 16, 8], [16, 8, 21, 19]], dots: [[6, 5, 2]] },
  city: { boxes: [[4, 9, 7, 12, 1], [13, 3, 7, 18, 1]], lines: [[6.5, 12, 8.5, 12], [6.5, 16, 8.5, 16], [15.5, 7, 17.5, 7], [15.5, 11, 17.5, 11], [15.5, 15, 17.5, 15]] },
  grain: { dots: [[5, 5, 1.5], [12, 4, 1], [19, 6, 1.5], [7, 12, 1], [15, 12, 1.5], [4, 19, 1], [12, 20, 1.5], [20, 18, 1]] },
  softness: { boxes: [[6, 6, 12, 12, 6]], dots: [[3, 12, 0.7], [21, 12, 0.7], [12, 3, 0.7], [12, 21, 0.7]] },
  bloom: { boxes: [[4, 4, 16, 16, 8], [8, 8, 8, 8, 4]] },
  vignette: { boxes: [[3, 3, 18, 18, 5], [8, 8, 8, 8, 4]] },
  focus: { lines: [[3, 9, 3, 3], [3, 3, 9, 3], [15, 3, 21, 3], [21, 3, 21, 9], [21, 15, 21, 21], [21, 21, 15, 21], [9, 21, 3, 21], [3, 21, 3, 15]], boxes: [[9, 9, 6, 6, 3]] },
  calendar: { boxes: [[3, 5, 18, 16, 3]], lines: [[8, 2, 8, 7], [16, 2, 16, 7], [3, 10, 21, 10]], dots: [[8, 15, 1], [12, 15, 1], [16, 15, 1]] },
  pin: { lines: [[8, 3, 16, 3], [9, 3, 8, 10], [15, 3, 16, 10], [8, 10, 5, 14], [5, 14, 19, 14], [19, 14, 16, 10], [12, 14, 12, 22]] },
} satisfies Record<string, Glyph>;
export type CameraIconName = keyof typeof GLYPHS;

export const CameraIcon = memo(function CameraIcon({ name, size = 24, color = theme.text }: {
  name: CameraIconName; size?: number; color?: string;
}) {
  const glyph: Glyph = GLYPHS[name];
  const scale = size / 24;
  const stroke = 1.65 * scale;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: size, height: size }}>
    {glyph.lines?.map(([x1, y1, x2, y2], index) => {
      const length = Math.hypot(x2 - x1, y2 - y1) * scale + stroke;
      return <View key={`l${index}`} style={[styles.part, { width: length, height: stroke, borderRadius: stroke,
        backgroundColor: color, left: (x1 + x2) / 2 * scale - length / 2, top: (y1 + y2) / 2 * scale - stroke / 2,
        transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg` }] }]} />;
    })}
    {glyph.boxes?.map(([x, y, w, h, radius], index) => <View key={`b${index}`} style={[styles.part, {
      left: x * scale, top: y * scale, width: w * scale, height: h * scale, borderRadius: radius * scale,
      borderWidth: stroke, borderColor: color,
    }]} />)}
    {glyph.fills?.map(([x, y, w, h, radius], index) => <View key={`f${index}`} style={[styles.part, {
      left: x * scale, top: y * scale, width: w * scale, height: h * scale,
      borderRadius: radius * scale, backgroundColor: color,
    }]} />)}
    {glyph.dots?.map(([x, y, radius], index) => <View key={`d${index}`} style={[styles.part, {
      left: (x - radius) * scale, top: (y - radius) * scale, width: radius * 2 * scale,
      height: radius * 2 * scale, borderRadius: radius * scale, backgroundColor: color,
    }]} />)}
  </View>;
});
const styles = StyleSheet.create({ part: { position: 'absolute' } });
