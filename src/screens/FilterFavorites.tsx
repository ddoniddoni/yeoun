import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CAMERA_FILTERS, type CameraFilterId } from '../domain/filters/cameraSettings';
import { FavoritesStore, isFavoriteFilterId } from '../domain/filters/favorites';
import { favoritesRepository } from '../storage/favoritesRepository';
import { CameraIcon } from './CameraIcon';
import { cameraTheme as theme } from './cameraTheme';

const FavoritesContext = createContext<FavoritesStore | null>(null);
export function FilterFavoritesProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new FavoritesStore(favoritesRepository));
  useEffect(() => { void store.load(); }, [store]);
  // Only filter controls subscribe, so a star change does not rerender the camera screen.
  return <FavoritesContext.Provider value={store}>{children}</FavoritesContext.Provider>;
}

export function useFilterFavorites() {
  const store = useContext(FavoritesContext);
  if (!store) throw new Error('FilterFavoritesProvider is missing');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, reload: store.load, toggle: store.toggle };
}

export function FavoriteButton({ id, disabled }: { id: CameraFilterId; disabled: boolean }) {
  const favorites = useFilterFavorites();
  if (!isFavoriteFilterId(id)) return <View style={styles.button} />;
  const selected = favorites.ids.includes(id);
  const busy = favorites.phase === 'loading' || favorites.phase === 'saving';
  const locked = disabled || busy;
  const name = CAMERA_FILTERS.find(filter => filter.id === id)!.name;
  const showError = () => Alert.alert('즐겨찾기', '즐겨찾기 저장 상태를 확인하지 못했어요. 다시 불러와 주세요.', [
    { text: '닫기', style: 'cancel' }, { text: '다시 불러오기', onPress: () => { void favorites.reload(); } },
  ]);
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={`${name} 즐겨찾기`}
    accessibilityHint={favorites.phase === 'error' ? '저장 상태를 다시 불러올 수 있어요.' : selected ? '즐겨찾기에서 빼요.' : '즐겨찾기에 추가해요.'}
    accessibilityState={{ checked: selected, disabled: locked, busy }} disabled={locked}
    onPress={() => {
      if (favorites.phase === 'error') showError();
      else void favorites.toggle(id).then(result => { if (result === 'failed') showError(); });
    }} style={({ pressed }) => [styles.button, selected && styles.selected, pressed && styles.pressed, locked && styles.disabled]}>
    {busy ? <ActivityIndicator size="small" color={theme.light} />
      : <CameraIcon name="star" color={selected ? theme.light : theme.secondary} />}
    {selected ? <View style={styles.selectedDot} /> : null}
  </Pressable>;
}

/** Shown in the reserved list area, never changing the viewfinder's height. */
export function FavoritesMessage({ disabled }: { disabled: boolean }) {
  const favorites = useFilterFavorites();
  if (favorites.phase === 'ready' || favorites.phase === 'saving') {
    return <Text maxFontSizeMultiplier={1.4} style={styles.message}>마음에 드는 필터를 고르고{ '\n' }이름 옆 별을 눌러 보세요.</Text>;
  }
  if (favorites.phase === 'loading') return <Text maxFontSizeMultiplier={1.4} accessibilityLiveRegion="polite" style={styles.message}>즐겨찾기를 불러오는 중…</Text>;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${favorites.error} 다시 불러오기`}
    disabled={disabled} accessibilityState={{ disabled }} onPress={() => { void favorites.reload(); }}
    style={({ pressed }) => [styles.retry, pressed && styles.pressed, disabled && styles.disabled]}>
    <CameraIcon name="reset" size={18} color={theme.light} />
    <Text maxFontSizeMultiplier={1.4} style={styles.message}>즐겨찾기를 불러오지 못했어요{ '\n' }눌러서 다시 불러오기</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: theme.surface },
  selectedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.light, position: 'absolute', bottom: 5 },
  message: { color: theme.secondary, fontSize: 12, lineHeight: 18, flexShrink: 1, maxWidth: 230 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, maxWidth: 230 },
  pressed: { opacity: 0.65 }, disabled: { opacity: 0.4 },
});
