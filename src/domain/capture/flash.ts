export type PhotoFlashMode = 'off' | 'auto' | 'on';
export type FlashSelection = Readonly<{ deviceId: string; mode: PhotoFlashMode }>;
export type FlashDevice = Readonly<{ id: string; hasFlash: boolean }>;

export function assertFlashMode(value: unknown): asserts value is PhotoFlashMode {
  if (value !== 'off' && value !== 'auto' && value !== 'on') {
    throw new Error('플래시 설정을 확인해 주세요.');
  }
}

/** A previous camera's choice must never enable flash on a newly selected camera. */
export function selectedFlashMode(selection: FlashSelection | undefined, device: FlashDevice | undefined): PhotoFlashMode {
  if (!device?.hasFlash || !selection || selection.deviceId !== device.id) return 'off';
  assertFlashMode(selection.mode);
  return selection.mode;
}
