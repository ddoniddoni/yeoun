import type { FilterAuthoring, HueBand, Rgb } from '../../domain/filters/types.ts';
import {
  assertRange, assertRgbRange, clamp01, encodedLuma, hsvToRgb,
  linearToSrgbChannel, rgbToHsv, smoothstep, srgbToLinearChannel, wrapHue,
} from './color.ts';
import { createToneCurve } from './toneCurve.ts';

function snapshotBands(bands: readonly HueBand[]): HueBand[] {
  const snapshot = bands.map(band => {
    assertRange(band.centerDeg, 0, 360, 'Hue band center');
    assertRange(band.halfWidthDeg, 0, 90, 'Hue band half width');
    if (band.centerDeg === 360 || band.halfWidthDeg === 0) {
      throw new RangeError('Hue band requires center < 360 and half width > 0');
    }
    assertRange(band.shiftDeg, -30, 30, 'Hue band shift');
    assertRange(band.saturationMultiplier, 0, 2, 'Hue band saturation multiplier');
    return {
      centerDeg: band.centerDeg, halfWidthDeg: band.halfWidthDeg,
      shiftDeg: band.shiftDeg, saturationMultiplier: band.saturationMultiplier,
    };
  });
  // Canonical summation order also removes floating-point differences when bands are reordered.
  return snapshot.sort((a, b) => a.centerDeg - b.centerDeg || a.halfWidthDeg - b.halfWidthDeg ||
    a.shiftDeg - b.shiftDeg || a.saturationMultiplier - b.saturationMultiplier);
}

function applyHueBands(rgb: Rgb, bands: readonly HueBand[]): Rgb {
  if (bands.length === 0) return rgb;
  const [hue, saturation, value] = rgbToHsv(rgb);
  const mask = smoothstep(0.05, 0.25, saturation);
  if (mask === 0) return rgb;
  let weightSum = 0;
  let shiftSum = 0;
  let saturationSum = 0;
  for (const band of bands) {
    const distance = Math.abs(hue - band.centerDeg);
    const weight = 1 - smoothstep(0, band.halfWidthDeg, Math.min(distance, 360 - distance));
    weightSum += weight;
    shiftSum += weight * band.shiftDeg;
    saturationSum += weight * (band.saturationMultiplier - 1);
  }
  if (weightSum === 0) return rgb;
  const denominator = Math.max(1, weightSum);
  return hsvToRgb([
    wrapHue(hue + mask * shiftSum / denominator),
    clamp01(saturation * (1 + mask * saturationSum / denominator)),
    value,
  ]);
}

/**
 * Analytic RGB transform for render contract 0.1.0, docs/02_FILTER_ENGINE.md §5.
 * Input/output: normalized SDR encoded sRGB. Call once per look, then once per LUT sample.
 * Accept schema-validated authoring data; this also guards numeric ranges and curve semantics.
 * Does not apply camera exposure, grain, bloom, master intensity, or alpha processing.
 */
export function createAuthoringTransform(authoring: FilterAuthoring): (input: Rgb) => Rgb {
  if (authoring.colorSpace !== 'srgb-encoded') throw new RangeError('Expected srgb-encoded authoring data');
  assertRange(authoring.exposureEv, -1, 1, 'Authoring exposure EV');
  assertRange(authoring.saturation, 0, 2, 'Authoring saturation');
  assertRgbRange(authoring.shadowTintRgb, -0.1, 0.1, 'Shadow tint');
  assertRgbRange(authoring.highlightTintRgb, -0.1, 0.1, 'Highlight tint');

  const gain = 2 ** authoring.exposureEv;
  const saturation = authoring.saturation;
  const shadow: Rgb = [...authoring.shadowTintRgb];
  const highlight: Rgb = [...authoring.highlightTintRgb];
  const tone = createToneCurve(authoring.toneCurve);
  const bands = snapshotBands(authoring.hueBands);
  // A neutral exposure needs no transfer-function round trip, including at its rounded breakpoint.
  const exposeAndTone = (channel: number) => tone(gain === 1
    ? channel
    : linearToSrgbChannel(clamp01(srgbToLinearChannel(channel) * gain)));

  return input => {
    assertRgbRange(input);
    const curved: Rgb = [exposeAndTone(input[0]), exposeAndTone(input[1]), exposeAndTone(input[2])];
    // Compute both masks before applying either tint.
    const brightness = encodedLuma(curved);
    const shadowWeight = 1 - smoothstep(0.15, 0.55, brightness);
    const highlightWeight = smoothstep(0.45, 0.90, brightness);
    const tinted: Rgb = [
      clamp01(curved[0] + shadow[0] * shadowWeight + highlight[0] * highlightWeight),
      clamp01(curved[1] + shadow[1] * shadowWeight + highlight[1] * highlightWeight),
      clamp01(curved[2] + shadow[2] * shadowWeight + highlight[2] * highlightWeight),
    ];
    const adjusted = applyHueBands(tinted, bands);
    const luma = encodedLuma(adjusted);
    return [
      clamp01(luma + (adjusted[0] - luma) * saturation),
      clamp01(luma + (adjusted[1] - luma) * saturation),
      clamp01(luma + (adjusted[2] - luma) * saturation),
    ];
  };
}
