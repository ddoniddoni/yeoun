import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cameraTheme as theme } from './cameraTheme';

export function OriginalComparisonControls({ active, pinned, disabled, ready, onHold, onRelease, onToggle }: {
  active: boolean; pinned: boolean; disabled: boolean; ready: boolean;
  onHold(): void; onRelease(): void; onToggle(): void;
}) {
  return <View style={styles.group}>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="누르는 동안 원본 비교"
        accessibilityHint="길게 누르기 대신 옆의 원본 보기 유지 스위치를 사용할 수 있어요."
        disabled={disabled || pinned} accessibilityState={{ disabled: disabled || pinned }}
        onPressIn={onHold} onPressOut={onRelease}
        style={({ pressed }) => [styles.button, styles.hold, pressed && styles.selected, (disabled || pinned) && styles.disabled]}>
        <Text style={styles.label}>눌러서 원본 비교</Text>
      </Pressable>
      <Pressable accessibilityRole="switch" accessibilityLabel="원본 보기 유지"
        accessibilityHint="미리보기만 바뀌어요. 끄면 선택한 색감으로 돌아가요."
        accessibilityState={{ checked: pinned, disabled }} disabled={disabled} onPress={onToggle}
        style={[styles.button, pinned && styles.selected, disabled && styles.disabled]}>
        <Text style={styles.label}>원본 유지 {pinned ? '켬' : '끔'}</Text>
      </Pressable>
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.note}>{active
      ? ready ? '원본 비교 중 · 비교를 마치면 촬영할 수 있어요.' : '원본으로 전환하고 있어요…'
      : '미리보기만 비교해요. 선택한 색감과 조절값은 유지돼요.'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: 6 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, minWidth: 48, paddingHorizontal: 12, paddingVertical: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.line, borderRadius: 6 },
  hold: { flexGrow: 1 }, selected: { borderColor: theme.text, backgroundColor: theme.surface },
  label: { color: theme.text, fontSize: 13, textAlign: 'center' },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18 }, disabled: { opacity: 0.4 },
});
