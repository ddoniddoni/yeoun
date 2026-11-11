import manifest from '../../assets/lut-drafts/lut-authoring-0.1.0/c8ea7f44914526b054178910ff80954d4707e9b7e0a3f00f8df7f3d2c08c6969/filter-manifest.json';
import retainedManifest from '../../assets/lut-drafts/lut-authoring-0.1.0/c0f1e92e3a92bcfa8945db7e8a720ad2d3a247fdc7d4af1451db17c06484e8a6/filter-manifest.json';
import { isRetainedLook } from '../domain/filters/retainedLooks';
import { copyCameraSettings, type CameraSettings } from '../domain/filters/cameraSettings';
import { grainStyle } from '../domain/filters/grainStyle';
import { LUT_SKIA_BACKEND_VERSION } from '../rendering/shaders/lut';
import { SPATIAL_BACKEND_VERSION } from '../rendering/shaders/spatial';

/** Pin this look and its identity LUT; unrelated catalog changes do not invalidate it. */
export function recipeFingerprint(input: CameraSettings): string {
  const settings = copyCameraSettings(input);
  const catalog = isRetainedLook(settings.filterId, settings.lookVersion) ? retainedManifest : manifest;
  const id = settings.filterId === 'original' ? 'identity' : settings.filterId;
  const look = catalog.assets.find(asset => asset.filterId === id);
  const identity = catalog.assets.find(asset => asset.filterId === 'identity');
  if (!look || !identity || look.lookVersion !== settings.lookVersion || catalog.engineVersion !== settings.engineVersion) {
    throw new Error('RECIPE_VERSION');
  }
  const grain = grainStyle(settings.filterId);
  return [settings.rendererVersion, catalog.renderContractVersion, catalog.engineVersion, look.lookVersion,
    look.sha256, identity.sha256, LUT_SKIA_BACKEND_VERSION, SPATIAL_BACKEND_VERSION, grain.resolution, grain.amplitude].join('/');
}
