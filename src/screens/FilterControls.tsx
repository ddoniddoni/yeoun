import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CAMERA_COLLECTIONS, CAMERA_FILTERS, type CameraFilterId, type CameraSettings } from '../domain/filters/cameraSettings';
import type { RetroAmount } from '../domain/filters/retroControls';
import { CameraIcon, type CameraIconName } from './CameraIcon';
import { IconButton } from './CameraControls';
import { FilterSwatch } from './FilterSwatch';
import { FavoriteButton, FavoritesMessage, useFilterFavorites } from './FilterFavorites';
import { isFavoriteFilterId, type FavoriteFilterId } from '../domain/filters/favorites';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';

const FILTER_GROUPS = [
  { name: '전체', filters: CAMERA_FILTERS },
  ...CAMERA_COLLECTIONS.filter(collection => collection.name !== '원본').map(collection => ({
    name: collection.name, filters: CAMERA_FILTERS.filter(filter => collection.ids.includes(filter.id)),
  })),
];
const FILTER_BY_ID = new Map(CAMERA_FILTERS.map(filter => [filter.id, filter]));
function useFavoriteList(ids: readonly FavoriteFilterId[]) {
  // Keep the original available in every favorites view; never auto-select a different look.
  return useMemo(() => [CAMERA_FILTERS[0], ...ids.map(id => FILTER_BY_ID.get(id)!)], [ids]);
}

function FilterStrip({ selectedId, disabled, onSelect, filters = CAMERA_FILTERS, favoriteIds, message }: {
  selectedId: CameraFilterId; disabled: boolean; onSelect(id: CameraFilterId): void;
  filters?: ReadonlyArray<typeof CAMERA_FILTERS[number]>;
  favoriteIds: readonly FavoriteFilterId[]; message?: ReactNode;
}) {
  const scroll = useRef<ScrollView>(null);
  const viewport = useRef(0);
  const revealSelected = useCallback(() => {
    const index = filters.findIndex(filter => filter.id === selectedId);
    scroll.current?.scrollTo({ x: index < 0 ? 0 : Math.max(0, index * 80 - (viewport.current - 72) / 2), animated: false });
  }, [filters, selectedId]);
  useEffect(revealSelected, [revealSelected]);
  return <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} style={styles.stripViewport}
    contentContainerStyle={styles.strip} accessibilityRole="radiogroup" accessibilityLabel="필터 선택"
    onLayout={event => { viewport.current = event.nativeEvent.layout.width; revealSelected(); }}
    onContentSizeChange={revealSelected}>
    {filters.map(filter => {
      const selected = selectedId === filter.id;
      const favorite = isFavoriteFilterId(filter.id) && favoriteIds.includes(filter.id);
      const { color, wash } = filterPresentation[filter.id];
      return <Pressable key={filter.id} accessibilityRole="radio" accessibilityLabel={`${filter.name}${favorite ? ', 즐겨찾기' : ''}, ${filter.caption}`}
        accessibilityState={{ checked: selected, disabled }} disabled={disabled}
        onPress={() => { if (!selected) onSelect(filter.id); }}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, disabled && styles.disabled]}>
        <View style={[styles.cardFrame, selected && { borderColor: color, backgroundColor: wash }]}>
          <FilterSwatch id={filter.id} />
          {favorite ? <View style={styles.favoriteMark}><CameraIcon name="star" size={11} color={theme.accent} /></View> : null}
          {selected ? <View style={[styles.check, { backgroundColor: color }]}>
            <CameraIcon name="check" size={11} color={theme.onAccent} />
          </View> : null}
        </View>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={[styles.cardName, selected && { color, fontWeight: '700' }]}>{filter.name}</Text>
      </Pressable>;
    })}
    {message ? <View style={styles.listMessage}>{message}</View> : null}
  </ScrollView>;
}

