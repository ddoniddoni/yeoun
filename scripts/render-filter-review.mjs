// Local visual proof sheets. Uses the app's actual LUT PNGs and SkSL, on CanvasKit's
// software surface. This is not iOS/Android capture, GPU, JPEG, or performance evidence.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { decodeLutPng } from './lib/lutAssets.ts';
import { createLutAlphaPlanes } from '../src/rendering/reference/lutPlanes.ts';
import { spatialGeometry, bloomGeometry } from '../src/rendering/reference/spatialGeometry.ts';
import { grainStyle } from '../src/domain/filters/grainStyle.ts';
import { NO_RETRO, hasSpatialEffects } from '../src/domain/filters/retroControls.ts';
import { LUT_SKSL } from '../src/rendering/shaders/lut.ts';
import { BRIGHT_SKSL, BLUR_SKSL, SPATIAL_SKSL, SPATIAL_BACKEND_VERSION } from '../src/rendering/shaders/spatial.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: {
  fixtures: { type: 'string' }, out: { type: 'string' }, seed: { type: 'string' },
  font: { type: 'string' }, filters: { type: 'string' }, strength: { type: 'string', default: 'default' },
  'max-edge': { type: 'string', default: '600' },
}, allowPositionals: false });
if (!values.fixtures || !values.out || !values.font) {
  throw new Error('Required: --fixtures sources.json --out artifacts/local/<run> --font font.ttf');
}
const out = resolve(values.out);
if (!out.startsWith(resolve(root, 'artifacts/local') + '/')) throw new Error('Review output must stay in ignored artifacts/local/');
const strength = values.strength === 'default' ? undefined : Number(values.strength);
const maxEdge = Number(values['max-edge']);
if (!Number.isInteger(maxEdge) || maxEdge < 300 || maxEdge > 1600) throw new Error('Max edge must be 300..1600');
if (strength !== undefined && (!Number.isFinite(strength) || strength < 0 || strength > 1)) throw new Error('Strength must be default or 0..1');
const seedBytes = await readFile(resolve(values.seed ?? resolve(root, 'spec/filters.seed.json')));
const seed = JSON.parse(seedBytes);
const seedHash = createHash('sha256').update(seedBytes).digest('hex');
const assetRoot = resolve(root, 'assets/lut-drafts/lut-authoring-0.1.0', seedHash);
const manifest = JSON.parse(await readFile(resolve(assetRoot, 'filter-manifest.json'), 'utf8'));
if (manifest.sourceSeedSha256 !== seedHash) throw new Error('Seed/manifest mismatch');
const fixtures = JSON.parse(await readFile(resolve(values.fixtures), 'utf8'));
const requested = values.filters?.split(',');
const looks = seed.filters.filter(filter => !requested || requested.includes(filter.id));
if (requested?.some(id => !looks.some(filter => filter.id === id))) throw new Error('Unknown filter');
const require = createRequire(import.meta.url);
const CanvasKitInit = require('canvaskit-wasm');
const kitPath = dirname(require.resolve('canvaskit-wasm'));
const CK = await CanvasKitInit({ locateFile: name => resolve(kitPath, name) });
const fontBytes = await readFile(resolve(values.font));
const typeface = CK.Typeface.MakeTypefaceFromData(fontBytes);
if (!typeface) throw new Error('Cannot load review font');
const font = new CK.Font(typeface, 16);
const textPaint = new CK.Paint(); textPaint.setColor(CK.Color(225, 225, 225)); textPaint.setAntiAlias(true);
const effects = [LUT_SKSL, BRIGHT_SKSL, BLUR_SKSL, SPATIAL_SKSL].map(source => {
  let message = '';
  const effect = CK.RuntimeEffect.Make(source, error => { message = error; });
  if (!effect) throw new Error(`Review SkSL compilation failed: ${message}`);
  return effect;
});
const [lutEffect, brightEffect, blurEffect, spatialEffect] = effects;
const records = [];
await mkdir(out, { recursive: true });
await writeFile(resolve(out, 'seed.json'), seedBytes);

