import { useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CaptureState, Output } from '../domain/capture/controller';
import { CAMERA_FILTERS, type CameraSettings } from '../domain/filters/cameraSettings';
import { CameraAction, IconButton } from './CameraControls';
import { ResultPhotoComparison } from './ResultPhotoComparison';
import { ResultFilterEditor } from './ResultFilterEditor';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';

export function CameraResultScreen({ state, output, settings, foreground, returning, returnError, onSave, onShare, onReturn, onSettings, onPrepareOriginal, onEdit }: {
  state: CaptureState; output: Output; settings: CameraSettings; foreground: boolean;
  returning: boolean; returnError?: string; onSave(): void; onShare(): void; onReturn(): void; onSettings(): void; onPrepareOriginal(): void;
  onEdit(settings: CameraSettings): Promise<boolean>;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [editorOpen, setEditorOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const editorRevealed = useRef(false);
  const closeEditor = () => {
    setEditorOpen(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const saved = state.phase === 'saved';
  const saving = state.phase === 'saving-gallery';
  const locked = saving || returning || !foreground || !!state.preparingOriginal || !!state.editing || !!state.sharing;
  const filter = CAMERA_FILTERS.find(item => item.id === settings.filterId);
  const accent = filterPresentation[settings.filterId].color;
  const ratio = output.width / output.height;
  const imageWidth = Math.min(width - insets.left - insets.right - 32, 560,
    Math.max(200, height - insets.top - insets.bottom - 310) * ratio);
  const requestReturn = () => {
    if (locked) return;
    if (editorOpen) { closeEditor(); return; }
    if (saved) { onReturn(); return; }
    Alert.alert('사진 편집을 마칠까요?', '카메라로 돌아가면 이 임시 사진은 지워져요. 필요한 사진을 저장했는지 확인해 주세요.', [
      { text: '사진으로 돌아가기', style: 'cancel' },
      { text: '버리고 돌아가기', style: 'destructive', onPress: onReturn },
    ]);
  };
  return <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={requestReturn}>
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <IconButton icon={editorOpen ? 'close' : 'back'} label={editorOpen ? '편집 취소' : '카메라로 돌아가기'} disabled={locked} onPress={requestReturn} />
        <Text accessibilityRole="header" style={styles.title}>{editorOpen ? '색감 편집' : state.imported ? '가져온 순간' : '남겨진 순간'}</Text>
        <IconButton icon="share" label={state.sharing ? '사진 공유 중' : '사진 공유'}
          hint="현재 적용된 사진을 시스템 공유창으로 보내요. 앨범에 먼저 저장하지 않아도 돼요."
          disabled={locked || editorOpen} onPress={onShare} />
      </View>
      <ScrollView ref={scroll} style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.filterRow}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text numberOfLines={1} style={styles.filterName}>{filter?.name}</Text>
          {settings.filterId !== 'original' ? <Text style={[styles.mono, { color: accent }]}>{Math.round(settings.intensity * 100)}%</Text> : null}
        </View>
        <ResultPhotoComparison key={output.uri} output={output} state={state}
          width={imageWidth} enabled={settings.filterId !== 'original' && settings.intensity > 0}
          locked={locked || editorOpen} filterName={filter?.name ?? '선택한 필터'} onPrepare={onPrepareOriginal} />
        {editorOpen ? <View onLayout={event => {
          if (editorRevealed.current) return;
          editorRevealed.current = true;
          scroll.current?.scrollTo({ y: event.nativeEvent.layout.y, animated: false });
        }}><ResultFilterEditor settings={settings} disabled={locked} applying={!!state.editing}
          error={state.editError} imported={!!state.imported} onApply={onEdit} onClose={closeEditor} /></View>
          : !saved ? <CameraAction icon="sliders" label="색감 편집" disabled={locked}
            onPress={() => { editorRevealed.current = false; setEditorOpen(true); }} /> : null}
        <View style={styles.fileInfo}>
          <Text style={styles.mono}>{output.width} × {output.height}</Text>
          <Text style={styles.mono}>JPEG · {(output.bytes / 1024 / 1024).toFixed(1)} MB</Text>
        </View>
        {state.imported ? <Text style={styles.status}>
          {state.imported.resized ? '최대 1,200만 화소·긴 변 4,096px 안으로 줄였어요. ' : ''}
          {state.imported.flattened ? '투명한 부분은 흰색으로 채웠어요. ' : ''}
          앨범의 원본은 그대로 남아요.{settings.dateStamp ? ' 날짜 도장은 가져온 날짜예요.' : ''}
        </Text> : null}
      </ScrollView>
      <View style={styles.panel}>
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {state.sharing ? '공유창에서 돌아오면 사진을 계속 볼 수 있어요.' : editorOpen ? '편집을 마치면 저장하거나 공유할 수 있어요.' : returning ? '카메라로 돌아가는 중' : saved ? '사진 앱에 저장했어요' : saving
            ? '사진 앱에 저장하는 중…' : state.phase === 'failed' ? '저장하지 못했어요' : '사진을 저장하거나 공유할 수 있어요.'}
        </Text>
        {state.message ? <Text accessibilityRole="alert" style={styles.error}>{state.message}</Text> : null}
        {state.shareError ? <Text accessibilityRole="alert" style={styles.error}>{state.shareError}</Text> : null}
        {returnError ? <Text accessibilityRole="alert" style={styles.error}>{returnError}</Text> : null}
        {saved ? <CameraAction primary icon="camera" label="다음 순간 촬영" disabled={locked} onPress={requestReturn} />
          : <CameraAction primary icon="download" label={saving ? '저장 중…' : state.phase === 'failed' ? '다시 저장' : '사진 저장'}
            disabled={locked || editorOpen} onPress={onSave} />}
        {state.phase === 'failed' ? <CameraAction label="저장 권한 설정" disabled={locked} onPress={onSettings} /> : null}
      </View>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background }, scroll: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, minHeight: 56 },
  title: { color: theme.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  filterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 24 },
  dot: { width: 5, height: 5, borderRadius: 3 }, filterName: { color: theme.text, fontSize: 14, flexShrink: 1 },
  panel: { gap: 10, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: theme.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  status: { color: theme.secondary, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  error: { color: theme.error, fontSize: 13, lineHeight: 20 },
  fileInfo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  mono: { color: theme.secondary, fontFamily: theme.mono, fontSize: 10 },
});
