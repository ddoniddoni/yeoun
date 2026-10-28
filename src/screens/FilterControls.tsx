import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CAMERA_FILTERS, type CameraFilterId, type CameraSettings } from '../domain/filters/cameraSettings';
import { CameraAction } from './CameraControls';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';

export function FilterControls({ settings, disabled, onSelect, onIntensity, onTexture, onReset }: {
  settings: CameraSettings; disabled: boolean;
  onSelect(id: CameraFilterId): void; onIntensity(value: number): void;
  onTexture(control: 'grain' | 'bloom', value: number): void; onReset(): void;
}) {
  const [adjusting, setAdjusting] = useState(false);
  const percent = Math.round(settings.intensity * 100);
  const original = settings.filterId === 'original';
  const selected = CAMERA_FILTERS.find(filter => filter.id === settings.filterId);
  const accent = filterPresentation[settings.filterId].color;
  return <View style={styles.controls}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      {CAMERA_FILTERS.map(filter => {
        const active = settings.filterId === filter.id;
        const presentation = filterPresentation[filter.id];
        return <Pressable key={filter.id} accessibilityRole="tab"
          accessibilityLabel={filter.id === 'original' ? '원본' : `${presentation.collection} 컬렉션, ${filter.name}`}
          accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={() => onSelect(filter.id)}
          style={({ pressed }) => [styles.tab, active && { borderBottomColor: presentation.color },
            pressed && styles.pressed, disabled && styles.disabled]}>
          <Text style={[styles.tabText, active && styles.activeText]}>{presentation.collection}</Text>
        </Pressable>;
      })}
    </ScrollView>
    <View style={styles.selection}>
      <View style={styles.description}>
        <View style={styles.nameRow}><View style={[styles.dot, { backgroundColor: accent }]} />
          <Text accessibilityRole="header" style={styles.name}>{selected?.name}</Text>
          {!original ? <Text style={[styles.percent, { color: accent }]}>{percent}%</Text> : null}
        </View>
        <Text style={styles.caption}>{!original && percent === 0 ? '강도 0% · 원본 색감으로 촬영해요' : selected?.caption}</Text>
      </View>
      {!original ? <Pressable accessibilityRole="button" accessibilityLabel="필터 강도, 입자, 빛 번짐 조절"
        accessibilityState={{ expanded: adjusting }} onPress={() => setAdjusting(value => !value)}
        style={({ pressed }) => [styles.adjustButton, pressed && styles.pressed]}>
        <Text style={styles.adjustText}>{adjusting ? '닫기 −' : '조절 +'}</Text>
      </Pressable> : null}
    </View>
    {adjusting && !original ? <View style={styles.adjustment}>
      <EffectAmount label="필터 강도" value={settings.intensity} disabled={disabled} accent={accent} onChange={onIntensity} />
      <EffectAmount label="입자" value={settings.grain} disabled={disabled} accent={accent} onChange={value => onTexture('grain', value)} />
      <EffectAmount label="빛 번짐" value={settings.bloom} disabled={disabled} accent={accent} onChange={value => onTexture('bloom', value)} />
      {percent === 0 ? <Text style={styles.caption}>강도가 0%라 입자와 빛 번짐도 보이지 않아요. 조절값은 유지돼요.</Text> : null}
      <CameraAction label="필터 기본값으로 초기화" disabled={disabled} onPress={onReset} />
    </View> : null}
  </View>;
}

function EffectAmount({ label, value, disabled, accent, onChange }: {
  label: string; value: number; disabled: boolean; accent: string; onChange(value: number): void;
}) {
  const percent = Math.round(value * 100);
  const change = (delta: number) => {
    if (!disabled) onChange(Math.max(0, Math.min(100, percent + delta)) / 100);
  };
  return <View style={styles.amount}>
    <View accessible accessibilityRole="adjustable" accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }} accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment', label: '10% 높이기' }, { name: 'decrement', label: '10% 낮추기' }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'increment') change(10);
        if (event.nativeEvent.actionName === 'decrement') change(-10);
      }} style={styles.meter}>
      <View style={styles.nameRow}><Text style={styles.caption}>{label}</Text><Text style={[styles.value, { color: accent }]}>{percent}%</Text></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: accent }]} /></View>
    </View>
    <View style={styles.stepControls}>
      <CameraAction label="− 10%" accessibilityLabel={`${label} 10% 낮추기`} disabled={disabled || percent === 0} onPress={() => change(-10)} />
      <CameraAction label="+ 10%" accessibilityLabel={`${label} 10% 높이기`} disabled={disabled || percent === 100} onPress={() => change(10)} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  controls: { gap: 16 }, tabs: { flexGrow: 1, gap: 28, borderBottomWidth: 1, borderBottomColor: theme.line },
  tab: { minWidth: 48, minHeight: 48, paddingVertical: 12, borderBottomWidth: 2,
    borderBottomColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tabText: { color: theme.secondary, fontSize: 16 }, activeText: { color: theme.text, fontWeight: '600' },
  selection: { flexDirection: 'row', alignItems: 'center', gap: 12 }, description: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  name: { color: theme.text, fontSize: 22, fontWeight: '500', flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 }, percent: { fontFamily: theme.mono, fontSize: 14 },
  caption: { color: theme.secondary, fontSize: 13, lineHeight: 20 },
  adjustButton: { minHeight: 48, minWidth: 64, padding: 12, borderWidth: 1,
    borderColor: theme.line, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  adjustText: { color: theme.text, fontSize: 14 },
  adjustment: { padding: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.inset, borderRadius: 6, gap: 16 },
  amount: { gap: 12 }, meter: { gap: 8 }, value: { fontFamily: theme.mono, fontSize: 24 },
  track: { height: 3, backgroundColor: theme.line }, fill: { height: 3 },
  stepControls: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
});
