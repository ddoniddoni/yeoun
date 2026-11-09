import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { CAMERA_FILTERS, cameraSettingsKey, type CameraSettings } from '../domain/filters/cameraSettings';
import { recipeName, recipeSettingsForContext, RECIPE_LIMIT, type Recipe } from '../domain/recipes/recipe';
import { RecipesStore, type RecipeMutation } from '../domain/recipes/recipeStore';
import { recipeFingerprint } from '../storage/recipeCatalog';
import { recipesRepository } from '../storage/recipesRepository';
import { CameraAction, IconButton } from './CameraControls';
import { CameraIcon } from './CameraIcon';
import { cameraTheme as theme } from './cameraTheme';

const RecipesContext = createContext<RecipesStore | null>(null);
export function RecipesProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new RecipesStore(recipesRepository, recipeFingerprint, () => randomUUID().toLowerCase()));
  useEffect(() => { void store.load(); }, [store]);
  return <RecipesContext.Provider value={store}>{children}</RecipesContext.Provider>;
}
type Editor = { kind: 'create' } | { kind: 'rename'; id: string };
function settingsLabel(settings: CameraSettings): string {
  const name = CAMERA_FILTERS.find(filter => filter.id === settings.filterId)?.name ?? '원본';
  return settings.filterId === 'original' ? name : `${name} · 강도 ${Math.round(settings.intensity * 100)}%`;
}