export function FilterControls({ settings, disabled, onSelect, onOpen }: {
  settings: CameraSettings; disabled: boolean; onSelect(id: CameraFilterId): void; onOpen(): void;
}) {
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const favorites = useFilterFavorites();
  const favoriteFilters = useFavoriteList(favorites.ids);
  const selected = CAMERA_FILTERS.find(filter => filter.id === settings.filterId);
  const presentation = filterPresentation[settings.filterId];
  return <View style={styles.controls}>
    <View style={styles.selection}>
      <View style={styles.selectionName}>
        <View style={[styles.dot, { backgroundColor: presentation.color }]} />
        <Text numberOfLines={1} style={styles.name}>{selected?.name}</Text>
        {settings.filterId !== 'original' ? <View style={[styles.intensityPill, { backgroundColor: presentation.wash }]}>
          <Text style={[styles.value, { color: presentation.color }]}>{Math.round(settings.intensity * 100)}<Text style={styles.unit}>%</Text></Text>
        </View> : null}
      </View>
      <View style={styles.selectionActions}>
        <FavoriteButton id={settings.filterId} disabled={disabled} />
        <IconButton icon="sliders" label="필터 강도와 질감 조절" onPress={onOpen} disabled={disabled} />
      </View>
    </View>
    <View style={styles.listRow}>
      <View style={styles.listSwitch}>
        <IconButton icon="favorites" label={favoritesOnly ? '전체 필터 보기' : '즐겨찾기만 보기'}
          hint="목록만 바뀌고 현재 색감은 유지돼요." selected={favoritesOnly} disabled={disabled}
          onPress={() => setFavoritesOnly(value => !value)} />
      </View>
      <FilterStrip filters={favoritesOnly ? favoriteFilters : CAMERA_FILTERS} favoriteIds={favorites.ids}
        selectedId={settings.filterId} disabled={disabled} onSelect={onSelect}
        message={favoritesOnly && (favorites.ids.length === 0 || favorites.phase === 'error')
          ? <FavoritesMessage disabled={disabled} /> : undefined} />
    </View>
  </View>;
}

type EffectKey = 'intensity' | 'grain' | 'bloom' | RetroAmount;
const EFFECTS: readonly { key: EffectKey; label: string; icon: CameraIconName }[] = [
  { key: 'intensity', label: '강도', icon: 'sliders' },
  { key: 'grain', label: '입자', icon: 'grain' }, { key: 'bloom', label: '빛 번짐', icon: 'bloom' },
  { key: 'softness', label: '부드러움', icon: 'softness' }, { key: 'vignette', label: '비네팅', icon: 'vignette' },
  { key: 'halation', label: '붉은 번짐', icon: 'sun' }, { key: 'sharpness', label: '선명도', icon: 'focus' },
  { key: 'digitalNoise', label: '디카 입자', icon: 'grid' },
  { key: 'lightLeak', label: '빛샘', icon: 'flash' }, { key: 'dust', label: '먼지', icon: 'grain' },
];

