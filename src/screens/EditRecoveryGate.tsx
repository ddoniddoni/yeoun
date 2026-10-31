import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RecoveryRecord, RestoredCapture } from '../domain/capture/recovery';
import { CAMERA_FILTERS } from '../domain/filters/cameraSettings';
import { editRecovery } from '../platform/storage/editRecovery';
import { clearPreviousSession } from '../platform/files/drafts';
import { clearExpiredSharedPhotos } from '../platform/files/sharedPhotos';
import { CameraAction } from './CameraControls';
import { CameraIcon } from './CameraIcon';
import { FilterFavoritesProvider } from './FilterFavorites';
import { M0CameraScreen } from './M0CameraScreen';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';

// A repeated startup effect must never clear a working copy restored by the first one.
let cleaned = false;
let startup: Promise<RecoveryRecord | null> | undefined;
function initialize() {
  if (!startup) startup = (async () => {
    if (!cleaned) { clearPreviousSession(); clearExpiredSharedPhotos(); cleaned = true; }
    return editRecovery.load();
  })().catch(error => { startup = undefined; throw error; });
  return startup;
}
type GateState = { phase: 'loading' | 'failed' } | { phase: 'offer'; record: RecoveryRecord }
  | { phase: 'ready'; restored?: RestoredCapture };
export function EditRecoveryGate() {
  const [state, setState] = useState<GateState>({ phase: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    void initialize().then(record => { if (active) setState(record ? { phase: 'offer', record } : { phase: 'ready' }); },
      () => { if (active) setState({ phase: 'failed' }); });
    return () => { active = false; };
  }, []);
  const act = async (action: 'retry' | 'resume' | 'discard') => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(undefined);
    try {
      if (action === 'resume') setState({ phase: 'ready', restored: await editRecovery.resume() });
      else if (action === 'discard') { await editRecovery.discard(); setState({ phase: 'ready' }); }
      else {
        const record = await initialize();
        setState(record ? { phase: 'offer', record } : { phase: 'ready' });
      }
    } catch {
      setError(action === 'discard' ? '사진을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'
        : '사진을 불러오지 못했어요. 저장 공간과 앱 버전을 확인한 뒤 다시 시도해 주세요.');
    } finally { pending.current = false; setBusy(false); }
  };
  const discard = () => Alert.alert('보관한 사진을 삭제할까요?', '이 편집 사진은 다시 불러올 수 없어요. 사진 앱에 저장한 사진은 그대로 남아요.', [
    { text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => { void act('discard'); } },
  ]);
  if (state.phase === 'ready') return <FilterFavoritesProvider><M0CameraScreen restored={state.restored} /></FilterFavoritesProvider>;
  const record = state.phase === 'offer' ? state.record : undefined;
  const filter = record ? CAMERA_FILTERS.find(item => item.id === record.snapshot.settings.filterId) : undefined;
  const palette = record ? filterPresentation[record.snapshot.settings.filterId] : undefined;
  const loading = state.phase === 'loading';
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.brand}>여운<Text style={styles.brandDot}> ·</Text></Text>
    <View style={[styles.memento, { backgroundColor: palette?.wash ?? theme.accentSoft }]}>
      {loading || busy ? <ActivityIndicator color={theme.accent} /> : <CameraIcon name="album" size={48} color={palette?.color ?? theme.accent} />}
    </View>
    <Text accessibilityRole="header" style={styles.title}>{loading ? '순간을 준비하고 있어요' : record ? '남겨 둔 순간이 있어요' : '보관함을 열지 못했어요'}</Text>
    <Text style={styles.description}>{loading ? '잠시만 기다려 주세요.' : record
      ? `${filter?.name ?? '선택한 색감'} · ${Math.round(record.snapshot.settings.intensity * 100)}%\n마지막으로 적용한 색감부터 이어갈 수 있어요.`
      : '저장 공간과 앱 버전을 확인한 뒤 다시 시도해 주세요. 보관한 사진은 아직 삭제하지 않았어요.'}</Text>
    {record ? <Text style={styles.note}>이 사진은 마지막 적용·저장 확인 후 24시간 동안 보관돼요.</Text> : null}
    {record?.galleryStatus === 'saving-gallery' ? <Text style={styles.note}>사진을 열면 앨범 저장 여부를 먼저 확인해요.</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {!loading ? <View style={styles.actions}>
      <CameraAction primary icon={record ? 'sliders' : 'reset'} label={record ? record.galleryStatus === 'saved' ? '사진 보기' : '이어서 편집' : '다시 시도'}
        disabled={busy} onPress={() => { void act(record ? 'resume' : 'retry'); }} />
      <CameraAction label="보관한 사진 삭제하고 촬영" disabled={busy} onPress={discard} />
    </View> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 16, backgroundColor: theme.background },
  brand: { color: theme.text, fontSize: 25, fontWeight: '700', letterSpacing: -1, marginBottom: 16 },
  brandDot: { color: theme.shutter },
  memento: { width: 120, height: 144, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { color: theme.text, fontSize: 24, fontWeight: '600', textAlign: 'center' },
  description: { color: theme.secondary, fontSize: 15, lineHeight: 24, textAlign: 'center' },
  note: { color: theme.secondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 16, maxWidth: 480, width: '100%' },
  error: { color: theme.error, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
