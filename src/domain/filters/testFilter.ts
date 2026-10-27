export type TestLook = 'identity' | 'warm';
export const ENGINE_VERSION = 'm0-matrix-1';
export const LOOK_VERSION = '1';
// Row-major RGBA 4x5; offsets are normalized (0..1), not byte values.
export const IDENTITY = Object.freeze([
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
]);
export const WARM = Object.freeze([
  1.04, 0, 0, 0, 0.015, 0, 1, 0, 0, 0.005,
  0, 0, 0.92, 0, 0, 0, 0, 0, 1, 0,
]);
export function matrixFor(look: TestLook): number[] {
  return [...(look === 'identity' ? IDENTITY : WARM)];
}
export function applyMatrix(rgba: readonly number[], matrix: readonly number[]): number[] {
  if (rgba.length !== 4 || matrix.length !== 20 || [...rgba, ...matrix].some(v => !Number.isFinite(v))) {
    throw new Error('Invalid RGBA or matrix');
  }
  return Array.from({ length: 4 }, (_, row) => {
    let value = matrix[row * 5 + 4]!;
    for (let col = 0; col < 4; col++) value += rgba[col]! * matrix[row * 5 + col]!;
    return Math.min(1, Math.max(0, value));
  });
}
