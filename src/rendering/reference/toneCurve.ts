import type { ToneCurve, TonePoint } from '../../domain/filters/types.ts';
import { assertRange } from './color.ts';

/** Snapshot a six-point authoring curve; evaluation never mutates or sorts its input. */
export function createToneCurve(curve: ToneCurve): (value: number) => number {
  if (curve.length !== 6) throw new RangeError('Tone curve must have six points');
  const points = curve.map((point, index): TonePoint => {
    if (point.length !== 2) throw new RangeError(`Tone point ${index} must have two coordinates`);
    const [x, y] = point;
    assertRange(x, 0, 1, `toneCurve[${index}].x`);
    assertRange(y, 0, 1, `toneCurve[${index}].y`);
    return [x, y];
  });
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || first[0] !== 0 || last[0] !== 1) {
    throw new RangeError('Tone curve must cover x=0 through x=1');
  }
  const remaining = points.slice(1);
  let previous = first;
  for (const point of remaining) {
    if (point[0] <= previous[0] || point[1] < previous[1]) {
      throw new RangeError('Tone curve x must strictly increase and y must not decrease');
    }
    previous = point;
  }

  return value => {
    assertRange(value, 0, 1, 'Tone curve input');
    if (value === first[0]) return first[1];
    let left = first;
    for (const right of remaining) {
      if (value === right[0]) return right[1];
      if (value < right[0]) {
        const fraction = (value - left[0]) / (right[0] - left[0]);
        return left[1] + (right[1] - left[1]) * fraction;
      }
      left = right;
    }
    return last[1];
  };
}