function own(list, item) { if (!item) throw new Error('CanvasKit allocation failed'); list.push(item); return item; }
function release(list) { for (const item of list.reverse()) item.delete ? item.delete() : item.dispose(); }
function imageShader(image, mode = CK.FilterMode.Linear) {
  return image.makeShaderOptions(CK.TileMode.Clamp, CK.TileMode.Clamp, mode, CK.MipmapMode.None);
}
function renderSmall(shader, width, height, owned) {
  const surface = own(owned, CK.MakeSurface(width, height));
  const paint = own(owned, new CK.Paint()); paint.setShader(shader);
  surface.getCanvas().drawRect(CK.XYWHRect(0, 0, width, height), paint); surface.flush();
  return own(owned, imageShader(own(owned, surface.makeImageSnapshot()), CK.FilterMode.Nearest));
}

// Same ordering and uniform layout as bindSpatialSource. Geometry is upright SDR;
// EXIF, camera pixel formats, Metal and Android GPU paths are deliberately not simulated.
function bindSpatial(source, looked, settings, geometry, owned) {
  const small = bloomGeometry(geometry.width, geometry.height);
  let blurred = looked;
  if (settings.bloom > 0 || settings.halation > 0) {
    const bright = own(owned, brightEffect.makeShaderWithChildren([
      ...geometry.inverse, geometry.width, geometry.height, small.scaleX, small.scaleY,
    ], [looked]));
    const brightImage = renderSmall(bright, small.width, small.height, owned);
    const horizontal = own(owned, blurEffect.makeShaderWithChildren([1, 0, small.sigmaX], [brightImage]));
    const horizontalImage = renderSmall(horizontal, small.width, small.height, owned);
    const vertical = own(owned, blurEffect.makeShaderWithChildren([0, 1, small.sigmaY], [horizontalImage]));
    blurred = renderSmall(vertical, small.width, small.height, owned);
  }
  const grain = grainStyle(settings.filterId);
  return own(owned, spatialEffect.makeShaderWithChildren([
    ...geometry.forward, geometry.width, geometry.height, small.scaleX, small.scaleY,
    settings.intensity, settings.grain, settings.bloom, 317, grain.resolution, grain.amplitude,
    settings.vignette, settings.halation, settings.sharpness, settings.softness, settings.digitalNoise,
    settings.lightLeak, settings.dust, settings.dateStamp ? 1 : 0, 261030,
  ], [source, looked, blurred]));
}

