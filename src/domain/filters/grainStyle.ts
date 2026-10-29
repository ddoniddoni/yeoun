export type GrainStyle = Readonly<{ resolution: number; amplitude: number }>;

// Part of the versioned look: relative grain scale survives preview/export sizing.
export function grainStyle(filterId: string): GrainStyle {
  'worklet';
  return filterId === 'retro-film'
    ? { resolution: 800, amplitude: 0.075 }
    : { resolution: 1600, amplitude: 0.04 };
}
