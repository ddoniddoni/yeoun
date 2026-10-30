import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { PhotoFlashMode } from '../domain/capture/flash';
import { CameraIcon } from './CameraIcon';
import { cameraTheme as theme } from './cameraTheme';

const FLASH_MODES: readonly { mode: PhotoFlashMode; label: string }[] = [
  { mode: 'off', label: '끔' }, { mode: 'auto', label: '자동' }, { mode: 'on', label: '켬' },
];

export function CameraAssistControls({ grid, flashMode, hasFlash, disabled, onGrid, onFlash }: {
  grid: boolean; flashMode: PhotoFlashMode; hasFlash: boolean; disabled: boolean;
  onGrid(): void; onFlash(mode: PhotoFlashMode): void;
}) {
  return <View style={styles.group}>
    <View style={styles.settingRow}>
      <CameraIcon name="grid" color={theme.secondary} size={21} />
      <Text style={styles.label}>격자 안내선</Text>
      <Switch accessibilityLabel="3×3 격자 안내선" accessibilityHint="저장 사진에는 표시되지 않아요."
        disabled={disabled} value={grid} onValueChange={onGrid} trackColor={{ false: theme.line, true: theme.light }} />
    </View>
    <View style={styles.settingRow}>
      <CameraIcon name="flash" color={theme.secondary} size={21} />
      <Text style={styles.label}>플래시</Text>
      <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel="플래시 모드">
        {FLASH_MODES.map(({ mode, label }) => <Pressable key={mode} accessibilityRole="radio"
          accessibilityLabel={`플래시 ${label}`} accessibilityState={{ checked: flashMode === mode, disabled: disabled || !hasFlash }}
          disabled={disabled || !hasFlash} onPress={() => onFlash(mode)}
          style={({ pressed }) => [styles.button, flashMode === mode && styles.selected,
            pressed && styles.pressed, (disabled || !hasFlash) && styles.disabled]}>
          {mode === 'auto' ? <Text style={[styles.auto, flashMode === mode && { color: theme.light }]}>A</Text>
            : <CameraIcon name={mode === 'off' ? 'flashOff' : 'flash'} size={20} color={flashMode === mode ? theme.light : theme.secondary} />}
        </Pressable>)}
      </View>
    </View>
    <Text style={styles.note}>{!hasFlash ? '이 카메라는 플래시를 지원하지 않아요.'
      : flashMode === 'auto' ? '자동 · 주변 밝기에 따라 작동해요.'
        : flashMode === 'on' ? '플래시 켜짐 · 촬영 순간에 빛을 더해요.' : '플래시 꺼짐'}</Text>
  </View>;
}

/** View-only guides: no image, shader or export path receives these lines. */
export function CameraGrid() {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <View style={[styles.vertical, { left: '33.333333%' }]} />
    <View style={[styles.vertical, { left: '66.666667%' }]} />
    <View style={[styles.horizontal, { top: '33.333333%' }]} />
    <View style={[styles.horizontal, { top: '66.666667%' }]} />
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: 12, width: '100%' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  label: { color: theme.text, fontSize: 14, flex: 1 },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: 16, backgroundColor: theme.inset },
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  selected: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line },
  auto: { color: theme.secondary, fontSize: 15, fontFamily: theme.mono },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18 }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.65 },
  vertical: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: theme.text, opacity: 0.4 },
  horizontal: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: theme.text, opacity: 0.4 },
});