try {
  for (const fixture of fixtures) {
    if (!/^[a-z0-9-]+$/.test(fixture.id)) throw new Error('Invalid fixture ID');
    const bytes = await readFile(resolve(root, fixture.file));
    let image = CK.MakeImageFromEncoded(bytes);
    if (!image) throw new Error(`Cannot decode ${fixture.id}`);
    if (Math.max(image.width(), image.height()) > maxEdge) {
      const scale = maxEdge / Math.max(image.width(), image.height());
      const width = Math.round(image.width() * scale), height = Math.round(image.height() * scale);
      const resized = CK.MakeSurface(width, height), paint = new CK.Paint();
      if (!resized) throw new Error('Cannot allocate source resize');
      try {
        resized.getCanvas().drawImageRectOptions(image, CK.XYWHRect(0, 0, image.width(), image.height()),
          CK.XYWHRect(0, 0, width, height), CK.FilterMode.Linear, CK.MipmapMode.None, paint);
        resized.flush(); image.delete(); image = resized.makeImageSnapshot();
      } finally { paint.delete(); resized.dispose(); }
    }
    const geometry = spatialGeometry(image.width(), image.height(), [1, 0, 0, 1, 0, 0]);
    const columnWidth = 320, rowHeight = image.width() > image.height() ? 272 : 455;
    const sheet = CK.MakeSurface(columnWidth * 4, rowHeight * Math.ceil((looks.length + 1) / 4));
    if (!sheet) throw new Error('Cannot allocate proof sheet');
    const canvas = sheet.getCanvas(); canvas.clear(CK.Color(25, 25, 25));
    const imagePaint = new CK.Paint();
    try {
      for (const [index, filter] of [null, ...looks].entries()) {
        const owned = [];
        const id = filter?.id ?? 'original';
        try {
          const surface = own(owned, CK.MakeSurface(geometry.width, geometry.height));
          const output = surface.getCanvas();
          output.translate(geometry.forward[4], geometry.forward[5]);
          if (!filter || strength === 0) output.drawImage(image, 0, 0);
          else {
            const asset = manifest.assets.find(item => item.filterId === id && item.lookVersion === filter.lookVersion);
            if (!asset) throw new Error(`Missing asset ${id}`);
            const png = await readFile(resolve(assetRoot, asset.path));
            if (createHash('sha256').update(png).digest('hex') !== asset.sha256) throw new Error(`Checksum ${id}`);
            const planes = createLutAlphaPlanes(decodeLutPng(png));
            const children = planes.map(plane => own(owned, imageShader(own(owned, CK.MakeImage({
              width: 210, height: 210, colorType: CK.ColorType.Alpha_8,
              alphaType: CK.AlphaType.Premul, colorSpace: CK.ColorSpace.SRGB,
            }, plane, 210)))));
            const source = own(owned, imageShader(image));
            const settings = { ...NO_RETRO, ...filter.defaults, filterId: id, intensity: strength ?? filter.defaults.intensity };
            const spatial = hasSpatialEffects(settings);
            let shader = own(owned, lutEffect.makeShaderWithChildren([spatial ? 1 : settings.intensity], [source, ...children]));
            if (spatial) shader = bindSpatial(source, shader, settings, geometry, owned);
            const paint = own(owned, new CK.Paint()); paint.setShader(shader);
            output.drawRect(CK.XYWHRect(0, 0, image.width(), image.height()), paint);
          }
          surface.flush();
          const result = own(owned, surface.makeImageSnapshot());
          const file = `${fixture.id}--${id}.png`;
          await writeFile(resolve(out, file), result.encodeToBytes());
          const x = index % 4 * columnWidth + 8, y = Math.floor(index / 4) * rowHeight;
          const w = columnWidth - 16, h = w * geometry.height / geometry.width;
          canvas.drawText(`${id} ${filter ? Math.round((strength ?? filter.defaults.intensity) * 100) + '%' : ''}`, x, y + 24, textPaint, font);
          canvas.drawImageRectOptions(result, CK.XYWHRect(0, 0, geometry.width, geometry.height), CK.XYWHRect(x, y + 36, w, h),
            CK.FilterMode.Linear, CK.MipmapMode.None, imagePaint);
          records.push({ fixture: fixture.id, id, file, lookVersion: filter?.lookVersion, intensity: filter ? strength ?? filter.defaults.intensity : 0 });
        } finally { release(owned); }
      }
      sheet.flush(); const snapshot = sheet.makeImageSnapshot();
      try { await writeFile(resolve(out, `${fixture.id}--sheet.png`), snapshot.encodeToBytes()); }
      finally { snapshot.delete(); }
      console.log(`Rendered ${fixture.id}: original + ${looks.length} looks (${geometry.width}x${geometry.height})`);
    } finally { imagePaint.delete(); sheet.dispose(); image.delete(); }
  }
  await writeFile(resolve(out, 'review.json'), JSON.stringify({
    sourceSeedSha256: seedHash, spatialBackend: SPATIAL_BACKEND_VERSION,
    backend: 'CanvasKit 0.40.0 software; NOT native/GPU/capture/JPEG verification',
    strength: values.strength, maxEdge, grainSeed: 317, stampDate: 261030,
    shaders: [LUT_SKSL, BRIGHT_SKSL, BLUR_SKSL, SPATIAL_SKSL].map(source => createHash('sha256').update(source).digest('hex')),
    fixtures, records,
  }, null, 2) + '\n');
} finally { effects.forEach(effect => effect.delete()); font.delete(); typeface.delete(); textPaint.delete(); }
