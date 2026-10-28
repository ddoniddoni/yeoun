import { useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, type Ref } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SkiaCamera, type SkiaCameraRef } from 'react-native-vision-camera-skia';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';
import type { CameraDevice, CameraPhotoOutput, Constraint } from 'react-native-vision-camera';
import type { CameraSettings } from '../../domain/filters/cameraSettings';
import { renderCameraLut, type FilterStatus } from '../../rendering/adapters/cameraLut';
import { useCameraLut } from './useCameraLut';
import type { ExposureReading, FocusFrame, UnitPoint } from '../../domain/capture/metering';
import { MeteringSession, type MeteringState } from '../../domain/capture/meteringSession';
import { createMeteringPort } from './meteringAdapter';
const PREVIEW_SIZE = { width: 1280, height: 960 };
export type CameraPreviewHandle = {
  focus(point: UnitPoint): Promise<void>; expose(value: number): Promise<void>;
  reconnectMetering(): Promise<void>; captureExposure(): ExposureReading | undefined;
};
export function CameraPreview({ ref, device, photoOutput, active, controlsEnabled, settings, grainSeed, filterRequestKey, onFilterStatus, onReady, onStopped, onRunningChange, onError, onInfo, onMetering }: {
  ref?: Ref<CameraPreviewHandle>; controlsEnabled: boolean; onMetering(state: MeteringState): void;
  device: CameraDevice; photoOutput: CameraPhotoOutput; active: boolean; settings: CameraSettings; grainSeed: number;
  onFilterStatus(status: FilterStatus): void;
  filterRequestKey: string;
  onReady(): void; onStopped(): void; onError(error: Error): void; onInfo(info: string): void;
  onRunningChange(running: boolean): void;
}) {
  const camera = useRef<SkiaCameraRef>(null);
  const live = useRef(active);
  const frameEpoch = useMemo(() => createSynchronizable(0), []);
  const geometry = useMemo(() => createSynchronizable<FocusFrame | undefined>(undefined), []);
  const metering = useMemo(() => new MeteringSession(device.id, onMetering), [device.id, onMetering]);
  const startMetering = useCallback(() => metering.start(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') throw new Error('Unsupported camera platform');
    return createMeteringPort(camera.current?.controller, device.id, () => geometry.getBlocking(), Platform.OS);
  }), [device.id, geometry, metering]);
  useImperativeHandle(ref, () => ({
    focus: point => active && controlsEnabled ? metering.focus(point) : Promise.resolve(),
    expose: value => active && controlsEnabled ? metering.expose(value) : Promise.resolve(),
    reconnectMetering: () => active && controlsEnabled ? startMetering() : Promise.resolve(),
    captureExposure: () => active && controlsEnabled ? metering.captureExposure() : undefined,
  }), [active, controlsEnabled, metering, startMetering]);
  const lut = useCameraLut(settings, grainSeed, filterRequestKey, onFilterStatus);
  const reported = useMemo(() => createSynchronizable<number | undefined>(undefined), []);
  const reportStopped = useCallback(() => {
    frameEpoch.setBlocking(frameEpoch.getBlocking() + 1);
    reported.setBlocking(undefined);
    geometry.setBlocking(undefined); metering.stop(live.current);
    onStopped();
  }, [reported, onStopped, geometry, metering, frameEpoch]);
  const reportSessionStopped = useCallback(() => {
    reportStopped(); onRunningChange(false);
  }, [reportStopped, onRunningChange]);
  const reportSessionStarted = useCallback(() => onRunningChange(true), [onRunningChange]);
  // SkiaCamera copies a rendered image to RN asynchronously. Its native busy
  // flag only covers the camera callback, not that pending image delivery.
  const previewPending = useMemo(() => createSynchronizable(false), []);
  const acknowledgePreview = useCallback(() => {
    previewPending.setBlocking(false);
  }, [previewPending]);
  const reportFrame = useCallback((info: string, epoch: number) => {
    if (!live.current || epoch !== frameEpoch.getBlocking()) return;
    onReady();
    void startMetering();
    onInfo(info);
    if (__DEV__) console.info(`[camera-preview] ${device.position}: ${info}`);
  }, [device.position, onInfo, onReady, startMetering, frameEpoch]);
  useLayoutEffect(() => {
    live.current = active;
    if (!active) { reported.setBlocking(undefined); geometry.setBlocking(undefined); metering.stop(); }
    return () => {
      live.current = false; frameEpoch.setBlocking(frameEpoch.getBlocking() + 1);
      reported.setBlocking(undefined); metering.stop(false);
    };
  }, [active, reported, geometry, metering, frameEpoch]);
  const outputs = useMemo(() => [photoOutput], [photoOutput]);
  const constraints = useMemo<Constraint[]>(() => [
    { photoHDR: false }, { videoDynamicRange: { bitDepth: 'sdr-8-bit', colorSpace: 'srgb', colorRange: 'full' } },
    { resolutionBias: photoOutput }, { fps: 30 },
  ], [photoOutput]);
  return <SkiaCamera ref={camera} style={styles.preview} device={device} outputs={outputs} constraints={constraints}
    isActive={active} orientationSource="device" pixelFormat="yuv" targetResolution={PREVIEW_SIZE}
    enablePreviewSizedOutputBuffers
    enablePhysicalBufferRotation={Platform.OS === 'ios'}
    warnIfRenderSkipped={false}
    onStarted={reportSessionStarted} onStopped={reportSessionStopped} onError={onError}
    onInterruptionStarted={reportStopped}
    onConfigured={reportStopped}
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
          const epoch = frameEpoch.getBlocking();
          const status = renderCameraLut(lut, render, { orientation: frame.orientation, isMirrored: frame.isMirrored });
          if (epoch !== frameEpoch.getBlocking()) return;
          // Only small geometry metadata crosses runtimes; no frame/pixel object is retained.
          const previous = geometry.getBlocking();
          if (!previous || previous.width !== frame.width || previous.height !== frame.height ||
              previous.orientation !== frame.orientation || previous.isMirrored !== frame.isMirrored) {
            geometry.setBlocking({ width: frame.width, height: frame.height, orientation: frame.orientation, isMirrored: frame.isMirrored });
          }
          // SkiaCamera queues its preview image before these acknowledgements.
          if (status) scheduleOnRN(onFilterStatus, status);
          if (reported.getBlocking() !== epoch) {
            reported.setBlocking(epoch);
            scheduleOnRN(reportFrame, `실제 frame ${frame.width}×${frame.height} / ${frame.pixelFormat} / ${frame.orientation} / mirror ${String(frame.isMirrored)}`, epoch);
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
