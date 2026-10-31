import type { CaptureState, Draft, Output, Snapshot } from './controller';
import { copyCameraSettings, type CameraSettings } from '../filters/cameraSettings';
import { assertGrainSeed } from '../filters/grainSeed';
import { assertStampDate } from '../filters/retroControls';
import { copyExposure, type ExposureReading } from './metering';

export const RECOVERY_TTL = 24 * 60 * 60 * 1000;
export type GalleryStatus = 'not-saved' | 'saving-gallery' | 'saved';
export type RestoredCapture = Readonly<{ draft: Draft; snapshot: Snapshot; output: Output; galleryStatus: GalleryStatus }>;
export interface RecoveryPort {
  checkpoint(draft: Draft, snapshot: Snapshot, output: Output): Promise<void>;
  setGalleryStatus(status: GalleryStatus, output: Output): Promise<void>;
  discard(): Promise<void>;
}
export type RecoveryFile = Readonly<{ name: string; bytes: number; sha256: string }>;
export type RecoveryRecord = Readonly<{
  schemaVersion: 1; fingerprint: string; snapshot: Snapshot; draft: Omit<Draft, 'sourceUri'>;
  source: RecoveryFile; output: RecoveryFile & { width: number; height: number };
  galleryStatus: GalleryStatus; updatedAt: number; expiresAt: number;
}>;
export function restoredState(restored?: RestoredCapture): CaptureState {
  return restored ? { phase: restored.galleryStatus === 'saving-gallery' ? 'save-uncertain'
    : restored.galleryStatus === 'saved' ? 'saved' : 'file-ready',
    output: restored.output, outputSettings: restored.snapshot.settings, imported: restored.draft.imported }
    : { phase: 'idle' };
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('RECOVERY_RECORD');
  return value as Record<string, unknown>;
}
function integer(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > max) throw new Error('RECOVERY_NUMBER');
  return value;
}
function dimensions(value: Record<string, unknown>) {
  const width = integer(value.width, 16_000), height = integer(value.height, 16_000);
  if (width * height > 16_000_000) throw new Error('RECOVERY_DIMENSIONS');
  return { width, height };
}
function file(value: unknown, prefix: 'source' | 'output'): RecoveryFile {
  const item = object(value);
  if (typeof item.name !== 'string' || !new RegExp(`^${prefix}-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\\.jpg$`).test(item.name) ||
    typeof item.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(item.sha256)) throw new Error('RECOVERY_FILE');
  return { name: item.name, bytes: integer(item.bytes, 100 * 1024 * 1024), sha256: item.sha256 };
}
// Stored JSON is untrusted. Rebuild the whitelist; never restore URI paths or fallback look versions.
export function parseRecovery(raw: string, fingerprint: string): RecoveryRecord {
  if (raw.length > 16_384) throw new Error('RECOVERY_SIZE');
  const data = object(JSON.parse(raw));
  if (data.schemaVersion !== 1 || data.fingerprint !== fingerprint) throw new Error('RECOVERY_VERSION');
  const value = object(data.snapshot), draft = object(data.draft);
  if (typeof value.id !== 'string' || !/^[A-Za-z0-9-]{1,100}$/.test(value.id) ||
    typeof value.capturedAt !== 'string' || value.capturedAt.length !== 24 ||
    !Number.isFinite(Date.parse(value.capturedAt)) ||
    (value.position !== 'front' && value.position !== 'back') ||
    (value.flashMode !== 'off' && value.flashMode !== 'auto' && value.flashMode !== 'on') ||
    typeof value.grainSeed !== 'number' || typeof value.stampDate !== 'number' ||
    typeof draft.orientation !== 'string' || !['up', 'down', 'left', 'right'].includes(draft.orientation) ||
    typeof draft.mirrored !== 'boolean') throw new Error('RECOVERY_METADATA');
  assertGrainSeed(value.grainSeed); assertStampDate(value.stampDate);
  // copyCameraSettings performs the runtime version/range/type checks, then copies only known fields.
  const settings = copyCameraSettings(object(value.settings) as CameraSettings);
  let imported: Draft['imported'];
  if (draft.imported !== undefined) {
    const info = object(draft.imported);
    if (typeof info.resized !== 'boolean' || typeof info.flattened !== 'boolean') throw new Error('RECOVERY_IMPORT');
    imported = { resized: info.resized, flattened: info.flattened };
  }
  const updatedAt = integer(data.updatedAt, 8_640_000_000_000_000);
  const expiresAt = integer(data.expiresAt, 8_640_000_000_000_000);
  if (expiresAt - updatedAt !== RECOVERY_TTL ||
    !['not-saved', 'saving-gallery', 'saved'].includes(String(data.galleryStatus))) throw new Error('RECOVERY_STATUS');
  return { schemaVersion: 1, fingerprint, updatedAt, expiresAt, galleryStatus: data.galleryStatus as GalleryStatus,
    snapshot: { id: value.id, capturedAt: value.capturedAt, position: value.position, flashMode: value.flashMode,
      grainSeed: value.grainSeed, stampDate: value.stampDate, settings,
      sourceExposure: value.sourceExposure === undefined ? undefined : copyExposure(object(value.sourceExposure) as ExposureReading) },
    draft: { ...dimensions(draft), orientation: draft.orientation, mirrored: draft.mirrored, imported },
    source: file(data.source, 'source'), output: { ...file(data.output, 'output'), ...dimensions(object(data.output)) } };
}
