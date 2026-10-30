import { useState } from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CameraSettings } from '../domain/filters/cameraSettings';
import { runGpuProbe } from '../rendering/adapters/gpuProbe';
import { SPATIAL_BACKEND_VERSION } from '../rendering/shaders/spatial';
import { LUT_SKIA_BACKEND_VERSION } from '../rendering/shaders/lut';
import { cameraTheme as theme } from './cameraTheme';

export function CameraDiagnosticsScreen({ frameInfo, settings, grainSeed, filterPhase, cameraError, canRun, onClose }: {
  frameInfo: string; settings: CameraSettings; grainSeed: number; filterPhase: string; cameraError?: string;
  canRun: boolean; onClose(): void;
}) {
  const [probe, setProbe] = useState('NOT_RUN · 아직 실행하지 않았어요.');
  // Both the entry point and this screen are gated; mounting never starts a probe.
  if (!__DEV__) return null;
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>개발 진단</Text>
        <Button title="카메라로 돌아가기" onPress={onClose} />
        <Text style={styles.text}>앱 개발 중 상태를 확인하는 화면이에요. 여는 것만으로 검사를 실행하거나 사진을 촬영·저장하지 않아요.</Text>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>마지막 카메라 정보</Text>
          <Text selectable style={styles.info}>{frameInfo}</Text>
          <Text style={styles.info}>진단 화면에서는 미리보기를 일시 정지해요. 위 정보는 마지막으로 받은 값이며 현재 FPS 측정값이 아니에요.</Text>
          {cameraError ? <Text selectable style={styles.error}>{cameraError}</Text> : null}
        </View>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>선택한 필터</Text>
          <Text selectable style={styles.info}>{[
            `${settings.filterId} · ${Math.round(settings.intensity * 100)}%`,
            `상태: ${filterPhase}`, `look: ${settings.lookVersion}`, `LUT: ${settings.engineVersion}`,
            `입자 ${settings.grain} / 번짐 ${settings.bloom} / seed ${grainSeed}`, `spatial: ${SPATIAL_BACKEND_VERSION}`,
            `renderer: ${settings.rendererVersion}`, `shader: ${LUT_SKIA_BACKEND_VERSION}`,
          ].join('\n')}</Text>
        </View>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>합성 픽셀 GPU/CPU 검사</Text>
          <Text style={styles.text}>사진 대신 미리 정한 7개 색에 개발용 Identity/Warm Matrix를 적용해, Skia에서 읽은 값과 CPU 계산값을 비교해요.</Text>
          <Text style={styles.info}>대표 LUT 3종의 색감, 실제 카메라, 촬영·갤러리 저장은 이 검사로 확인되지 않아요. 통과해도 앱 전체 검증 완료를 뜻하지 않아요.</Text>
          {!canRun ? <Text accessibilityLiveRegion="polite" style={styles.info}>앱이 활성 상태이고 카메라 정지가 확인되면 실행할 수 있어요.</Text> : null}
          <Button title="합성 Matrix 검사 실행" disabled={!canRun} onPress={() => {
            if (!__DEV__ || !canRun) return;
            try { setProbe(runGpuProbe()); }
            catch (error) { setProbe(`FAIL · ${String(error)}`); }
          }} />
          <Text selectable accessibilityLiveRegion="polite" style={styles.info}>{probe}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background }, content: { padding: 20, gap: 20 },
  title: { color: theme.text, fontSize: 24, fontWeight: '600' },
  heading: { color: theme.text, fontSize: 18, fontWeight: '600' },
  text: { color: theme.text, fontSize: 16, lineHeight: 24 },
  info: { color: theme.secondary, fontSize: 14, lineHeight: 22 },
  section: { gap: 10 }, error: { color: theme.error, fontSize: 14 },
});
