import { cameraSettings, copyCameraSettings, type CameraSettings } from './cameraSettings';

export type RememberedCamera = Readonly<{ settings: CameraSettings; grid: boolean }>;
export type CameraMemoryValue = Readonly<{ remember: false }> | Readonly<{ remember: true; camera: RememberedCamera }>;
export type SettingsFingerprint = (settings: CameraSettings) => string;

export function defaultRememberedCamera(): RememberedCamera {
  return Object.freeze({ settings: cameraSettings('light-afternoon'), grid: false });
}
export function copyRememberedCamera(input: RememberedCamera): RememberedCamera {
  if (typeof input.grid !== 'boolean') throw new Error('CAMERA_MEMORY_GRID');
  return Object.freeze({ settings: copyCameraSettings(input.settings), grid: input.grid });
}
export function serializeCameraMemory(value: CameraMemoryValue, fingerprint: SettingsFingerprint): string {
  if (!value.remember) return JSON.stringify({ schemaVersion: 1, remember: false });
  const camera = copyRememberedCamera(value.camera);
  return JSON.stringify({ schemaVersion: 1, remember: true, ...camera, fingerprint: fingerprint(camera.settings) });
}
export function parseCameraMemory(raw: string | null, fingerprint: SettingsFingerprint): CameraMemoryValue {
  if (raw === null) return Object.freeze({ remember: true, camera: defaultRememberedCamera() });
  if (raw.length > 8192) throw new Error('CAMERA_MEMORY_SIZE');
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('CAMERA_MEMORY_RECORD');
  const data = parsed as Record<string, unknown>;
  if (data.schemaVersion !== 1 || typeof data.remember !== 'boolean') throw new Error('CAMERA_MEMORY_VERSION');
  if (!data.remember) return Object.freeze({ remember: false });
  if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings) || typeof data.grid !== 'boolean') {
    throw new Error('CAMERA_MEMORY_SETTINGS');
  }
  // The existing settings validator verifies every version, amount and boolean.
  const camera = copyRememberedCamera({ settings: data.settings as CameraSettings, grid: data.grid });
  if (data.fingerprint !== fingerprint(camera.settings)) throw new Error('CAMERA_MEMORY_ASSETS');
  return Object.freeze({ remember: true, camera });
}
