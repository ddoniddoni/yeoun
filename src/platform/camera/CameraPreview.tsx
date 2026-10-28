import { useCallback, useEffect, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SkiaCamera } from 'react-native-vision-camera-skia';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';
import type { CameraDevice, CameraPhotoOutput, Constraint } from 'react-native-vision-camera';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { renderCameraLut, type FilterStatus } from '../../rendering/adapters/cameraLut';
import { useCameraLut } from './useCameraLut';
const PREVIEW_SIZE = { width: 1280, height: 960 };
export function CameraPreview({ device, photoOutput, active, settings, filterRequestKey, onFilterStatus, onReady, onStopped, onError, onInfo }: {
  device: CameraDevice; photoOutput: CameraPhotoOutput; active: boolean; settings: CameraSettings;
  onFilterStatus(status: FilterStatus): void;
  filterRequestKey: string;
  onReady(): void; onStopped(): void; onError(error: Error): void; onInfo(info: string): void;
}) {
  const lut = useCameraLut(settings, filterRequestKey, onFilterStatus);
  const reported = useMemo(() => createSynchronizable(false), []);
  const reportStopped = useCallback(() => {
    reported.setBlocking(false);
    onStopped();
  }, [reported, onStopped]);
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
  return <SkiaCamera style={styles.preview} device={device} outputs={outputs} constraints={constraints}
    isActive={active} orientationSource="device" pixelFormat="yuv" targetResolution={PREVIEW_SIZE}
    enablePreviewSizedOutputBuffers
    enablePhysicalBufferRotation={Platform.OS === 'ios'}
    warnIfRenderSkipped={false}
    onStopped={reportStopped} onError={onError}
    onInterruptionStarted={reportStopped}
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
          const status = renderCameraLut(lut, render);
          // SkiaCamera queues its preview image before these acknowledgements.
          if (status) scheduleOnRN(onFilterStatus, status);
          if (!reported.getBlocking()) {
            reported.setBlocking(true);
            scheduleOnRN(reportFrame, `실제 frame ${frame.width}×${frame.height} / ${frame.pixelFormat} / ${frame.orientation} / mirror ${String(frame.isMirrored)}`);
          }
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
