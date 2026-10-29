export const RETRO_AMOUNTS = ['vignette', 'halation', 'sharpness', 'softness', 'digitalNoise', 'lightLeak', 'dust'] as const;
export type RetroAmount = typeof RETRO_AMOUNTS[number];
export type RetroControls = Readonly<Record<RetroAmount, number> & { dateStamp: boolean }>;
export const NO_RETRO: RetroControls = {
  vignette: 0, halation: 0, sharpness: 0, softness: 0, digitalNoise: 0, lightLeak: 0, dust: 0, dateStamp: false,
};

/** Six decimal digits, captured in local calendar time before any async work. */
export function localStampDate(date = new Date()): number {
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid stamp date');
  return (date.getFullYear() % 100) * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function assertStampDate(value: number): void {
  'worklet';
  const year = Math.floor(value / 10000);
  const month = Math.floor(value / 100) % 100;
  const day = value % 100;
  const days = month === 2 ? (year % 4 === 0 ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  if (!Number.isInteger(value) || value < 101 || value > 991231 || month < 1 || month > 12 || day < 1 || day > days) {
    throw new Error('Invalid stamp date');
  }
}

export function hasSpatialEffects(settings: RetroControls & { grain: number; bloom: number }): boolean {
  'worklet';
  return settings.grain > 0 || settings.bloom > 0 || settings.dateStamp ||
    settings.vignette > 0 || settings.halation > 0 || settings.sharpness > 0 || settings.softness > 0 ||
    settings.digitalNoise > 0 || settings.lightLeak > 0 || settings.dust > 0;
}
