export type UnitPoint = Readonly<{ x: number; y: number }>;
export type ExposureRange = Readonly<{ min: number; max: number }>;
export type ExposureUnit = 'ev' | 'step';
export type ExposureReading = Readonly<{ value: number; unit: ExposureUnit }>;
export function copyExposure(reading: ExposureReading): ExposureReading {
  if (!Number.isFinite(reading.value) || (reading.unit !== 'ev' && reading.unit !== 'step') ||
      (reading.unit === 'step' && !Number.isInteger(reading.value))) throw new Error('노출 기록을 확인해 주세요.');
  return Object.freeze({ value: reading.value, unit: reading.unit });
}
export type FocusFrame = Readonly<{
  width: number; height: number; orientation: 'up' | 'down' | 'left' | 'right'; isMirrored: boolean;
}>;

export function exposureRange(supported: boolean, min: number, max: number): ExposureRange | undefined {
  if (!supported || !Number.isFinite(min) || !Number.isFinite(max) || min > 0 || max < 0 || min >= max) return;
  return { min, max };
}
export function clampExposure(value: number, range: ExposureRange): number {
  if (!Number.isFinite(value)) throw new Error('노출 값을 확인해 주세요.');
  return Math.max(range.min, Math.min(range.max, value));
}

/** Invert the Skia Image's centered cover crop before mapping into sensor coordinates. */
export function focusSensorPoint(point: UnitPoint, frame: FocusFrame, platform: 'ios' | 'android', front: boolean): UnitPoint {
  if (![point.x, point.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1) ||
      ![frame.width, frame.height].every(v => Number.isFinite(v) && v > 0)) throw new Error('초점 위치를 확인해 주세요.');
  const landscape = frame.orientation === 'left' || frame.orientation === 'right';
  const width = landscape ? frame.height : frame.width;
  const height = landscape ? frame.width : frame.height;
  const viewRatio = 3 / 4;
  const imageRatio = width / height;
  let x = 0.5 + (point.x - 0.5) * Math.min(1, viewRatio / imageRatio);
  const y = 0.5 + (point.y - 0.5) * Math.min(1, imageRatio / viewRatio);
  if (platform === 'ios') {
    // Existing iOS buffers are physically upright/mirrored. App UI is portrait-only.
    // AVCaptureDevice points always use landscape-right, unmirrored coordinates.
    if (frame.orientation !== 'up' || frame.isMirrored) throw new Error('카메라 방향이 준비되지 않았어요.');
    if (front) x = 1 - x;
    return { x: y, y: 1 - x };
  }
  if (frame.isMirrored) x = 1 - x;
  switch (frame.orientation) {
    case 'up': return { x, y };
    case 'down': return { x: 1 - x, y: 1 - y };
    case 'left': return { x: y, y: 1 - x };
    case 'right': return { x: 1 - y, y: x };
  }
}
