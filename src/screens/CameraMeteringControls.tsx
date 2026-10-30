import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MeteringState } from '../domain/capture/meteringSession';
import { CameraAction, IconButton } from './CameraControls';
import { CameraIcon } from './CameraIcon';
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
      <CameraIcon name="focus" size={21} color={theme.secondary} />
      <Text style={styles.label}>초점</Text>
      <CameraAction icon="focus" label="중앙에 맞추기" disabled={locked || !state.focusSupported} onPress={onFocusCenter} />
    </View>
    <Text style={styles.note}>{state.ready && !state.focusSupported ? '이 카메라는 탭 초점을 지원하지 않아요.' : '뷰파인더를 눌러 원하는 곳에 초점을 맞추세요.'}</Text>
    {state.range ? <View style={styles.exposure}>
      <View style={styles.row}>
        <CameraIcon name="sun" size={21} color={theme.secondary} />
        <Text style={styles.label}>노출</Text>
        <IconButton icon="reset" label="노출을 기본 밝기로 초기화" disabled={locked || value === 0} onPress={() => onExposure(0)} />
      </View>
      <View style={styles.row}>
        <IconButton icon="minus" label={`노출 ${step} ${unit} 낮추기`} disabled={lowerDisabled}
          onPress={() => { if (value !== undefined) onExposure(value - step); }} />
        <Text accessibilityLiveRegion="polite" style={styles.value}>{number}<Text style={styles.unit}> {unit}</Text></Text>
        <IconButton icon="plus" label={`노출 ${step} ${unit} 높이기`} disabled={upperDisabled}
          onPress={() => { if (value !== undefined) onExposure(value + step); }} />
      </View>
    </View> : state.ready ? <Text style={styles.note}>이 카메라는 노출 보정을 지원하지 않아요.</Text> : null}
    {state.message ? <Text accessibilityLiveRegion="polite" style={styles.note}>{state.message}</Text> : null}
    {state.error ? <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text> : null}
    {!state.ready && !state.busy ? <CameraAction icon="reset" label="초점·노출 다시 연결" disabled={disabled} onPress={onReconnect} /> : null}
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
  group: { gap: 12 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  label: { color: theme.text, fontSize: 14, flex: 1 },
  exposure: { backgroundColor: theme.inset, padding: 12, borderRadius: 18 },
  unit: { color: theme.secondary, fontSize: 12 },
  value: { color: theme.accent, fontSize: 26, fontFamily: theme.mono, flex: 1, textAlign: 'center' },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18, flexShrink: 1 }, error: { color: theme.error, fontSize: 13 },
  target: { position: 'absolute', width: 40, height: 40, marginLeft: -20, marginTop: -20,
    borderWidth: 1, borderColor: theme.focus, borderRadius: 4 },
});
