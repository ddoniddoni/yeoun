// Small exact integers keep the versioned shader hash within float32's integer range.
export const GRAIN_SEED_COUNT = 4093;
export function assertGrainSeed(seed: number): void {
  'worklet';
  if (!Number.isInteger(seed) || seed < 0 || seed >= GRAIN_SEED_COUNT) throw new Error('Invalid grain seed');
}
export function createGrainSeed(): number {
  return Math.floor(Math.random() * GRAIN_SEED_COUNT);
}
