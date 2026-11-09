import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppearancePreference } from '../domain/settings/appearance';
import { CameraAction } from './CameraControls';
import { createThemedStyles, useAppearanceStore } from './ThemeProvider';

const OPTIONS: readonly { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: '기기 설정' }, { value: 'light', label: '밝게' }, { value: 'dark', label: '어둡게' },
];
export function AppearanceControls({ disabled }: { disabled: boolean }) {
  const styles = useStyles();
  const store = useAppearanceStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const locked = disabled || state.loading || state.saving;
  return <View style={styles.group}>
    <Text accessibilityRole="header" style={styles.title}>화면 테마</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="화면 테마" style={styles.options}>
      {OPTIONS.map(option => <Pressable key={option.value} accessibilityRole="radio"
        accessibilityLabel={option.label} accessibilityState={{ checked: state.preference === option.value, disabled: locked }}
        disabled={locked} onPress={() => { void store.select(option.value); }}
        style={({ pressed }) => [styles.option, state.preference === option.value && styles.selected,
          pressed && styles.pressed, locked && styles.disabled]}>
        <Text style={[styles.label, state.preference === option.value && styles.selectedLabel]}>{option.label}</Text>
      </Pressable>)}
    </View>
    <Text style={styles.note}>{state.preference === 'system' ? '기기의 밝은 화면·다크 모드 설정을 따라요.'
      : state.preference === 'dark' ? '어두운 곳에서도 편안하게 색감을 골라요.' : '밝은 인화지 위에서 색감을 골라요.'}</Text>
    {state.loading || state.saving ? <Text accessibilityLiveRegion="polite" style={styles.note}>
      {state.loading ? '화면 설정을 불러오고 있어요…' : '화면 설정을 저장하고 있어요…'}
    </Text> : null}
    {state.error ? <>
      <Text accessibilityRole="alert" style={styles.error}>{state.error === 'read'
        ? '화면 설정을 읽지 못했어요. 다시 불러오거나 원하는 테마를 선택해 주세요.'
        : '지금 화면에는 적용했지만 다음 실행을 위해 저장하지 못했어요.'}</Text>
      <CameraAction label={state.error === 'read' ? '다시 불러오기' : '설정 다시 저장'} disabled={locked}
        onPress={() => { void (state.error === 'read' ? store.load() : store.select(state.preference)); }} />
    </> : null}
  </View>;
}
const useStyles = createThemedStyles(theme => StyleSheet.create({
  group: { gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line, paddingTop: 16 },
  title: { color: theme.text, fontSize: 14, fontWeight: '500' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexGrow: 1, minWidth: 80, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', borderRadius: theme.controlRadius, borderWidth: 1, borderColor: theme.line },
  selected: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  label: { color: theme.secondary, fontSize: 14, fontWeight: '500' },
  selectedLabel: { color: theme.accent, fontWeight: '600' },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18 },
  error: { color: theme.error, fontSize: 13, lineHeight: 20 },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
}));
