import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MeteringState } from '../domain/capture/meteringSession';
import { CameraAction } from './CameraControls';
import { cameraTheme as theme } from './cameraTheme';

export function CameraMeteringControls({ state, disabled, onFocusCenter, onExposure, onReconnect }: {
  state: MeteringState; disabled: boolean; onFocusCenter(): void; onExposure(value: number): void; onReconnect(): void;
}) {
  const locked = disabled || state.busy || !state.ready;
  const step = state.unit === 'step' ? 1 : 0.5;
  const value = state.exposure;
  const unit = state.unit === 'step' ? '단계' : 'EV';
  const number = value === undefined ? '—' : `${value > 0 ? '+' : ''}${state.unit === 'step' ? value : value.toFixed(1)}`;
  const lowerDisabled = locked || value === undefined || !state.range || value <= state.range.min;
  const upperDisabled = locked || value === undefined || !state.range || value >= state.range.max;
  return <View style={styles.group}>
    <View style={styles.row}>
      <CameraAction label="중앙 초점" disabled={locked || !state.focusSupported} onPress={onFocusCenter} />
      <Text style={styles.note}>{state.ready && !state.focusSupported ? '이 카메라는 탭 초점을 지원하지 않아요.' : '화면을 눌러 초점을 맞춰 보세요.'}</Text>
    </View>
    {state.range ? <>
      <View style={styles.row}>
        <Text accessibilityLiveRegion="polite" style={styles.value}>노출 {number} {unit}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`노출 ${step} ${unit} 낮추기`}
          disabled={lowerDisabled} accessibilityState={{ disabled: lowerDisabled }}
          onPress={() => { if (value !== undefined) onExposure(value - step); }} style={[styles.step, lowerDisabled && styles.disabled]}>
          <Text style={styles.value}>−</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`노출 ${step} ${unit} 높이기`}
          disabled={upperDisabled} accessibilityState={{ disabled: upperDisabled }}
          onPress={() => { if (value !== undefined) onExposure(value + step); }} style={[styles.step, upperDisabled && styles.disabled]}>
          <Text style={styles.value}>＋</Text>
        </Pressable>
        <CameraAction label="기본 밝기" disabled={locked || value === 0} onPress={() => onExposure(0)} />
      </View>
      <Text style={styles.note}>촬영 밝기를 바꿔요. 필터 강도와는 별개예요.</Text>
    </> : state.ready ? <Text style={styles.note}>이 카메라는 노출 보정을 지원하지 않아요.</Text> : null}
    {state.message ? <Text accessibilityLiveRegion="polite" style={styles.note}>{state.message}</Text> : null}
    {state.error ? <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text> : null}
    {!state.ready && !state.busy ? <CameraAction label="초점·노출 다시 연결" disabled={disabled} onPress={onReconnect} /> : null}
  </View>;
}

export function FocusTarget({ state }: { state: MeteringState }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(!!state.focusPoint);
    if (!state.focusPoint || state.busy) return;
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, [state.focusPoint, state.busy]);
  if (!visible || !state.focusPoint) return null;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.target, { left: `${state.focusPoint.x * 100}%`, top: `${state.focusPoint.y * 100}%` }]} />;
}
const styles = StyleSheet.create({
  group: { gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  value: { color: theme.text, fontSize: 14, fontFamily: theme.mono },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18, flexShrink: 1 }, error: { color: theme.error, fontSize: 13 },
  step: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.line, borderRadius: 6 },
  disabled: { opacity: 0.4 },
  target: { position: 'absolute', width: 40, height: 40, marginLeft: -20, marginTop: -20,
    borderWidth: 1, borderColor: theme.light, borderRadius: 4 },
});
