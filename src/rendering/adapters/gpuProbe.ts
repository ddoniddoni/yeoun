import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import { applyMatrix, matrixFor } from '../../domain/filters/testFilter';
// Development-only, synthetic pixels. This is a real Skia readback, not a Jest mock.
// Passing it does NOT verify camera YUV/color transforms, JPEG profiles or gallery.
export function runGpuProbe(): string {
  const fixture = new Uint8Array([
    0, 0, 0, 255, 255, 255, 255, 255, 255, 0, 0, 255, 0, 255, 0, 255,
    0, 0, 255, 255, 128, 128, 128, 255, 180, 120, 90, 255,
  ]);
  const info = { width: 7, height: 1, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Opaque };
  const data = Skia.Data.fromBytes(fixture);
  const input = Skia.Image.MakeImage(info, data, 7 * 4);
  const surface = Skia.Surface.MakeOffscreen(7, 1);
  if (!input || !surface) { input?.dispose(); surface?.dispose(); data.dispose(); throw new Error('GPU probe allocation failed'); }
  let maxError = 0;
  try {
    for (const look of ['identity', 'warm'] as const) {
      const matrix = matrixFor(look);
      const paint = Skia.Paint(); const filter = Skia.ColorFilter.MakeMatrix(matrix);
      try {
        paint.setColorFilter(filter); surface.getCanvas().drawImage(input, 0, 0, paint); surface.flush();
        const output = surface.makeImageSnapshot();
        try {
          const actual = output.readPixels(0, 0, info);
          if (!actual) throw new Error('GPU probe readback failed');
          for (let x = 0; x < 7; x++) {
            const expected = applyMatrix(Array.from(fixture.slice(x * 4, x * 4 + 4), v => v / 255), matrix);
            for (let c = 0; c < 4; c++) maxError = Math.max(maxError, Math.abs(actual[x * 4 + c]! - Math.round(expected[c]! * 255)));
          }
        } finally { output.dispose(); }
      } finally { paint.dispose(); filter.dispose(); }
    }
    if (maxError > 1) throw new Error(`GPU/CPU mismatch: ${maxError} LSB`);
    return `합성 GPU/CPU 검사 PASS · 7색 × 2 Matrix · 최대 오차 ${maxError} LSB (실제 카메라/갤러리 검증은 별도)`;
  } finally { surface.dispose(); input.dispose(); data.dispose(); }
}
