import { Button, StyleSheet, Text, View } from 'react-native';
import { CAMERA_FILTERS, type CameraFilterId, type CameraSettings } from '../domain/filters/cameraSettings';

export function FilterControls({ settings, disabled, onSelect, onIntensity }: {
  settings: CameraSettings; disabled: boolean;
  onSelect(id: CameraFilterId): void; onIntensity(value: number): void;
}) {
  const percent = Math.round(settings.intensity * 100);
  const original = settings.filterId === 'original';
  const change = (delta: number) => {
    if (!disabled && !original) onIntensity(Math.max(0, Math.min(100, percent + delta)) / 100);
  };
  return <View style={styles.controls}>
    {CAMERA_FILTERS.map(filter => <Button key={filter.id}
      title={`${settings.filterId === filter.id ? '✓ ' : ''}${filter.name}`}
      disabled={disabled} onPress={() => onSelect(filter.id)} />)}
    <Text style={styles.text}>{CAMERA_FILTERS.find(filter => filter.id === settings.filterId)?.caption}</Text>
    <View accessible accessibilityRole="adjustable" accessibilityLabel="필터 강도"
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }}
      accessibilityState={{ disabled: disabled || original }}
      accessibilityActions={[{ name: 'increment', label: '10% 높이기' }, { name: 'decrement', label: '10% 낮추기' }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'increment') change(10);
        if (event.nativeEvent.actionName === 'decrement') change(-10);
      }}><Text style={styles.text}>필터 강도 {percent}%{!original && percent === 0 ? ' · 원본 색감' : ''}</Text></View>
    <View style={styles.row}>
      <Button title="− 10%" accessibilityLabel="필터 강도 10% 낮추기" disabled={disabled || original || percent === 0} onPress={() => change(-10)} />
      <Button title="+ 10%" accessibilityLabel="필터 강도 10% 높이기" disabled={disabled || original || percent === 100} onPress={() => change(10)} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  controls: { gap: 8 }, row: { flexDirection: 'row', justifyContent: 'space-evenly' },
  text: { color: '#F4F1EA', fontSize: 16 },
});
