import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { CaptureController, type CaptureState } from '../domain/capture/controller';
import { selectedFlashMode, type FlashSelection } from '../domain/capture/flash';
import { cameraSettings, cameraSettingsKey, copyCameraSettings, type CameraFilterId } from '../domain/filters/cameraSettings';
import { createGrainSeed } from '../domain/filters/grainSeed';
import { CameraPreview, type CameraPreviewHandle } from '../platform/camera/CameraPreview';
import type { MeteringState } from '../domain/capture/meteringSession';
import { capturePhoto } from '../platform/camera/capturePhoto';
import { removeFile } from '../platform/files/drafts';
import { saveToGallery } from '../platform/media/gallery';
import { exportOriginalComparison, exportPhoto } from '../rendering/adapters/exportPhoto';
import type { FilterStatus } from '../rendering/adapters/cameraLut';
import { FilterControls, FilterAdjustmentPanel } from './FilterControls';
import { CameraSheet } from './CameraSheet';
import { CameraDiagnosticsScreen } from './CameraDiagnosticsScreen';
import { CameraAction, FrameCorners, ShutterButton } from './CameraControls';
import { CameraResultScreen } from './CameraResultScreen';
import { CameraAssistControls, CameraGrid } from './CameraAssistControls';
import { CameraMeteringControls, FocusTarget } from './CameraMeteringControls';
import { OriginalComparisonControls } from './OriginalComparisonControls';
import { usePreviewComparison } from './usePreviewComparison';
import { cameraTheme as theme, filterPresentation } from './cameraTheme';
const PHOTO_SIZE = { width: 4032, height: 3024 };
const LABELS: Record<CaptureState['phase'], string> = {
  idle: '오늘의 빛을, 오래 남을 색으로.', capturing: '순간을 담고 있어요', rendering: '사진에 색감을 입히고 있어요',
  'file-ready': '파일 준비 완료 · 아직 갤러리에 저장하지 않았어요',
  'saving-gallery': '갤러리에 저장 중', saved: '갤러리 저장 완료', failed: '작업 실패', cancelled: '앱 중단으로 촬영을 취소했어요',
};
export function M0CameraScreen() {
  const permission = useCameraPermission();
  const { width, fontScale } = useWindowDimensions();
  const [viewfinderSize, setViewfinderSize] = useState({ width, height: 180 });
  const previewWidth = Math.max(1, Math.min(viewfinderSize.width, viewfinderSize.height * 3 / 4));
  const [panel, setPanel] = useState<'camera' | 'filter'>();
  const [position, setPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(position, { physicalDevices: ['wide-angle'] });
  const [grid, setGrid] = useState(true);
  const [flashSelection, setFlashSelection] = useState<FlashSelection>();
  const flashMode = selectedFlashMode(flashSelection, device);
  useEffect(() => { setFlashSelection(undefined); }, [device?.id, device?.hasFlash]);
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
  const preview = useRef<CameraPreviewHandle>(null);
  const [meteringState, setMeteringState] = useState<MeteringState>({ deviceId: '', ready: false, busy: false });
  const metering: MeteringState = meteringState.deviceId === device?.id ? meteringState
    : { deviceId: device?.id ?? '', ready: false, busy: false };
  const comparisonContext = `${cameraSettingsKey(settings)}/${filterRevision}/${grainSeed}/${device?.id ?? 'none'}/${foreground}`;
  const markReady = useCallback(() => setReady(true), []);
  const markStopped = useCallback(() => setReady(false), []);
  const onRunningChange = useCallback((running: boolean) => setCameraStopped(!running), []);
  const showError = useCallback((error: unknown) => setCameraError(String(error)), []);
  const onCameraError = useCallback((error: Error) => { setReady(false); setCameraError(String(error)); }, []);
  const controller = useMemo(() => new CaptureController({
    capture: snapshot => capturePhoto(photoOutput, snapshot), render: exportPhoto, renderOriginal: exportOriginalComparison,
    save: saveToGallery, remove: removeFile,
  }, setState), [photoOutput]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      setForeground(next === 'active');
      if (next !== 'active') {
        setReady(false);
        if (controller.state.phase === 'capturing' || controller.state.phase === 'rendering' || controller.state.preparingOriginal || controller.state.editing) controller.interrupt();
      }
    });
    return () => { sub.remove(); controller.close(); };
  }, [controller]);
  const busy = state.phase === 'capturing' || state.phase === 'rendering' || state.phase === 'saving-gallery';
  const canCapture = ['idle', 'cancelled'].includes(state.phase);
  const resultOpen = !!state.output;
  const overlayOpen = diagnosticsOpen || resultOpen;
  const assistDisabled = !permission.hasPermission || !device || !ready || !foreground || !!cameraError ||
    busy || !canCapture || overlayOpen || returning;
  const hasStyle = settings.filterId !== 'original' && settings.intensity > 0;
  const comparisonAvailable = hasStyle && permission.hasPermission && !!device && ready && foreground &&
    !cameraError && !busy && canCapture && !overlayOpen && !returning;
  const comparison = usePreviewComparison(settings, comparisonContext, comparisonAvailable);
  const filterRequestKey = comparison.requestKey;
  const currentFilterStatus = filterStatus?.key === filterRequestKey ? filterStatus : undefined;
  const filterReady = currentFilterStatus?.phase === 'ready';
  const shutterDisabled = !permission.hasPermission || !device || !ready || !filterReady ||
    !foreground || !!cameraError || busy || !canCapture || overlayOpen || returning || comparison.active || !metering.ready || metering.busy || panel !== undefined;
  const meteringDisabled = assistDisabled || comparison.active;
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
    if (discardPending.current || controller.state.preparingOriginal || controller.state.editing || ['capturing', 'rendering', 'saving-gallery'].includes(controller.state.phase)) return;
    discardPending.current = true; setReturning(true); setReturnError(undefined);
    setReady(false); setFilterRevision(value => value + 1);
    if (permission.hasPermission && device && foreground && !cameraError) setCameraStopped(false);
    try { await controller.discard(); setGrainSeed(createGrainSeed()); }
    catch (error) { setReturnError(`임시 사진을 정리하지 못했어요. 다시 시도해 주세요. ${String(error)}`); }
    finally { discardPending.current = false; setReturning(false); }
  };
  const controlsHidden = overlayOpen || panel !== undefined;
  const settingsDisabled = busy || !canCapture || returning;
  const flashLabel = flashMode === 'off' ? '끔' : flashMode === 'auto' ? '자동' : '켬';
  const exposureLabel = metering.exposure === undefined ? undefined
    : `${metering.unit === 'step' ? '노출' : 'EV'} ${metering.exposure > 0 ? '+' : ''}${metering.unit === 'step'
      ? `${metering.exposure} 단계` : metering.exposure.toFixed(1)}`;
  return <>
    <StatusBar barStyle="light-content" />
    <View style={styles.page} accessibilityElementsHidden={controlsHidden}
      importantForAccessibility={controlsHidden ? 'no-hide-descendants' : 'auto'}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={`플래시 ${flashLabel}, 촬영 설정 열기`}
          disabled={settingsDisabled} accessibilityState={{ disabled: settingsDisabled }} onPress={() => setPanel('camera')}
          style={({ pressed }) => [styles.toolbarAction, pressed && styles.pressed, settingsDisabled && styles.disabled]}>
          <Text style={styles.toolbarText}>ϟ <Text style={styles.smallLabel}>{flashLabel}</Text></Text>
        </Pressable>
        <View style={styles.brandRow}><Text accessibilityRole="header" accessibilityLabel="여운" style={styles.brand}>YEOWUN</Text>
          <View style={[styles.brandDot, { backgroundColor: accent }]} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel="촬영 설정 열기" onPress={() => setPanel('camera')}
          disabled={settingsDisabled} accessibilityState={{ disabled: settingsDisabled }}
          style={({ pressed }) => [styles.toolbarAction, pressed && styles.pressed, settingsDisabled && styles.disabled]}>
          <View accessible={false} style={styles.settingsIcon}>
            {[0, 1, 2].map(index => <View key={index} style={styles.settingsLine}>
              <View style={[styles.settingsKnob, { left: index === 1 ? 5 : 15 }]} />
            </View>)}
          </View>
        </Pressable>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.viewfinderArea, (!permission.hasPermission || !device) && { minHeight: 340 * fontScale }]} onLayout={event => {
          const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
          setViewfinderSize(previous => previous.width === nextWidth && previous.height === nextHeight
            ? previous : { width: nextWidth, height: nextHeight });
        }}>
          <View style={styles.previewCenter}>
            {!permission.hasPermission ? <View style={styles.emptyFrame}>
              <Text style={styles.welcome}>오늘의 빛을,{"\n"}오래 남을 색으로.</Text>
              <Text style={styles.text}>눈앞의 순간에 색감을 더해 보세요.</Text>
              {permission.canRequestPermission
                ? <CameraAction primary label="카메라 시작" onPress={() => { void permission.requestPermission().catch(showError); }} />
                : <CameraAction primary label="설정에서 카메라 허용" onPress={openSettings} />}
            </View> : !device ? <View style={styles.emptyFrame}>
              <Text style={styles.welcome}>카메라를 찾지 못했어요</Text>
              <Text style={styles.text}>아래 전환 버튼으로 다른 카메라를 선택해 주세요.</Text>
            </View> : <View style={[styles.viewfinder, { width: previewWidth }]}>
              <CameraPreview ref={preview} key={device.id} device={device} photoOutput={photoOutput}
                controlsEnabled={!meteringDisabled} onMetering={setMeteringState}
                active={foreground && !cameraError && !overlayOpen} settings={comparison.previewSettings} grainSeed={grainSeed} filterRequestKey={filterRequestKey}
                onFilterStatus={setFilterStatus} onReady={markReady} onStopped={markStopped}
                onRunningChange={onRunningChange} onError={onCameraError} onInfo={setInfo} />
              {grid ? <CameraGrid /> : null}
              <FrameCorners />
              <Pressable accessible={false} importantForAccessibility="no" style={StyleSheet.absoluteFill}
                disabled={meteringDisabled || !metering.ready || metering.busy || !metering.focusSupported}
                onPress={event => { void preview.current?.focus({ x: event.nativeEvent.locationX / previewWidth,
                  y: event.nativeEvent.locationY / (previewWidth * 4 / 3) }); }} />
              <FocusTarget state={metering} />
              <View pointerEvents="none" style={styles.frameLabel}>
                <Text style={styles.badge}>{comparison.active ? filterReady ? '원본 비교' : '원본 전환 중' : '3:4'}</Text>
                {exposureLabel ? <Text style={styles.badge}>{exposureLabel}</Text> : null}
              </View>
              <View pointerEvents="box-none" style={styles.filterNotice}>
                {currentFilterStatus?.phase === 'error' ? <Pressable accessibilityRole="button"
                  accessibilityLabel="색감을 불러오지 못했어요. 해결 방법 열기" style={styles.filterError}
                  onPress={() => setPanel('filter')}>
                  <Text style={styles.filterNoticeText}>색감을 불러오지 못했어요 · 해결 ›</Text>
                </Pressable> : !filterReady && !comparison.active ? <Text pointerEvents="none"
                  accessibilityLiveRegion="polite" style={styles.filterNoticeText}>
                  {currentFilterStatus?.phase === 'applying' ? '색감을 적용하고 있어요…' : '색감 준비 중…'}
                </Text> : null}
              </View>
            </View>}
          </View>
        </View>
        <View style={styles.deck}>
          <FilterControls settings={settings} disabled={settingsDisabled} onSelect={selectFilter} onOpen={() => setPanel('filter')} />
          {cameraError ? <View style={styles.notice}>
            <Text accessibilityRole="alert" style={styles.error}>{cameraError}</Text>
            <CameraAction label="카메라 다시 연결" onPress={() => { setReady(false); setCameraError(undefined); setFilterRevision(value => value + 1); }} />
          </View> : null}
          {metering.error ? <Pressable accessibilityRole="button" accessibilityLabel={`${metering.error} 촬영 설정 열기`}
            style={styles.notice} onPress={() => setPanel('camera')}><Text style={styles.error}>{metering.error} ›</Text></Pressable> : null}
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
      </ScrollView>
      <View style={styles.captureRow}>
        <Pressable accessibilityRole="switch" accessibilityLabel="원본 비교" accessibilityHint="미리보기만 원본으로 바꿔요. 다시 누르면 색감으로 돌아가요."
          accessibilityState={{ checked: comparison.pinned, disabled: !comparisonAvailable }} disabled={!comparisonAvailable}
          onPress={comparison.toggle} style={({ pressed }) => [styles.sideControl, pressed && styles.pressed,
            !comparisonAvailable && styles.disabled, comparison.active && styles.selected]}>
          <View accessible={false} style={styles.compareIcon}><View style={styles.compareHalf} /></View>
          <Text style={styles.smallLabel}>{comparison.pinned ? '색감 복귀' : '원본 비교'}</Text>
        </Pressable>
        <ShutterButton disabled={shutterDisabled} busy={busy} onPress={() => {
          const exposure = preview.current?.captureExposure();
          if (!shutterDisabled && exposure) void controller.capture(settings, position, grainSeed, flashMode, exposure).then(() => {
            if (controller.state.phase === 'cancelled') setGrainSeed(createGrainSeed());
          });
        }} />
        <Pressable accessibilityRole="button" accessibilityLabel={position === 'back' ? '전면 카메라로 전환' : '후면 카메라로 전환'}
          disabled={busy || metering.busy || !canCapture || returning} accessibilityState={{ disabled: busy || metering.busy || !canCapture || returning }}
          onPress={() => { setReady(false); setCameraError(undefined); setFlashSelection(undefined); setPosition(value => value === 'back' ? 'front' : 'back'); }}
          style={({ pressed }) => [styles.sideControl, pressed && styles.pressed,
            (busy || metering.busy || !canCapture || returning) && styles.disabled]}>
          <Text style={styles.switchIcon}>↻</Text><Text style={styles.smallLabel}>전환</Text>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" numberOfLines={2} style={[styles.captureStatus, { height: 36 * fontScale + 4 }]}>
        {comparison.active ? '원본 비교 중 · 색감으로 돌아가면 촬영할 수 있어요' : metering.busy ? metering.message
          : state.phase !== 'idle' ? LABELS[state.phase] : ' '}
      </Text>
    </View>
    {panel && !overlayOpen ? <CameraSheet title={panel === 'camera' ? '촬영 설정' : '나의 색감'} onClose={() => {
      comparison.release(); setPanel(undefined);
    }}>
      {panel === 'camera' ? <>
        {permission.hasPermission && device ? <>
          <CameraAssistControls grid={grid} flashMode={flashMode} hasFlash={device.hasFlash} disabled={assistDisabled}
            onGrid={() => setGrid(value => !value)} onFlash={mode => {
              if (!assistDisabled && device.hasFlash) setFlashSelection({ deviceId: device.id, mode });
            }} />
          <CameraMeteringControls state={metering} disabled={meteringDisabled}
            onFocusCenter={() => { void preview.current?.focus({ x: 0.5, y: 0.5 }); }}
            onExposure={value => { void preview.current?.expose(value); }}
            onReconnect={() => { void preview.current?.reconnectMetering(); }} />
        </> : <Text style={styles.info}>카메라를 허용하면 촬영 설정을 사용할 수 있어요.</Text>}
        <Text style={styles.info}>사진은 기기 안에서만 처리해요.</Text>
        {__DEV__ ? <CameraAction label="개발 진단" disabled={busy || !foreground || returning} onPress={() => {
          if (!__DEV__ || !foreground || discardPending.current || ['capturing', 'rendering', 'saving-gallery'].includes(controller.state.phase)) return;
          setPanel(undefined); setReady(false); setDiagnosticsOpen(true);
        }} /> : null}
      </> : <>
        {currentFilterStatus?.phase === 'error' ? <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.error}>{currentFilterStatus.message}</Text>
          <CameraAction label="색감 다시 불러오기" disabled={settingsDisabled} onPress={() => setFilterRevision(value => value + 1)} />
          <CameraAction label="원본으로 전환" disabled={settingsDisabled} onPress={() => selectFilter('original')} />
        </View> : null}
        <FilterAdjustmentPanel settings={settings} disabled={settingsDisabled} onSelect={selectFilter}
          onIntensity={intensity => {
            setSettings(copyCameraSettings({ ...settings, intensity })); setFilterRevision(value => value + 1);
          }} onTexture={(control, value) => {
            setSettings(copyCameraSettings({ ...settings, [control]: value })); setFilterRevision(value => value + 1);
          }} onDateStamp={dateStamp => {
            setSettings(copyCameraSettings({ ...settings, dateStamp })); setFilterRevision(value => value + 1);
          }} onReset={() => selectFilter(settings.filterId)} />
        {settings.filterId === 'retro-digital' || settings.filterId === 'retro-film' ? <>
          <Text style={styles.info}>{device?.hasFlash
            ? '직광 플래시 스냅 · 플래시는 셔터를 누를 때 터져요. 밝아진 피사체와 배경의 차이는 촬영 결과에서 확인해 주세요.'
            : '직광 플래시 스냅은 플래시를 지원하는 후면 카메라에서 사용할 수 있어요.'}</Text>
          {device?.hasFlash ? <CameraAction
            label={flashMode === 'on' ? '플래시 켜짐 · 끄기' : flashMode === 'auto' ? '플래시 자동 · 항상 켜기' : '스냅 플래시 켜기'}
            disabled={assistDisabled} primary={flashMode === 'on'} onPress={() => {
              if (!assistDisabled && device.hasFlash) {
                setFlashSelection({ deviceId: device.id, mode: flashMode === 'on' ? 'off' : 'on' });
              }
            }} /> : null}
        </> : null}
        {hasStyle ? <OriginalComparisonControls active={comparison.active} pinned={comparison.pinned}
          disabled={!comparisonAvailable} ready={filterReady} onHold={comparison.hold}
          onRelease={comparison.release} onToggle={comparison.toggle} /> : null}
      </>}
    </CameraSheet> : null}
    {state.output ? <CameraResultScreen state={state} output={state.output} settings={state.outputSettings ?? settings} foreground={foreground}
      returning={returning} returnError={returnError} onReturn={() => { void discardAndReturn(); }}
      onSave={() => { if (!discardPending.current) void controller.save(); }}
      onPrepareOriginal={() => { if (!discardPending.current && foreground) void controller.prepareOriginal(); }}
      onEdit={nextSettings => discardPending.current || !foreground ? Promise.resolve(false) : controller.edit(nextSettings)}
      onSettings={() => { void Linking.openSettings().catch(error => setReturnError(String(error))); }} /> : null}
    {__DEV__ && diagnosticsOpen ? <CameraDiagnosticsScreen frameInfo={info} settings={settings} grainSeed={grainSeed}
      filterPhase={currentFilterStatus?.phase ?? '미리보기 대기'} cameraError={cameraError}
      canRun={foreground && (!permission.hasPermission || !device || cameraStopped)} onClose={closeDiagnostics} /> : null}
  </>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background }, body: { flex: 1 }, content: { flexGrow: 1 },
  header: { paddingHorizontal: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  toolbarAction: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  toolbarText: { color: theme.secondary, fontSize: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  brand: { color: theme.text, fontSize: 18, fontWeight: '600', letterSpacing: 3, flexShrink: 1 },
  brandDot: { width: 4, height: 4, borderRadius: 2 },
  settingsIcon: { width: 24, height: 24, justifyContent: 'space-around' },
  settingsLine: { height: 1.5, width: 24, backgroundColor: theme.secondary },
  settingsKnob: { width: 3, height: 7, top: -3, backgroundColor: theme.secondary, position: 'absolute' },
  viewfinderArea: { flex: 1, minHeight: 260, backgroundColor: '#111111' },
  previewCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frameLabel: { position: 'absolute', left: 12, right: 12, top: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  badge: { color: theme.text, backgroundColor: 'rgba(23,23,23,0.65)', paddingHorizontal: 6, paddingVertical: 3,
    fontFamily: theme.mono, fontSize: 10, letterSpacing: 1 },
  filterNotice: { position: 'absolute', left: 12, right: 12, bottom: 20, alignItems: 'center' },
  filterNoticeText: { color: theme.text, fontSize: 12, lineHeight: 18, textAlign: 'center',
    backgroundColor: 'rgba(23,23,23,0.85)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  filterError: { minHeight: 48, justifyContent: 'center' },
  viewfinder: { backgroundColor: theme.inset, overflow: 'hidden' },
  emptyFrame: { width: '100%', padding: 24, gap: 16, justifyContent: 'center', backgroundColor: theme.inset },
  welcome: { color: theme.text, fontSize: 23, lineHeight: 32, fontWeight: '500' },
  text: { color: theme.secondary, fontSize: 15, lineHeight: 24 },
  info: { color: theme.secondary, fontSize: 13, lineHeight: 20 },
  deck: { paddingHorizontal: 16, paddingBottom: 4, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
  notice: { paddingVertical: 12, minHeight: 48, gap: 12 },
  error: { color: theme.error, fontSize: 14, lineHeight: 22 },
  captureRow: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sideControl: { width: 80, minHeight: 64, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 6 },
  smallLabel: { color: theme.secondary, fontSize: 12 },
  switchIcon: { color: theme.secondary, fontSize: 32, lineHeight: 32 },
  compareIcon: { width: 22, height: 22, borderWidth: 1.5, borderColor: theme.secondary, borderRadius: 3, padding: 2 },
  compareHalf: { width: '50%', height: '100%', backgroundColor: theme.secondary },
  selected: { backgroundColor: theme.surface },
  captureStatus: { color: theme.secondary, fontSize: 11, textAlign: 'center', paddingHorizontal: 16, lineHeight: 18, paddingBottom: 4 },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.4 },
});
