import { File } from 'expo-file-system';
import { AlphaType, ColorType, ImageFormat, Skia, type SkColorFilter, type SkImage, type SkPaint, type SkSurface } from '@shopify/react-native-skia';
import type { Draft, Output, Snapshot } from '../../domain/capture/controller';
import { draftFile, removeFile } from '../../platform/files/drafts';
import { centerCrop43, neutralizeOrientation, orientationTransform } from './jpegOrientation';
// All native objects stay on the RN JS runtime's own context. No camera texture
// crosses here. Synchronous GPU/readback/encoding latency is NOT yet measured.
export function renderJpeg(input: Uint8Array, matrix: readonly number[]) {
  const normalized = neutralizeOrientation(input);
  const data = Skia.Data.fromBytes(normalized.bytes);
  let image: SkImage | null = null;
  let surface: SkSurface | null = null;
  let paint: SkPaint | undefined;
  let filter: SkColorFilter | undefined;
  let rendered: SkImage | undefined;
  try {
    image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) throw new Error('Camera JPEG decode failed');
    if (image.width() * image.height() > 16_000_000) throw new Error('JPEG exceeds M0 16MP processing limit');
    const rotated = normalized.orientation >= 5;
    const crop = centerCrop43(rotated ? image.height() : image.width(), rotated ? image.width() : image.height());
    surface = Skia.Surface.MakeOffscreen(crop.width, crop.height);
    if (!surface) throw new Error('Full-resolution GPU surface unavailable; no downscale applied');
    paint = Skia.Paint(); filter = Skia.ColorFilter.MakeMatrix([...matrix]);
    const canvas = surface.getCanvas(); canvas.clear(Skia.Color('white'));
    const [a, b, c, d, tx, ty] = orientationTransform(normalized.orientation, image.width(), image.height());
    canvas.translate(-crop.x, -crop.y);
    canvas.concat([a!, c!, tx!, b!, d!, ty!, 0, 0, 1]);
    paint.setColorFilter(filter); canvas.drawImage(image, 0, 0, paint); surface.flush();
    rendered = surface.makeImageSnapshot();
    const bytes = rendered.encodeToBytes(ImageFormat.JPEG, 94);
    if (!bytes.length) throw new Error('JPEG encode failed');
    return { bytes, width: crop.width, height: crop.height };
  } finally {
    rendered?.dispose(); paint?.dispose(); filter?.dispose(); surface?.dispose(); image?.dispose(); data.dispose();
  }
}
export async function exportPhoto(draft: Draft, snapshot: Snapshot): Promise<Output> {
  const source = new File(draft.sourceUri);
  const file = draftFile(snapshot.id, 'filtered.jpg');
  try {
    const result = renderJpeg(await source.bytes(), snapshot.matrix);
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
    } finally { checkImage?.dispose(); checkData.dispose(); }
    return { uri: file.uri, width: result.width, height: result.height, bytes: file.size };
  } catch (error) { await removeFile(file.uri); throw error; }
}
