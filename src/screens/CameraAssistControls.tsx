import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PhotoFlashMode } from '../domain/capture/flash';
import { cameraTheme as theme } from './cameraTheme';

const FLASH_MODES: readonly { mode: PhotoFlashMode; label: string }[] = [
  { mode: 'off', label: '끔' }, { mode: 'auto', label: '자동' }, { mode: 'on', label: '켬' },
];

export function CameraAssistControls({ grid, flashMode, hasFlash, disabled, onGrid, onFlash }: {
  grid: boolean; flashMode: PhotoFlashMode; hasFlash: boolean; disabled: boolean;
  onGrid(): void; onFlash(mode: PhotoFlashMode): void;
}) {
  return <View style={styles.group}>
    <View style={styles.row}>
      <Pressable accessibilityRole="switch" accessibilityLabel="3×3 격자"
        accessibilityHint="구도를 위한 안내선이에요. 저장 사진에는 표시되지 않아요."
        accessibilityState={{ checked: grid, disabled }} disabled={disabled} onPress={onGrid}
        style={[styles.button, grid && styles.selected, disabled && styles.disabled]}>
        <Text style={styles.label}>격자 {grid ? '켬' : '끔'}</Text>
      </Pressable>
      <View style={styles.flashGroup}>
        <Text style={styles.caption}>플래시</Text>
        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="플래시 모드">
          {FLASH_MODES.map(({ mode, label }) => <Pressable key={mode} accessibilityRole="radio"
            accessibilityLabel={`플래시 ${label}`} accessibilityState={{ checked: flashMode === mode, disabled: disabled || !hasFlash }}
            disabled={disabled || !hasFlash} onPress={() => onFlash(mode)}
            style={[styles.button, flashMode === mode && styles.selected, (disabled || !hasFlash) && styles.disabled]}>
            <Text style={styles.label}>{label}</Text>
          </Pressable>)}
        </View>
      </View>
    </View>
    <Text style={styles.note}>{!hasFlash ? '이 카메라는 플래시를 지원하지 않아요.'
      : flashMode === 'auto' ? '자동 · 촬영할 때 주변 밝기에 따라 작동해요.'
        : flashMode === 'on' ? '촬영 순간 빛이 더해져 미리보기와 밝기가 달라질 수 있어요.'
          : '플래시 끔 · 지금 보이는 빛으로 촬영해요.'}</Text>
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
  group: { gap: 6, paddingBottom: 12, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  flashGroup: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  caption: { color: theme.secondary, fontSize: 12 },
  button: { minHeight: 48, minWidth: 48, paddingHorizontal: 12, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.line, borderRadius: 6 },
  selected: { borderColor: theme.secondary, backgroundColor: theme.surface },
  label: { color: theme.text, fontSize: 13 }, note: { color: theme.secondary, fontSize: 12, lineHeight: 18 },
  disabled: { opacity: 0.4 },
  vertical: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: theme.text, opacity: 0.5 },
  horizontal: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: theme.text, opacity: 0.5 },
});
