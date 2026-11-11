/** Previous immutable looks kept for saved camera settings, recipes and photo recovery. */
export const RETAINED_LOOK_VERSIONS: Readonly<Record<string, string>> = Object.freeze({
  'portrait-clear': '0.2.0-draft',
  'food-cafe': '0.2.0-draft',
  'retro-travel': '0.3.0-draft',
});

export function isRetainedLook(filterId: string, lookVersion: string): boolean {
  return Object.prototype.hasOwnProperty.call(RETAINED_LOOK_VERSIONS, filterId)
    && RETAINED_LOOK_VERSIONS[filterId] === lookVersion;
}
