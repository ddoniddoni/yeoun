import { useEffect, useMemo, useState } from 'react';
import { cameraSettings, type CameraSettings } from '../domain/filters/cameraSettings';
import { initialComparison, updateComparison, type ComparisonAction } from '../domain/filters/previewComparison';

export function usePreviewComparison(settings: CameraSettings, context: string, available: boolean) {
  const [state, setState] = useState(() => initialComparison(context));
  const current = state.context === context;
  const active = available && current && (state.held || state.pinned);
  const pinned = available && current && state.pinned;
  // Gate immediately above; clear persistent/held state when the screen or selection changes.
  useEffect(() => {
    setState(previous => previous.context !== context || !available
      ? updateComparison(previous, context, 'reset') : previous);
  }, [available, context]);
  const act = (action: ComparisonAction) => {
    if (available || action === 'release') setState(previous => updateComparison(previous, context, action));
  };
  const previewSettings = useMemo(() => active ? cameraSettings('original') : settings, [active, settings]);
  return { active, pinned, previewSettings,
    // Returning to a filter must wait for a new draw, even after a very short press.
    requestKey: `${context}/comparison/${state.revision}/${active}`,
    hold: () => act('hold'), release: () => act('release'), toggle: () => act('toggle') };
}
