// Affine mapping from the source texture into the oriented, cropped output.
export type Affine = readonly [number, number, number, number, number, number];
export type SpatialGeometry = Readonly<{ width: number; height: number; forward: Affine; inverse: Affine }>;

export function spatialGeometry(width: number, height: number, transform: readonly number[], portrait = false): SpatialGeometry {
  'worklet';
  if (![width, height].every(value => Number.isInteger(value) && value > 0) ||
      transform.length !== 6 || !transform.every(Number.isFinite)) throw new Error('Invalid spatial geometry');
  const [a, b, c, d, tx, ty] = transform as Affine;
  const determinant = a * d - b * c;
  if (![a, b, c, d].every(value => value === -1 || value === 0 || value === 1) ||
      Math.abs(a) + Math.abs(c) !== 1 || Math.abs(b) + Math.abs(d) !== 1 || Math.abs(determinant) !== 1) throw new Error('Spatial geometry requires orientation without scaling');
  const orientedWidth = Math.abs(a) * width + Math.abs(c) * height;
  const orientedHeight = Math.abs(b) * width + Math.abs(d) * height;
  const ratio = !portrait && orientedWidth > orientedHeight ? 4 / 3 : 3 / 4;
  const w = Math.floor(Math.min(orientedWidth, orientedHeight * ratio));
  const h = Math.floor(Math.min(orientedHeight, orientedWidth / ratio));
  if (w < 1 || h < 1) throw new Error('Empty spatial crop');
  const x = tx - (orientedWidth - w) / 2;
  const y = ty - (orientedHeight - h) / 2;
  return { width: w, height: h, forward: [a, b, c, d, x, y],
    inverse: [d / determinant, -b / determinant, -c / determinant, a / determinant,
      (c * y - d * x) / determinant, (b * x - a * y) / determinant] };
}

// Matches VisionCamera-Skia 5.2.3 renderToTexture's counter-rotation then mirror.
export function previewGeometry(w: number, h: number, orientation: 'up' | 'down' | 'left' | 'right', mirrored: boolean): SpatialGeometry {
  'worklet';
  let transform: Affine;
  switch (orientation) {
    case 'up': transform = [1, 0, 0, 1, 0, 0]; break;
    case 'down': transform = [-1, 0, 0, -1, w, h]; break;
    case 'left': transform = [0, 1, -1, 0, h, 0]; break;
    case 'right': transform = [0, -1, 1, 0, 0, w]; break;
    default: throw new Error('Unsupported preview orientation');
  }
  if (mirrored) {
    const [a, b, c, d, tx, ty] = transform;
    const outWidth = Math.abs(a) * w + Math.abs(c) * h;
    transform = [a === 0 ? 0 : -a, b, c === 0 ? 0 : -c, d, outWidth - tx, ty];
  }
  // The app viewfinder is portrait and SkiaCamera fits the oriented image with cover.
  return spatialGeometry(w, h, transform, true);
}

export function bloomGeometry(width: number, height: number) {
  'worklet';
  if (![width, height].every(value => Number.isFinite(value) && value > 0)) throw new Error('Invalid bloom size');
  const scale = Math.min(0.25, 512 / Math.max(width, height));
  const w = Math.max(1, Math.floor(width * scale));
  const h = Math.max(1, Math.floor(height * scale));
  return { width: w, height: h, scaleX: w / width, scaleY: h / height,
    sigmaX: Math.max(width, height) * 0.003 * w / width,
    sigmaY: Math.max(width, height) * 0.003 * h / height };
}
