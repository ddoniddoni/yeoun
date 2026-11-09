import { copyCameraSettings, type CameraSettings } from '../filters/cameraSettings';

export const RECIPE_SCHEMA_VERSION = 1;
export const RECIPE_NAME_LIMIT = 24;
export const RECIPE_LIMIT = 100;
export type RecipeFingerprint = (settings: CameraSettings) => string;
export type Recipe = Readonly<{
  id: string; name: string;
}> & (Readonly<{ available: true; settings: CameraSettings }>
  | Readonly<{ available: false; reason: string }>);
export type RecipeDraft = Readonly<{ id: string; name: string; payload: string; createdAt: string }>;

export function recipeName(input: string): string {
  const name = input.trim();
  const characters = [...name];
  const hasControl = characters.some(character => {
    const point = character.codePointAt(0)!;
    return point < 32 || point === 127 || point === 0x2028 || point === 0x2029;
  });
  if (characters.length < 1 || characters.length > RECIPE_NAME_LIMIT || hasControl) {
    throw new Error('이름은 줄바꿈 없이 1~24자로 입력해 주세요');
  }
  return name;
}
export function assertRecipeId(id: string): void {
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) throw new Error('RECIPE_ID');
}

// Only settings are kept: never photo URIs, captured dates, seeds, flash or exposure.
export function serializeRecipe(settings: CameraSettings, fingerprint: RecipeFingerprint): string {
  const snapshot = copyCameraSettings(settings);
  return JSON.stringify({ settings: snapshot, fingerprint: fingerprint(snapshot) });
}

/** An unavailable payload stays in storage. Never silently upgrade a saved look. */
export function readRecipe(id: string, name: string, schemaVersion: unknown, payload: unknown,
  fingerprint: RecipeFingerprint): Recipe {
  assertRecipeId(id);
  let displayName: string;
  try { displayName = recipeName(name); } catch { displayName = '이름을 확인할 수 없는 색감'; }
  const unavailable = (reason: string): Recipe => Object.freeze({ id, name: displayName, available: false, reason });
  if (schemaVersion !== RECIPE_SCHEMA_VERSION) return unavailable('이 색감을 열려면 지원하는 앱 버전이 필요해요');
  if (typeof payload !== 'string' || payload.length > 8192) return unavailable('저장된 설정을 읽을 수 없어요');
  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('RECIPE_PAYLOAD');
    data = parsed as Record<string, unknown>;
    if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) throw new Error('RECIPE_SETTINGS');
  } catch { return unavailable('저장된 설정을 읽을 수 없어요'); }
  try {
    // Runtime validation checks every ID, version, scalar and boolean, then whitelists fields.
    const settings = copyCameraSettings(data.settings as CameraSettings);
    if (data.fingerprint !== fingerprint(settings)) throw new Error('RECIPE_VERSION');
    return Object.freeze({ id, name: displayName, available: true, settings });
  } catch {
    return unavailable('이 설정에 필요한 필터 버전을 찾을 수 없어요. 지원하는 앱에서 다시 열어 주세요');
  }
}

export function recipeSettingsForContext(settings: CameraSettings, imported: boolean): CameraSettings {
  // Imported images never gain a date stamp implicitly; users can enable it afterward.
  return copyCameraSettings({ ...settings, dateStamp: imported ? false : settings.dateStamp });
}
