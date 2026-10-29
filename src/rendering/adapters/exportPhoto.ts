import { File } from 'expo-file-system';
import { AlphaType, ColorType, FilterMode, ImageFormat, MipmapMode, Skia, TileMode,
  type SkImage, type SkSurface } from '@shopify/react-native-skia';
import type { Draft, Output, Snapshot } from '../../domain/capture/controller';
import { cameraSettings, copyCameraSettings, type CameraSettings } from '../../domain/filters/cameraSettings';
import { draftFile, removeFile } from '../../platform/files/drafts';
import { centerCrop43, neutralizeOrientation, orientationTransform } from './jpegOrientation';
import { createBundledDraftLutLoader, loadDraftLutPipeline } from './bundledLutLoader';
import { assertGrainSeed } from '../../domain/filters/grainSeed';
import { hasSpatialEffects } from '../../domain/filters/retroControls';
import { spatialGeometry } from '../reference/spatialGeometry';
import { bindSpatialSource, createSpatialResources } from './spatialEffects';
import type { SkiaLutPipeline } from './lutSkia';
import { releaseNativeResources, type NativeResource } from './lutResources';
// All native objects stay on the RN JS runtime's own context. No camera texture
// crosses here. Synchronous GPU/readback/encoding latency is NOT yet measured.
export function renderJpeg(input: Uint8Array, matrix: readonly number[]) {
  return renderStyledJpeg(input, { kind: 'matrix', matrix });
}

export function renderLutJpeg(input: Uint8Array, settings: CameraSettings, pipeline?: SkiaLutPipeline, grainSeed = 0, stampDate = 0) {
  assertGrainSeed(grainSeed);
  return renderStyledJpeg(input, { kind: 'lut', settings: copyCameraSettings(settings), pipeline, grainSeed, stampDate });
}

type JpegStyle = { kind: 'matrix'; matrix: readonly number[] } |
  { kind: 'lut'; settings: CameraSettings; pipeline?: SkiaLutPipeline; grainSeed: number; stampDate: number };

// Only the display-only comparison uses a size bound. Saved exports remain full resolution.
export function renderOriginalComparisonJpeg(input: Uint8Array) {
  return renderStyledJpeg(input, { kind: 'lut', settings: cameraSettings('original'), grainSeed: 0, stampDate: 0 }, 1600);
}