export function FilterAdjustmentPanel({ settings, disabled, onSelect, onIntensity, onTexture, onDateStamp, onReset, imported = false }: {
  settings: CameraSettings; disabled: boolean; imported?: boolean;
  onSelect(id: CameraFilterId): void; onIntensity(value: number): void;
  onTexture(control: 'grain' | 'bloom' | RetroAmount, value: number): void;
  onDateStamp(enabled: boolean): void; onReset(): void;
}) {
  const [effect, setEffect] = useState<EffectKey>('intensity');
  const [groupName, setGroupName] = useState('전체');
  const favorites = useFilterFavorites();
  const favoriteFilters = useFavoriteList(favorites.ids);
  const groups = useMemo(() => [FILTER_GROUPS[0]!, { name: '즐겨찾기', filters: favoriteFilters }, ...FILTER_GROUPS.slice(1)], [favoriteFilters]);
  const group = groups.find(item => item.name === groupName)!;
  const selected = CAMERA_FILTERS.find(filter => filter.id === settings.filterId);
  const original = settings.filterId === 'original';
  const { color: accent, wash } = filterPresentation[settings.filterId];
  const activeEffect = EFFECTS.find(item => item.key === effect)!;
  return <View style={styles.adjustment}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groups}
      accessibilityRole="tablist" accessibilityLabel="촬영 장면별 필터">
      {groups.map(item => <Pressable key={item.name} accessibilityRole="tab"
        accessibilityLabel={`${item.name}, ${item.name === '즐겨찾기' ? favorites.ids.length : item.filters.length}개`}
        accessibilityState={{ selected: groupName === item.name, disabled }} disabled={disabled}
        onPress={() => setGroupName(item.name)}
        style={({ pressed }) => [styles.group, groupName === item.name && styles.groupSelected, pressed && styles.pressed, disabled && styles.disabled]}>
        {item.name === '즐겨찾기' ? <CameraIcon name="star" size={16} color={theme.accent} /> : null}
        <Text style={[styles.groupName, groupName === item.name && styles.groupNameSelected]}>{item.name}</Text>
      </Pressable>)}
    </ScrollView>
    <FilterStrip filters={group.filters} favoriteIds={favorites.ids} selectedId={settings.filterId} disabled={disabled} onSelect={onSelect}
      message={groupName === '즐겨찾기' && (favorites.ids.length === 0 || favorites.phase === 'error')
        ? <FavoritesMessage disabled={disabled} /> : undefined} />
    <View style={styles.captionRow}>
      <Text style={[styles.caption, styles.captionText]}>{selected?.name} · {selected?.caption}</Text>
      <FavoriteButton id={settings.filterId} disabled={disabled} />
    </View>
    {!original ? <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effects}
        accessibilityRole="tablist" accessibilityLabel="조절할 효과">
        {EFFECTS.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.label}
          accessibilityState={{ selected: effect === item.key, disabled }} disabled={disabled} onPress={() => setEffect(item.key)}
          style={({ pressed }) => [styles.effect, effect === item.key && { backgroundColor: wash, borderColor: accent }, pressed && styles.pressed, disabled && styles.disabled]}>
          <CameraIcon name={item.icon} color={effect === item.key ? accent : theme.secondary} size={22} />
          <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={[styles.effectName, effect === item.key && { color: accent }]}>{item.label}</Text>
        </Pressable>)}
      </ScrollView>
      <EffectAmount label={activeEffect.label} value={settings[effect]} disabled={disabled} accent={accent}
        onChange={value => effect === 'intensity' ? onIntensity(value) : onTexture(effect, value)} />
      <View style={styles.footer}>
        <CameraIcon name="calendar" size={20} color={settings.dateStamp ? accent : theme.secondary} />
        <Text style={styles.dateLabel}>날짜 도장</Text>
        <Switch accessibilityLabel={imported ? '가져온 날짜 도장' : '촬영 날짜 도장'} disabled={disabled} value={settings.dateStamp}
          onValueChange={onDateStamp} thumbColor={theme.surface}
          ios_backgroundColor={theme.line} trackColor={{ false: theme.line, true: accent }} />
        <View style={styles.divider} />
        <IconButton icon="reset" label="현재 필터 기본값으로 초기화" disabled={disabled} onPress={onReset} />
      </View>
      {settings.intensity === 0 ? <Text style={styles.caption}>강도 0% · 날짜를 포함한 모든 효과가 꺼져 있어요.</Text>
        : settings.dateStamp ? <Text style={styles.caption}>{imported ? '사진을 가져온 날짜가 찍혀요. 원래 촬영일과 다를 수 있어요.' : '촬영한 날짜가 저장 사진에도 남아요.'}</Text> : null}
    </> : <Text style={styles.caption}>필터를 고르면 강도와 질감을 조절할 수 있어요.</Text>}
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
    <View style={styles.amountHeading}><Text style={styles.amountLabel}>{label}</Text>
      <Text style={[styles.amountValue, { color: accent }]}>{percent}<Text style={styles.unit}> %</Text></Text></View>
    <View style={styles.amountRow}>
      <IconButton icon="minus" label={`${label} 10% 낮추기`} disabled={disabled || percent === 0} onPress={() => change(-10)} />
      <View accessible accessibilityRole="adjustable" accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }} accessibilityState={{ disabled }}
        accessibilityActions={[{ name: 'increment', label: '10% 높이기' }, { name: 'decrement', label: '10% 낮추기' }]}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'increment') change(10);
          if (event.nativeEvent.actionName === 'decrement') change(-10);
        }} style={styles.meter}>
        <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: accent }]} /></View>
        <View style={styles.ticks}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tick => <View key={tick}
          style={[styles.tick, tick % 5 === 0 && styles.majorTick]} />)}</View>
      </View>
      <IconButton icon="plus" label={`${label} 10% 높이기`} disabled={disabled || percent === 100} onPress={() => change(10)} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  controls: { paddingBottom: 4 },
  selection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 48 },
  selectionName: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  selectionActions: { flexDirection: 'row' },
  listRow: { flexDirection: 'row', height: 96 }, listSwitch: { justifyContent: 'center', paddingRight: 6 },
  stripViewport: { height: 96, flexGrow: 1, flexShrink: 1 },
  listMessage: { justifyContent: 'center', width: 220, paddingHorizontal: 4 },
  name: { color: theme.text, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 }, value: { fontFamily: theme.mono, fontSize: 12 }, unit: { fontSize: 11 },
  intensityPill: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4, flexShrink: 0 },
  strip: { gap: 8, paddingVertical: 3 }, card: { width: 72, gap: 5 },
  cardFrame: { height: 61, borderRadius: 14, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.surface, padding: 3 },
  cardName: { color: theme.secondary, textAlign: 'center', fontSize: 11, lineHeight: 16, fontWeight: '500' },
  check: { width: 17, height: 17, borderRadius: 9, position: 'absolute', right: 0, bottom: -2, alignItems: 'center', justifyContent: 'center' },
  favoriteMark: { position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: 9,
    backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  adjustment: { gap: 16 }, caption: { color: theme.secondary, fontSize: 12, lineHeight: 18 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, captionText: { flex: 1 },
  groups: { gap: 6 }, group: { minHeight: 48, paddingHorizontal: 16, borderRadius: 24, justifyContent: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: theme.line },
  groupSelected: { backgroundColor: theme.accentSoft, borderColor: theme.accent }, groupName: { color: theme.secondary, fontSize: 13, fontWeight: '600' },
  groupNameSelected: { color: theme.accent },
  effects: { gap: 6 }, effect: { width: 66, minHeight: 70, borderRadius: 18, justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: 'transparent' },
  effectName: { color: theme.secondary, fontSize: 11 },
  amount: { borderRadius: 18, padding: 12, backgroundColor: theme.inset, gap: 4 },
  amountHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, minHeight: 30 },
  amountLabel: { color: theme.text, fontSize: 14, fontWeight: '500' }, amountValue: { fontFamily: theme.mono, fontSize: 22 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, meter: { flex: 1, minHeight: 48, justifyContent: 'center', gap: 7 },
  track: { height: 5, backgroundColor: theme.line, borderRadius: 3 }, fill: { height: 5, borderRadius: 3 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between' }, tick: { width: 1, height: 3, backgroundColor: theme.line },
  majorTick: { height: 6, backgroundColor: theme.secondary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  dateLabel: { color: theme.text, fontSize: 14, flex: 1 }, divider: { width: 1, height: 20, backgroundColor: theme.line },
  pressed: { opacity: 0.65 }, disabled: { opacity: 0.4 },
});
