import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CameraMemoryStore } from '../domain/filters/cameraMemoryStore';
import { cameraMemoryRepository } from '../storage/cameraMemoryRepository';
import { recipeFingerprint } from '../storage/recipeCatalog';
import { CameraAction } from './CameraControls';
import { useCameraTheme, createThemedStyles } from './ThemeProvider';

const CameraMemoryContext = createContext<CameraMemoryStore | null>(null);
export function useCameraMemory() {
  const store = useContext(CameraMemoryContext);
  if (!store) throw new Error('CameraMemoryProvider is missing');
  return store;
}
export function CameraMemoryProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new CameraMemoryStore(cameraMemoryRepository, recipeFingerprint));
  useEffect(() => { void store.load(); }, [store]);
  return <CameraMemoryContext.Provider value={store}><CameraMemoryGate>{children}</CameraMemoryGate></CameraMemoryContext.Provider>;
}
function CameraMemoryGate({ children }: { children: ReactNode }) {
  const theme = useCameraTheme();
  const styles = useStyles();
  const store = useCameraMemory();
  const startup = useSyncExternalStore(store.subscribe, store.getStartup, store.getStartup);
  if (startup === 'ready') return children;
  const loading = startup === 'loading';
  return <ScrollView contentContainerStyle={styles.startup}>
    <Text style={styles.brand}>여운<Text style={styles.dot}> ·</Text></Text>
    {loading ? <ActivityIndicator color={theme.accent} /> : null}
    <Text accessibilityRole="header" style={styles.title}>{loading ? '마지막 색감을 불러오고 있어요' : '촬영 설정을 불러오지 못했어요'}</Text>
    <Text style={styles.description}>{loading ? '잠시만 기다려 주세요.'
      : '다시 불러오거나 기본 설정으로 시작해 주세요. 기본 설정으로 시작해도 보관한 촬영 설정은 그대로 남아요.'}</Text>
    {!loading ? <View style={styles.actions}>
      <CameraAction primary label="다시 불러오기" onPress={() => { void store.load(); }} />
      <CameraAction label="기본 설정으로 시작" onPress={store.useDefaults} />
    </View> : null}
  </ScrollView>;
}
export function CameraMemoryControls({ disabled }: { disabled: boolean }) {
  const theme = useCameraTheme();
  const styles = useStyles();
  const store = useCameraMemory();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const locked = disabled || state.switching;
  const choose = (remember: boolean) => { if (!locked) void store.setRemember(remember); };
  return <View style={styles.group}>
    <View style={styles.row}>
      <Text style={styles.label}>마지막 설정 기억</Text>
      {state.remember === null ? <Text style={styles.note}>확인 필요</Text> : <Switch
        accessibilityLabel="마지막 촬영 설정 기억" accessibilityHint="필터, 강도, 질감과 격자를 다음 실행에서 불러와요."
        disabled={locked} value={state.remember} onValueChange={choose} thumbColor={theme.onPhoto}
        ios_backgroundColor={theme.line} trackColor={{ false: theme.line, true: theme.accent }} />}
    </View>
    <Text style={styles.note}>{state.remember === null ? '기억 여부를 확인하지 못했어요. 아래에서 다시 선택해 주세요.'
      : state.remember === false ? '다음 실행부터 오후 네 시 기본값과 격자 끔으로 시작해요.'
      : '필터·강도·질감·날짜 표시와 격자를 기억해요. 플래시와 노출은 새로 시작해요.'}</Text>
    {state.switching || state.saving ? <Text accessibilityLiveRegion="polite" style={styles.note}>설정을 저장하고 있어요…</Text> : null}
    {state.error ? <>
      <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>
      <CameraAction label="현재 설정 기억하기" disabled={locked} onPress={() => choose(true)} />
      <CameraAction label="설정 기억 끄기" disabled={locked} onPress={() => choose(false)} />
    </> : null}
  </View>;
}
const useStyles = createThemedStyles(theme => StyleSheet.create({
  startup: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 16, backgroundColor: theme.background },
  brand: { color: theme.text, fontSize: 25, fontWeight: '700', letterSpacing: -1, marginBottom: 16 },
  dot: { color: theme.shutter },
  title: { color: theme.text, fontSize: 24, fontWeight: '600', textAlign: 'center' },
  description: { color: theme.secondary, fontSize: 15, lineHeight: 24, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 16, maxWidth: 480, width: '100%' },
  group: { gap: 12, width: '100%', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  label: { color: theme.text, fontSize: 14, flex: 1 },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18 },
  error: { color: theme.error, fontSize: 13, lineHeight: 20 },
}));