function renderStyledJpeg(input: Uint8Array, style: JpegStyle, maxEdge?: number) {
  const normalized = neutralizeOrientation(input);
  const data = Skia.Data.fromBytes(normalized.bytes);
  let image: SkImage | null = null;
  let surface: SkSurface | null = null;
  const drawing: NativeResource[] = [];
  let rendered: SkImage | undefined;
  try {
    image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) throw new Error('Camera JPEG decode failed');
    if (image.width() * image.height() > 16_000_000) throw new Error('JPEG exceeds M0 16MP processing limit');
    const rotated = normalized.orientation >= 5;
    const crop = centerCrop43(rotated ? image.height() : image.width(), rotated ? image.width() : image.height());
    const scale = maxEdge ? Math.min(1, maxEdge / Math.max(crop.width, crop.height)) : 1;
    const width = Math.max(1, Math.round(crop.width * scale));
    const height = Math.max(1, Math.round(crop.height * scale));
    surface = Skia.Surface.MakeOffscreen(width, height);
    if (!surface) throw new Error(maxEdge ? 'Comparison GPU surface unavailable'
      : 'Full-resolution GPU surface unavailable; no downscale applied');
    const canvas = surface.getCanvas(); canvas.clear(Skia.Color('white'));
    if (maxEdge) canvas.scale(width / crop.width, height / crop.height);
    const [a, b, c, d, tx, ty] = orientationTransform(normalized.orientation, image.width(), image.height());
    canvas.translate(-crop.x, -crop.y);
    canvas.concat([a!, c!, tx!, b!, d!, ty!, 0, 0, 1]);
    if (style.kind === 'matrix') {
      const filter = Skia.ColorFilter.MakeMatrix([...style.matrix]); drawing.push(filter);
      const paint = Skia.Paint(); drawing.push(paint);
      paint.setColorFilter(filter); canvas.drawImage(image, 0, 0, paint);
    } else if (style.settings.filterId === 'original' || style.settings.intensity === 0) {
      if (maxEdge) canvas.drawImageOptions(image, 0, 0, FilterMode.Linear, MipmapMode.None);
      else canvas.drawImage(image, 0, 0);
    } else {
      if (!style.pipeline) throw new Error('선택한 필터가 없어 사진 처리를 중단했어요.');
      const source = image.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None);
      drawing.push(source);
      const hasSpatial = hasSpatialEffects(style.settings);
      const binding = style.pipeline.bindSource(source, hasSpatial ? 1 : style.settings.intensity); drawing.push(binding);
      let shader = binding.shader;
      if (hasSpatial) {
        const resources = createSpatialResources(); drawing.push(...resources.owned);
        shader = bindSpatialSource(resources, source, shader, style.settings,
          spatialGeometry(image.width(), image.height(), [a!, b!, c!, d!, tx!, ty!]), style.grainSeed, drawing, style.stampDate);
      }
      const paint = Skia.Paint(); drawing.push(paint);
      paint.setShader(shader);
      canvas.drawRect({ x: 0, y: 0, width: image.width(), height: image.height() }, paint);
    }
    surface.flush();
    rendered = surface.makeImageSnapshot();
    const bytes = rendered.encodeToBytes(ImageFormat.JPEG, 94);
    if (!bytes.length) throw new Error('JPEG encode failed');
    return { bytes, width, height };
  } finally {
    releaseNativeResources([data, ...(image ? [image] : []), ...(surface ? [surface] : []),
      ...drawing, ...(rendered ? [rendered] : [])]);
  }
}
export async function exportPhoto(draft: Draft, snapshot: Snapshot): Promise<Output> {
  return exportDraft(draft, snapshot, false);
}

export async function exportOriginalComparison(draft: Draft, snapshot: Snapshot): Promise<Output> {
  return exportDraft(draft, snapshot, true);
}

async function exportDraft(draft: Draft, snapshot: Snapshot, comparison: boolean): Promise<Output> {
  const source = new File(draft.sourceUri);
  const file = draftFile(snapshot.id, comparison ? 'comparison-original.jpg' : 'filtered.jpg');
  let pipeline: SkiaLutPipeline | undefined;
  try {
    const settings = comparison ? cameraSettings('original') : copyCameraSettings(snapshot.settings);
    if (settings.filterId !== 'original' && settings.intensity > 0) {
      // Export owns a separate pipeline on RN's context. Never borrow a camera texture or cache.
      const loader = createBundledDraftLutLoader();
      try { pipeline = (await loadDraftLutPipeline(loader, settings)).pipeline; }
      finally { loader.clearCache(); }
    }
    const input = await source.bytes();
    const result = comparison ? renderOriginalComparisonJpeg(input)
      : renderLutJpeg(input, settings, pipeline, snapshot.grainSeed, snapshot.stampDate);
    // Release before publishing/writing output so a disposal failure cannot orphan a successful file.
    pipeline?.dispose(); pipeline = undefined;
    file.write(result.bytes);
    // Reopen actual disk bytes and force decode; existence alone is insufficient.
    if (!file.exists || file.size === 0) throw new Error('JPEG write failed');
    const checkData = Skia.Data.fromBytes(await file.bytes());
    let checkImage: SkImage | null = null;
    try {
      checkImage = Skia.Image.MakeImageFromEncoded(checkData);
      if (!checkImage || checkImage.width() !== result.width || checkImage.height() !== result.height ||
        !checkImage.readPixels(0, 0, { width: 1, height: 1, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Opaque })) {
        throw new Error('Written JPEG validation failed');
      }
    } finally { releaseNativeResources([checkData, ...(checkImage ? [checkImage] : [])]); }
    return { uri: file.uri, width: result.width, height: result.height, bytes: file.size };
  } catch (error) { await removeFile(file.uri); throw error; }
  finally { pipeline?.dispose(); }
}
