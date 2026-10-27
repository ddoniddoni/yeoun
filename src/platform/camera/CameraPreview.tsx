import { useCallback, useEffect, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Skia } from '@shopify/react-native-skia';
import { SkiaCamera } from 'react-native-vision-camera-skia';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';
import type { CameraDevice, CameraPhotoOutput, Constraint } from 'react-native-vision-camera';
import { matrixFor, type TestLook } from '../../domain/filters/testFilter';
const PREVIEW_SIZE = { width: 1280, height: 960 };
export function CameraPreview({ device, photoOutput, active, look, onReady, onStopped, onError, onInfo }: {
  device: CameraDevice; photoOutput: CameraPhotoOutput; active: boolean; look: TestLook;
  onReady(): void; onStopped(): void; onError(error: Error): void; onInfo(info: string): void;
}) {
  // Small immutable paint/filter objects only; retained by worklet closures and GC.
  // Disposing them in a React cleanup could race an in-flight frame callback.
  const paints = useMemo(() => {
    return (['identity', 'warm'] as const).map(key => {
      const paint = Skia.Paint(); paint.setColorFilter(Skia.ColorFilter.MakeMatrix(matrixFor(key))); return paint;
    });
  }, []);
  const reported = useMemo(() => createSynchronizable(false), []);
  // SkiaCamera copies a rendered image to RN asynchronously. Its native busy
  // flag only covers the camera callback, not that pending image delivery.
  const previewPending = useMemo(() => createSynchronizable(false), []);
  const acknowledgePreview = useCallback(() => {
    previewPending.setBlocking(false);
  }, [previewPending]);
  const reportFrame = useCallback((info: string) => {
    onReady();
    onInfo(info);
    if (__DEV__) console.info(`[camera-preview] ${device.position}: ${info}`);
  }, [device.position, onInfo, onReady]);
  useEffect(() => { if (!active) reported.setBlocking(false); }, [active, reported]);
  const outputs = useMemo(() => [photoOutput], [photoOutput]);
  const constraints = useMemo<Constraint[]>(() => [
    { photoHDR: false }, { videoDynamicRange: { bitDepth: 'sdr-8-bit', colorSpace: 'srgb', colorRange: 'full' } },
    { resolutionBias: photoOutput }, { fps: 30 },
  ], [photoOutput]);
  const paint = paints[look === 'warm' ? 1 : 0]!;
  return <SkiaCamera style={styles.preview} device={device} outputs={outputs} constraints={constraints}
    isActive={active} orientationSource="device" pixelFormat="yuv" targetResolution={PREVIEW_SIZE}
    enablePreviewSizedOutputBuffers
    enablePhysicalBufferRotation={Platform.OS === 'ios'}
    warnIfRenderSkipped={false}
    onStopped={onStopped} onError={onError}
    onInterruptionStarted={onStopped}
    onSessionConfigSelected={config => {
      onInfo(`선택 FPS ${config.selectedFPS ?? '?'} / native ${config.nativePixelFormat} / photo HDR ${String(config.isPhotoHDREnabled)}`);
    }}
    onFrame={(frame, render) => {
      'worklet';
      try {
        // Drop before allocating a GPU snapshot or its CPU copy if RN has not
        // accepted the previous preview yet. The frame is still disposed below.
        if (previewPending.getBlocking()) return;
        if (frame.pixelFormat.includes('raw') || frame.pixelFormat === 'private') {
          throw new Error('Unsupported M0 preview pixel format');
        }
        previewPending.setBlocking(true);
        try {
          render(({ canvas, frameTexture }) => {
            canvas.drawImage(frameTexture, 0, 0, paint);
            if (!reported.getBlocking()) {
              reported.setBlocking(true);
              scheduleOnRN(reportFrame, `실제 frame ${frame.width}×${frame.height} / ${frame.pixelFormat} / ${frame.orientation} / mirror ${String(frame.isMirrored)}`);
            }
          });
        } finally {
          // Queued after SkiaCamera's updatePreviewTexture on the same RN queue.
          scheduleOnRN(acknowledgePreview);
        }
      } catch {
        scheduleOnRN(onError, new Error('카메라 필터 프레임 처리 실패'));
      } finally { frame.dispose(); }
    }} />;
}
const styles = StyleSheet.create({ preview: { width: '100%', aspectRatio: 3 / 4 } });
