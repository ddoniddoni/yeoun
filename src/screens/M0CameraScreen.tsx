import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { CaptureController, type CaptureState } from '../domain/capture/controller';
import { cameraSettings, cameraSettingsKey, copyCameraSettings, type CameraFilterId } from '../domain/filters/cameraSettings';
import { createGrainSeed } from '../domain/filters/grainSeed';
import { CameraPreview } from '../platform/camera/CameraPreview';
import { capturePhoto } from '../platform/camera/capturePhoto';
import { removeFile } from '../platform/files/drafts';
import { saveToGallery } from '../platform/media/gallery';
import { exportPhoto } from '../rendering/adapters/exportPhoto';
import type { FilterStatus } from '../rendering/adapters/cameraLut';
import { FilterControls } from './FilterControls';
import { CameraDiagnosticsScreen } from './CameraDiagnosticsScreen';
import { CameraAction, FrameCorners, ShutterButton } from './CameraControls';
import { CameraResultScreen } from './CameraResultScreen';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';
const PHOTO_SIZE = { width: 4032, height: 3024 };
const LABELS: Record<CaptureState['phase'], string> = {
  idle: '오늘의 빛을, 오래 남을 색으로.', capturing: '순간을 담고 있어요', rendering: '사진에 색감을 입히고 있어요',
  'file-ready': '파일 준비 완료 · 아직 갤러리에 저장하지 않았어요',
  'saving-gallery': '갤러리에 저장 중', saved: '갤러리 저장 완료', failed: '작업 실패', cancelled: '앱 중단으로 촬영을 취소했어요',
};
export function M0CameraScreen() {
  const permission = useCameraPermission();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const previewWidth = Math.min(width - insets.left - insets.right - 32, 480,
    Math.max(180, (height - insets.top - insets.bottom - 400) * 3 / 4));
  const [position, setPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(position, { physicalDevices: ['wide-angle'] });
  const photoOutput = usePhotoOutput({ targetResolution: PHOTO_SIZE, containerFormat: 'jpeg', quality: 0.94, qualityPrioritization: 'quality' });
  const [settings, setSettings] = useState(() => cameraSettings('light-afternoon'));
  const [grainSeed, setGrainSeed] = useState(createGrainSeed);
  const [filterRevision, setFilterRevision] = useState(0);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>();
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState<string>();
  const discardPending = useRef(false);
  const [cameraStopped, setCameraStopped] = useState(false);
  const [info, setInfo] = useState('실제 프레임 관측 대기');
  const [state, setState] = useState<CaptureState>({ phase: 'idle' });
  const filterRequestKey = `${cameraSettingsKey(settings)}/${filterRevision}/${grainSeed}/${device?.id ?? 'none'}/${foreground}`;
  const currentFilterStatus = filterStatus?.key === filterRequestKey ? filterStatus : undefined;
  const filterReady = currentFilterStatus?.phase === 'ready';
  const markReady = useCallback(() => setReady(true), []);
  const markStopped = useCallback(() => setReady(false), []);
  const onRunningChange = useCallback((running: boolean) => setCameraStopped(!running), []);
  const showError = useCallback((error: unknown) => setCameraError(String(error)), []);
  const onCameraError = useCallback((error: Error) => { setReady(false); setCameraError(String(error)); }, []);
  const controller = useMemo(() => new CaptureController({
    capture: snapshot => capturePhoto(photoOutput, snapshot), render: exportPhoto,
    save: saveToGallery, remove: removeFile,
  }, setState), [photoOutput]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      setForeground(next === 'active');
      if (next !== 'active') {
        setReady(false);
        if (controller.state.phase === 'capturing' || controller.state.phase === 'rendering') controller.interrupt();
      }
    });
    return () => { sub.remove(); controller.close(); };
  }, [controller]);
  const busy = state.phase === 'capturing' || state.phase === 'rendering' || state.phase === 'saving-gallery';
  const canCapture = ['idle', 'cancelled'].includes(state.phase);
  const resultOpen = !!state.output;
  const overlayOpen = diagnosticsOpen || resultOpen;
  const shutterDisabled = !permission.hasPermission || !device || !ready || !filterReady ||
    !foreground || !!cameraError || busy || !canCapture || overlayOpen || returning;
  const accent = filterPresentation[settings.filterId].color;
  const selectFilter = (id: CameraFilterId) => {
    setSettings(cameraSettings(id)); setFilterRevision(value => value + 1);
  };
  const openSettings = () => { void Linking.openSettings().catch(showError); };
  const closeDiagnostics = useCallback(() => {
    setReady(false); setDiagnosticsOpen(false); setFilterRevision(value => value + 1);
    if (permission.hasPermission && device && foreground && !cameraError) setCameraStopped(false);
  }, [permission.hasPermission, device, foreground, cameraError]);
  const discardAndReturn = async () => {
    if (discardPending.current || ['capturing', 'rendering', 'saving-gallery'].includes(controller.state.phase)) return;
    discardPending.current = true; setReturning(true); setReturnError(undefined);
    setReady(false); setFilterRevision(value => value + 1);
    if (permission.hasPermission && device && foreground && !cameraError) setCameraStopped(false);
    try { await controller.discard(); setGrainSeed(createGrainSeed()); }
    catch (error) { setReturnError(`임시 사진을 정리하지 못했어요. 다시 시도해 주세요. ${String(error)}`); }
    finally { discardPending.current = false; setReturning(false); }
  };
  return <>
    <StatusBar barStyle="light-content" />
    <ScrollView style={styles.page} contentContainerStyle={styles.content}
      accessibilityElementsHidden={overlayOpen} importantForAccessibility={overlayOpen ? 'no-hide-descendants' : 'auto'}>
      <View style={styles.header}>
        <View style={styles.brandRow}><Text accessibilityRole="header" style={styles.brand}>여운</Text>
          <View style={[styles.brandDot, { backgroundColor: accent }]} /></View>
        <Text style={styles.edition}>오늘의 빛, 나의 색</Text>
      </View>
      <View style={styles.viewfinderArea}>
        <View style={styles.frameLabel}><Text style={styles.metadata}>PHOTO</Text>
          <Text style={styles.metadata}>3:4 · {position === 'back' ? '후면' : '전면'}</Text></View>
        {!permission.hasPermission ? <View style={[styles.emptyFrame, { width: previewWidth }]}>
          <Text style={styles.welcome}>오늘의 빛을,{"\n"}오래 남을 색으로.</Text>
          <Text style={styles.text}>눈앞의 순간에 색감을 더해 보세요. 촬영하려면 카메라 권한이 필요해요.</Text>
          {permission.canRequestPermission
            ? <CameraAction primary label="카메라 시작" onPress={() => { void permission.requestPermission().catch(showError); }} />
            : <CameraAction primary label="설정에서 카메라 허용" onPress={openSettings} />}
          <Text style={styles.info}>사진은 기기 안에서만 처리해요.</Text>
        </View> : !device ? <View style={[styles.emptyFrame, { width: previewWidth }]}>
          <Text style={styles.welcome}>카메라를 찾지 못했어요</Text>
          <Text style={styles.text}>아래 전환 버튼으로 다른 카메라를 선택해 주세요.</Text>
        </View> : <View style={[styles.viewfinder, { width: previewWidth }]}>
          <CameraPreview key={device.id} device={device} photoOutput={photoOutput}
            active={foreground && !cameraError && !overlayOpen} settings={settings} grainSeed={grainSeed} filterRequestKey={filterRequestKey}
            onFilterStatus={setFilterStatus} onReady={markReady} onStopped={markStopped}
            onRunningChange={onRunningChange} onError={onCameraError} onInfo={setInfo} />
          <FrameCorners />
        </View>}
      </View>
      {cameraError ? <View style={styles.notice}>
        <Text accessibilityRole="alert" style={styles.error}>{cameraError}</Text>
        <CameraAction label="카메라 다시 연결" onPress={() => { setReady(false); setCameraError(undefined); setFilterRevision(value => value + 1); }} />
      </View> : null}
      <View style={styles.deck}>
        <FilterControls settings={settings} disabled={busy || !canCapture || returning}
          onSelect={selectFilter} onIntensity={intensity => {
            setSettings(copyCameraSettings({ ...settings, intensity })); setFilterRevision(value => value + 1);
          }} onTexture={(control, value) => {
            setSettings(copyCameraSettings({ ...settings, [control]: value })); setFilterRevision(value => value + 1);
          }} onReset={() => selectFilter(settings.filterId)} />
        {permission.hasPermission && device && !filterReady ? <Text accessibilityLiveRegion="polite" style={styles.info}>
          {currentFilterStatus?.phase === 'error' ? currentFilterStatus.message
            : currentFilterStatus?.phase === 'applying' ? '색감을 적용하고 있어요…' : '색감 준비 중 · 잠시 원본으로 보여드려요.'}
        </Text> : null}
        {currentFilterStatus?.phase === 'error' ? <View style={styles.notice}>
          <CameraAction label="색감 다시 불러오기" disabled={busy || !canCapture} onPress={() => setFilterRevision(value => value + 1)} />
          <CameraAction label="원본으로 전환" disabled={busy || !canCapture} onPress={() => selectFilter('original')} />
        </View> : null}
        <View style={styles.captureRow}>
          <View style={styles.sideControl}><Text style={styles.smallLabel}>색감 초안</Text>
            <Text style={styles.info}>대표 3종</Text></View>
          <ShutterButton disabled={shutterDisabled} busy={busy} onPress={() => {
            if (!shutterDisabled) void controller.capture(settings, position, grainSeed).then(() => {
              if (controller.state.phase === 'cancelled') setGrainSeed(createGrainSeed());
            });
          }} />
          <Pressable accessibilityRole="button" accessibilityLabel={position === 'back' ? '전면 카메라로 전환' : '후면 카메라로 전환'}
            disabled={busy || !canCapture || returning} accessibilityState={{ disabled: busy || !canCapture || returning }}
            onPress={() => { setReady(false); setCameraError(undefined); setPosition(value => value === 'back' ? 'front' : 'back'); }}
            style={({ pressed }) => [styles.sideControl, styles.switchButton, pressed && styles.pressed,
              (busy || !canCapture || returning) && styles.disabled]}>
            <Text style={styles.switchIcon}>↻</Text><Text style={styles.smallLabel}>전환</Text>
          </Pressable>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.captureStatus}>{LABELS[state.phase]}</Text>
        {state.message && !resultOpen ? <Text accessibilityRole="alert" style={styles.error}>{state.message}</Text> : null}
        {returnError && !resultOpen ? <Text accessibilityRole="alert" style={styles.error}>{returnError}</Text> : null}
        {state.phase === 'failed' && state.canRetryRender && !resultOpen ? <CameraAction
          label="보관한 원본으로 다시 처리" disabled={busy || !foreground || returning} onPress={() => {
            void controller.retryRender().then(() => {
              if (controller.state.phase === 'cancelled') setGrainSeed(createGrainSeed());
            });
          }} /> : null}
        {state.phase === 'failed' && !resultOpen ? <CameraAction label="임시 사진 버리고 다시 촬영"
          disabled={busy || returning} onPress={() => { void discardAndReturn(); }} /> : null}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footnote}>사진은 기기 안에만 머물러요.</Text>
        {__DEV__ ? <Pressable accessibilityRole="button" disabled={busy || !foreground || returning}
          accessibilityState={{ disabled: busy || !foreground || returning }} style={styles.diagnostics}
          onPress={() => {
            if (!__DEV__ || !foreground || discardPending.current || ['capturing', 'rendering', 'saving-gallery'].includes(controller.state.phase)) return;
            setReady(false); setDiagnosticsOpen(true);
          }}><Text style={styles.footnote}>개발 진단 ›</Text></Pressable> : null}
      </View>
    </ScrollView>
    {state.output ? <CameraResultScreen state={state} output={state.output} settings={settings} foreground={foreground}
      returning={returning} returnError={returnError} onReturn={() => { void discardAndReturn(); }}
      onSave={() => { if (!discardPending.current) void controller.save(); }}
      onSettings={() => { void Linking.openSettings().catch(error => setReturnError(String(error))); }} /> : null}
    {__DEV__ && diagnosticsOpen ? <CameraDiagnosticsScreen frameInfo={info} settings={settings} grainSeed={grainSeed}
      filterPhase={currentFilterStatus?.phase ?? '미리보기 대기'} cameraError={cameraError}
      canRun={foreground && (!permission.hasPermission || !device || cameraStopped)} onClose={closeDiagnostics} /> : null}
  </>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background }, content: { flexGrow: 1, paddingBottom: 12 },
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { color: theme.text, fontSize: 25, fontWeight: '500', letterSpacing: 4 },
  brandDot: { width: 5, height: 5, borderRadius: 3 }, edition: { color: theme.secondary, fontSize: 12 },
  viewfinderArea: { paddingHorizontal: 16, alignItems: 'center', paddingBottom: 12 },
  frameLabel: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingBottom: 8 },
  metadata: { color: theme.secondary, fontFamily: theme.mono, fontSize: 11, letterSpacing: 1 },
  viewfinder: { backgroundColor: theme.inset, overflow: 'hidden' },
  emptyFrame: { minHeight: 320, padding: 24, gap: 20, justifyContent: 'center', backgroundColor: theme.inset },
  welcome: { color: theme.text, fontSize: 25, lineHeight: 36, fontWeight: '500' },
  text: { color: theme.secondary, fontSize: 15, lineHeight: 24 },
  info: { color: theme.secondary, fontSize: 13, lineHeight: 20 },
  deck: { paddingHorizontal: 20, paddingBottom: 12, gap: 12, borderTopWidth: 1, borderTopColor: theme.line },
  notice: { padding: 16, gap: 12 }, error: { color: theme.error, fontSize: 14, lineHeight: 22 },
  captureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingTop: 4 },
  sideControl: { width: 72, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4 },
  smallLabel: { color: theme.secondary, fontSize: 13 },
  switchButton: { borderWidth: 1, borderColor: theme.line, borderRadius: 8, padding: 8 },
  switchIcon: { color: theme.text, fontSize: 26, lineHeight: 28 },
  captureStatus: { color: theme.secondary, fontSize: 12, textAlign: 'center', lineHeight: 20 },
  footer: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  footnote: { color: theme.secondary, fontSize: 11, lineHeight: 18 },
  diagnostics: { minHeight: 48, minWidth: 48, justifyContent: 'center', paddingHorizontal: 8 },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
});
