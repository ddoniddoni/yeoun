import { useEffect, useMemo, useState } from 'react';
import { AppState, Button, Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { CaptureController, type CaptureState } from '../domain/capture/controller';
import type { TestLook } from '../domain/filters/testFilter';
import { CameraPreview } from '../platform/camera/CameraPreview';
import { capturePhoto } from '../platform/camera/capturePhoto';
import { removeFile } from '../platform/files/drafts';
import { saveToGallery } from '../platform/media/gallery';
import { runGpuProbe } from '../rendering/adapters/gpuProbe';
import { exportPhoto } from '../rendering/adapters/exportPhoto';
const PHOTO_SIZE = { width: 4032, height: 3024 };
const LABELS: Record<CaptureState['phase'], string> = {
  idle: '촬영 준비', capturing: '고해상도 사진 촬영 중', rendering: '같은 필터로 JPEG 처리 중',
  'file-ready': '파일 준비 완료 · 아직 갤러리에 저장하지 않았어요',
  'saving-gallery': '갤러리에 저장 중', saved: '갤러리 저장 완료', failed: '작업 실패', cancelled: '앱 중단으로 촬영을 취소했어요',
};
export function M0CameraScreen() {
  const permission = useCameraPermission();
  const [position, setPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(position, { physicalDevices: ['wide-angle'] });
  const photoOutput = usePhotoOutput({ targetResolution: PHOTO_SIZE, containerFormat: 'jpeg', quality: 0.94, qualityPrioritization: 'quality' });
  const [look, setLook] = useState<TestLook>('warm');
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>();
  const [probe, setProbe] = useState('합성 GPU 검사 NOT_RUN');
  const [info, setInfo] = useState('실제 프레임 관측 대기');
  const [state, setState] = useState<CaptureState>({ phase: 'idle' });
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
  const showError = (error: unknown) => setCameraError(String(error));
  const openSettings = () => { void Linking.openSettings().catch(showError); };
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.title}>여운 · M0 카메라 검증</Text>
    <Text style={styles.text}>개발용 Identity / Warm Matrix · 브랜드 필터가 아닙니다.</Text>
    {!permission.hasPermission ? <View style={styles.controls}>
      <Text style={styles.text}>실시간 필터를 보고 사진을 촬영하려면 카메라 권한이 필요해요.</Text>
      {permission.canRequestPermission
        ? <Button title="카메라 권한 허용" onPress={() => { void permission.requestPermission().catch(showError); }} />
        : <Button title="설정에서 카메라 권한 허용" onPress={openSettings} />}
    </View> : !device ? <Text style={styles.text}>선택한 카메라를 찾지 못했어요. 실제 기기에서 확인해 주세요.</Text>
      : <CameraPreview key={device.id} device={device} photoOutput={photoOutput}
        active={foreground && !cameraError} look={look}
        onReady={() => setReady(true)} onStopped={() => setReady(false)}
        onError={error => { setReady(false); showError(error); }} onInfo={setInfo} />}
    <Text style={styles.info}>{info}</Text>
    {cameraError ? <View>
      <Text accessibilityRole="alert" style={styles.error}>{cameraError}</Text>
      <Button title="카메라 다시 연결" onPress={() => { setReady(false); setCameraError(undefined); }} />
    </View> : null}
    <View style={styles.controls}>
      <Button title={look === 'identity' ? '✓ Identity (원본)' : 'Identity (원본)'} disabled={busy || !canCapture} onPress={() => setLook('identity')} />
      <Button title={look === 'warm' ? '✓ Warm (개발 테스트)' : 'Warm (개발 테스트)'} disabled={busy || !canCapture} onPress={() => setLook('warm')} />
      <Button title={position === 'back' ? '전면으로 전환' : '후면으로 전환'} disabled={busy || !canCapture} onPress={() => {
        setReady(false); setCameraError(undefined); setPosition(value => value === 'back' ? 'front' : 'back');
      }} />
      <Button title="고해상도 촬영 · 필터 파일 만들기" disabled={!permission.hasPermission || !device || !ready || !foreground || !!cameraError || busy || !canCapture}
        onPress={() => { void controller.capture(look, position); }} />
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.text}>{LABELS[state.phase]}</Text>
    {state.message ? <Text accessibilityRole="alert" style={styles.error}>{state.message}</Text> : null}
    {state.output ? <View>
      <Image source={{ uri: state.output.uri }} style={styles.result} resizeMode="contain" accessibilityLabel="실제 고해상도 필터 JPEG 결과" />
      <Text style={styles.text}>{state.output.width} × {state.output.height} px · {(state.output.bytes / 1024 / 1024).toFixed(1)} MB</Text>
      <Button title={state.phase === 'saved' ? '갤러리 저장됨' : '갤러리에 저장'} disabled={busy || !foreground || state.phase === 'saved'} onPress={() => { void controller.save(); }} />
    </View> : state.phase === 'failed' && state.canRetryRender ? <Button title="보관한 원본으로 처리 재시도" disabled={busy || !foreground} onPress={() => { void controller.retryRender(); }} /> : null}
    {!canCapture ? <Button title={state.phase === 'saved' ? '다음 사진 촬영' : '임시 사진 버리고 다시 촬영'} disabled={busy} onPress={() => { void controller.discard().catch(showError); }} /> : null}
    {state.phase === 'failed' ? <Button title="저장 권한 설정 열기" onPress={openSettings} /> : null}
    <Button title="합성 픽셀 GPU/CPU 검사" disabled={busy || !foreground} onPress={() => {
      try { setProbe(runGpuProbe()); } catch (error) { setProbe(`GPU 검사 FAIL: ${String(error)}`); }
    }} />
    <Text style={styles.info}>{probe}</Text>
    <Text style={styles.info}>사진은 기기 안에서만 처리합니다. M0 임시 사진은 앱 재시작 시 정리됩니다. 저장 중 앱이 종료되면 갤러리를 먼저 확인하세요.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#171717' }, content: { padding: 16, gap: 12 },
  title: { color: '#F4F1EA', fontSize: 22, fontWeight: '600' }, text: { color: '#F4F1EA', fontSize: 16 },
  info: { color: '#BDB8B0', fontSize: 13 }, controls: { gap: 8 }, error: { color: '#F3A5A5', fontSize: 15 },
  result: { width: '100%', height: 240 },
});
