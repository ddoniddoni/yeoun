import { VisionCamera, type CameraController } from 'react-native-vision-camera';
import { clampExposure, exposureRange, focusSensorPoint, type FocusFrame } from '../../domain/capture/metering';
import type { MeteringPort } from '../../domain/capture/meteringSession';

export function createMeteringPort(controller: CameraController | undefined, deviceId: string,
  frame: () => FocusFrame | undefined, platform: 'ios' | 'android'): MeteringPort {
  const camera = controller;
  if (!camera || camera.device.id !== deviceId) throw new Error('카메라가 준비되지 않았어요.');
  const ensureActive = () => {
    if (!camera.isConnected || camera.isSuspended || camera.isUsedByAnotherApp) throw new Error('카메라가 중단됐어요.');
  };
  ensureActive();
  const device = camera.device;
  const range = exposureRange(device.supportsExposureBias, device.minExposureBias, device.maxExposureBias);
  return { range, unit: platform === 'ios' ? 'ev' : 'step', focusSupported: device.supportsFocusMetering,
    async resetFocus() { ensureActive(); await camera.resetFocus(); },
    async focus(point) {
      ensureActive();
      if (!device.supportsFocusMetering) throw new Error('이 카메라는 탭 초점을 지원하지 않아요.');
      const geometry = frame();
      if (!geometry) throw new Error('미리보기 방향이 준비되지 않았어요.');
      const mapped = focusSensorPoint(point, geometry, platform, device.position === 'front');
      const target = VisionCamera.createNormalizedMeteringPoint(mapped.x, mapped.y);
      try {
        await camera.focusTo(target, { modes: ['AF'], responsiveness: 'snappy', adaptiveness: 'continuous', autoResetAfter: 5 });
      } finally { target.dispose(); }
    },
    async setExposure(value) {
      ensureActive();
      if (!range) throw new Error('이 카메라는 노출 보정을 지원하지 않아요.');
      const requested = clampExposure(value, range);
      await camera.setExposureBias(platform === 'android' ? Math.round(requested) : requested);
      ensureActive();
      const applied = camera.exposureBias;
      if (!Number.isFinite(applied) || applied < range.min || applied > range.max) throw new Error('노출 적용값을 읽지 못했어요.');
      return applied;
    },
  };
}
