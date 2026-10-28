export type PreviewComparison = Readonly<{
  context: string; held: boolean; pinned: boolean; revision: number;
}>;
export type ComparisonAction = 'hold' | 'release' | 'toggle' | 'reset';

export function initialComparison(context: string): PreviewComparison {
  return { context, held: false, pinned: false, revision: 0 };
}

/** A late release from an old selection must not cancel a newer gesture. */
export function updateComparison(state: PreviewComparison, context: string, action: ComparisonAction): PreviewComparison {
  if (action === 'release' && state.context !== context) return state;
  const current = state.context === context ? state : initialComparison(context);
  const held = action === 'hold';
  const pinned = action === 'toggle' ? !current.pinned : action === 'reset' ? false : current.pinned;
  if (state.context === context && held === state.held && pinned === state.pinned) return state;
  return { context, held, pinned, revision: state.revision + 1 };
}