export function RecipeControls({ settings, disabled, imported, onSelect }: {
  settings: CameraSettings; disabled: boolean; imported: boolean; onSelect(settings: CameraSettings): void;
}) {
  const store = useContext(RecipesContext);
  if (!store) throw new Error('RecipesProvider is missing');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [expanded, setExpanded] = useState(false);
  const [editor, setEditor] = useState<Editor>();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const pending = useRef(false);
  const mounted = useRef(false);
  const locked = disabled || state.phase !== 'ready';
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const canAct = () => mounted.current && !lockedRef.current && !pending.current;
  const start = (next: Editor, initialName: string) => {
    if (!canAct()) return;
    setEditor(next); setName(initialName); setFormError(undefined); setMessage(undefined); setExpanded(true);
  };
  const mutate = async (write: () => Promise<RecipeMutation>, success: string) => {
    if (!canAct()) return;
    pending.current = true; setFormError(undefined); setMessage(undefined);
    try {
      const result = await write();
      if (!mounted.current) return;
      if (result === 'saved') { setEditor(undefined); Keyboard.dismiss(); setMessage(success); }
      // The commit may have succeeded even when its acknowledgement failed. Show the
      // reloaded list before allowing a fresh create, rather than blindly submitting twice.
      if (result === 'failed') { setEditor(undefined); Keyboard.dismiss(); setExpanded(true); }
    } catch {
      if (mounted.current) setFormError('색감을 저장하지 못했어요. 이름과 설정을 확인해 주세요');
    } finally { pending.current = false; }
  };
  const submit = () => {
    if (!editor || !canAct()) return;
    let cleanName: string;
    try { cleanName = recipeName(name); }
    catch { setFormError('이름은 줄바꿈 없이 1~24자로 입력해 주세요'); return; }
    if (editor.kind === 'create' && state.items.length >= RECIPE_LIMIT) {
      setFormError('내 색감은 100개까지 보관할 수 있어요. 쓰지 않는 색감을 먼저 삭제해 주세요'); return;
    }
    void mutate(() => editor.kind === 'create' ? store.create(cleanName, settings) : store.rename(editor.id, cleanName),
      editor.kind === 'create' ? '내 색감에 저장했어요' : '이름을 변경했어요');
  };
  const manage = (recipe: Recipe) => {
    if (!canAct()) return;
    Alert.alert(recipe.name, '저장한 색감 관리', [
      { text: '취소', style: 'cancel' },
      { text: '이름 변경', onPress: () => start({ kind: 'rename', id: recipe.id }, recipe.name) },
      { text: '삭제', style: 'destructive', onPress: () => {
        if (!canAct()) return;
        Alert.alert('이 색감을 삭제할까요?', '저장한 사진과 현재 조절값은 그대로 남아요', [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: () => { void mutate(() => store.remove(recipe.id), '내 색감에서 삭제했어요'); } },
        ]);
      } },
    ]);
  };
  return <View style={styles.section}>
    <View style={styles.heading}>
      <Pressable accessibilityRole="button" accessibilityLabel={`내 색감 ${state.items.length}개`}
        accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)}
        style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}>
        <Text style={styles.title}>내 색감</Text><Text style={styles.count}>{state.items.length}</Text>
        <CameraIcon name={expanded ? 'up' : 'down'} size={20} color={theme.secondary} />
      </Pressable>
      <IconButton icon="plus" label="현재 색감을 내 색감으로 저장" disabled={locked || !!editor || state.items.length >= RECIPE_LIMIT}
        onPress={() => start({ kind: 'create' }, '')} />
    </View>
    {state.phase === 'loading' || state.phase === 'saving' ? <Text accessibilityLiveRegion="polite" style={styles.note}>
      {state.phase === 'loading' ? '내 색감을 불러오는 중…' : '변경 내용을 저장하는 중…'}</Text> : null}
    {state.phase === 'error' ? <View style={styles.messages}>
      <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>
      <CameraAction icon="reset" label="내 색감 다시 불러오기" disabled={disabled} onPress={() => { void store.load(); }} />
    </View> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={styles.note}>{message}</Text> : null}
    {expanded ? <>
      {editor ? <View style={styles.editor}>
        <Text style={styles.label}>{editor.kind === 'create' ? '현재 색감 저장' : '색감 이름 변경'}</Text>
        {editor.kind === 'create' ? <Text style={styles.note}>{settingsLabel(settings)}{settings.dateStamp ? ' · 날짜 도장 켜짐' : ''}</Text> : null}
        <TextInput accessibilityLabel="색감 이름" accessibilityHint="앞뒤 공백을 제외하고 1~24자"
          value={name} onChangeText={value => { setName(value); setFormError(undefined); }} editable={!locked}
          placeholder="예: 오후 산책" placeholderTextColor={theme.secondary} style={styles.input}
          selectionColor={theme.accent} underlineColorAndroid="transparent" autoComplete="off"
          autoCorrect={false} autoCapitalize="none" returnKeyType="done"
          onSubmitEditing={submit} maxLength={96} />
        <Text style={styles.note}>{[...name.trim()].length}/24자</Text>
        {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
        <CameraAction primary label={editor.kind === 'create' ? '내 색감 저장' : '이름 변경'} disabled={locked} onPress={submit} />
        <CameraAction label="취소" disabled={state.phase === 'saving'} onPress={() => { Keyboard.dismiss(); setEditor(undefined); setFormError(undefined); }} />
      </View> : null}
      {state.phase === 'ready' && state.items.length === 0 ? <Text style={styles.note}>마음에 드는 색감을 조절하고 + 버튼으로 저장해 보세요</Text> : null}
      {state.items.length >= RECIPE_LIMIT ? <Text style={styles.note}>내 색감 100개를 모두 채웠어요. 쓰지 않는 색감을 삭제하면 새로 저장할 수 있어요</Text> : null}
      {state.items.map(recipe => {
        const matching = recipe.available && cameraSettingsKey(settings) === cameraSettingsKey(recipeSettingsForContext(recipe.settings, imported));
        return <View key={recipe.id} style={[styles.row, matching && styles.matching]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${recipe.name}, ${recipe.available ? settingsLabel(recipe.settings) : recipe.reason}`}
            accessibilityHint="조절값을 불러와요" accessibilityState={{ disabled: locked || !recipe.available || !!editor }}
            disabled={locked || !recipe.available || !!editor}
            onPress={() => {
              if (!canAct() || !recipe.available) return;
              onSelect(recipeSettingsForContext(recipe.settings, imported));
              setMessage(imported && recipe.settings.dateStamp ? '색감을 불러왔어요 · 가져온 사진의 날짜 도장은 꺼져 있어요' : '조절값을 불러왔어요');
            }} style={({ pressed }) => [styles.recipe, pressed && styles.pressed]}>
            <Text style={styles.label}>{recipe.name}</Text>
            <Text style={styles.note}>{recipe.available ? settingsLabel(recipe.settings) : recipe.reason}</Text>
            {matching ? <Text style={styles.note}>현재 조절값과 같아요</Text> : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${recipe.name} 이름 변경 또는 삭제`}
            accessibilityState={{ disabled: locked || !!editor }} disabled={locked || !!editor} onPress={() => manage(recipe)}
            style={({ pressed }) => [styles.manage, pressed && styles.pressed, (locked || !!editor) && styles.disabled]}>
            <Text style={styles.manageText}>관리</Text>
          </Pressable>
        </View>;
      })}
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line, paddingTop: 12, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disclosure: { minHeight: 48, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: theme.text, fontSize: 16, fontWeight: '500', flexShrink: 1 },
  count: { color: theme.secondary, fontSize: 12, fontFamily: theme.mono, fontVariant: ['tabular-nums'] },
  label: { color: theme.text, fontSize: 14, fontWeight: '500' },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18 },
  messages: { gap: 8 }, error: { color: theme.error, fontSize: 13, lineHeight: 20 },
  editor: { padding: 16, gap: 12, backgroundColor: theme.inset, borderRadius: 16 },
  input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: theme.secondary, borderRadius: theme.controlRadius,
    color: theme.text, backgroundColor: theme.surface, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: theme.controlRadius,
    borderWidth: 1, borderColor: theme.line, paddingLeft: 12, paddingRight: 4 },
  matching: { backgroundColor: theme.accentSoft },
  recipe: { flex: 1, minHeight: 64, paddingVertical: 12, gap: 4 },
  manage: { minHeight: 48, minWidth: 48, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  manageText: { color: theme.secondary, fontSize: 13 }, pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
});
