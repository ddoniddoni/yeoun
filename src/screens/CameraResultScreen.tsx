import { useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CaptureState, Output } from '../domain/capture/controller';
import { CAMERA_FILTERS, type CameraSettings } from '../domain/filters/cameraSettings';
import { CameraAction } from './CameraControls';
import { ResultPhotoComparison } from './ResultPhotoComparison';
import { ResultFilterEditor } from './ResultFilterEditor';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';

export function CameraResultScreen({ state, output, settings, foreground, returning, returnError, onSave, onReturn, onSettings, onPrepareOriginal, onEdit }: {
  state: CaptureState; output: Output; settings: CameraSettings; foreground: boolean;
  returning: boolean; returnError?: string; onSave(): void; onReturn(): void; onSettings(): void; onPrepareOriginal(): void;
  onEdit(settings: CameraSettings): Promise<boolean>;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [editorOpen, setEditorOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const closeEditor = () => {
    setEditorOpen(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const saved = state.phase === 'saved';
  const saving = state.phase === 'saving-gallery';
  const locked = saving || returning || !foreground || !!state.preparingOriginal || !!state.editing;
  const filter = CAMERA_FILTERS.find(item => item.id === settings.filterId);
  const accent = filterPresentation[settings.filterId].color;
  const ratio = output.width / output.height;
  const imageWidth = Math.min(width - insets.left - insets.right - 32, 560,
    Math.max(200, height - insets.top - insets.bottom - 330) * ratio);
  const requestReturn = () => {
    if (locked) return;
    if (editorOpen) { closeEditor(); return; }
    if (saved) { onReturn(); return; }
    Alert.alert('아직 저장하지 않은 사진이에요', '카메라로 돌아가면 이 임시 사진은 지워져요.', [
      { text: '사진으로 돌아가기', style: 'cancel' },
      { text: '버리고 돌아가기', style: 'destructive', onPress: onReturn },
    ]);
  };
  return <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={requestReturn}>
    <SafeAreaView style={styles.page}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <CameraAction label={editorOpen ? '‹ 편집 취소' : '‹ 카메라'} disabled={locked} onPress={requestReturn} />
          <Text accessibilityRole="header" style={styles.title}>남겨진 순간</Text>
        </View>
        <View style={styles.filterRow}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={styles.filterName}>{filter?.name}</Text>
          {settings.filterId !== 'original' ? <Text style={[styles.mono, { color: accent }]}>{Math.round(settings.intensity * 100)}%</Text> : null}
        </View>
        {settings.filterId !== 'original' ? <Text style={[styles.mono, { textAlign: 'center' }]}>
          입자 {Math.round(settings.grain * 100)}% · 빛 번짐 {Math.round(settings.bloom * 100)}%
          {settings.intensity === 0 ? ' · 강도 0%로 효과 꺼짐' : ''}
        </Text> : null}
        <ResultPhotoComparison key={output.uri} output={output} state={state}
          width={imageWidth} enabled={settings.filterId !== 'original' && settings.intensity > 0}
          locked={locked || editorOpen} filterName={filter?.name ?? '선택한 필터'} onPrepare={onPrepareOriginal} />
        {editorOpen ? <ResultFilterEditor settings={settings} disabled={locked} applying={!!state.editing}
          error={state.editError} onApply={onEdit} onClose={closeEditor} />
          : !saved ? <CameraAction label="저장 전 색감 바꾸기" disabled={locked}
            onPress={() => setEditorOpen(true)} /> : null}
        <View style={styles.panel}>
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {editorOpen ? '색감 적용 또는 취소 후 저장할 수 있어요.' : returning ? '카메라로 돌아가고 있어요' : saved ? '저장 완료 · 사진 앱에서 만나요' : saving
              ? '사진 앱에 저장하고 있어요' : state.phase === 'failed' ? '저장하지 못했어요' : '마음에 든 순간을 간직하세요'}
          </Text>
          {state.message ? <Text accessibilityRole="alert" style={styles.error}>{state.message}</Text> : null}
          {returnError ? <Text accessibilityRole="alert" style={styles.error}>{returnError}</Text> : null}
          <CameraAction primary label={saved ? '✓ 사진 앱에 저장됨' : saving ? '저장 중…' : state.phase === 'failed' ? '사진 저장 다시 시도' : '사진 앱에 저장'}
            disabled={locked || saved || editorOpen} onPress={onSave} />
          {state.phase === 'failed' ? <CameraAction label="저장 권한 설정 열기" disabled={locked} onPress={onSettings} /> : null}
          <CameraAction label={saved ? '다음 순간 촬영하기' : '카메라로 돌아가기'} disabled={locked || editorOpen} onPress={requestReturn} />
          <View style={styles.fileInfo}>
            <Text style={styles.mono}>{output.width} × {output.height}</Text>
            <Text style={styles.mono}>JPEG · {(output.bytes / 1024 / 1024).toFixed(1)} MB</Text>
          </View>
          <Text style={styles.footnote}>{saved ? '갤러리에 저장한 사진은 그대로 보관돼요.' : '아직 갤러리에 저장하지 않았어요. 앱을 닫기 전에 저장해 주세요.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background }, content: { flexGrow: 1, padding: 16, gap: 20 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: theme.text, fontSize: 18, fontWeight: '500' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 }, filterName: { color: theme.text, fontSize: 16 },
  panel: { gap: 12, padding: 16, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.line },
  status: { color: theme.text, fontSize: 16, lineHeight: 24 },
  error: { color: theme.error, fontSize: 14, lineHeight: 22 },
  fileInfo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8,
    borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 16, marginTop: 4 },
  mono: { color: theme.secondary, fontFamily: theme.mono, fontSize: 12 },
  footnote: { color: theme.secondary, fontSize: 12, lineHeight: 19 },
});
