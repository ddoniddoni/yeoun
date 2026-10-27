export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
// Neutralize ONLY the orientation tag in an owned copy. Skia then cannot rotate it twice.
export function neutralizeOrientation(input: Uint8Array): { bytes: Uint8Array; orientation: ExifOrientation } {
  const bytes = input.slice();
  const view = new DataView(bytes.buffer);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('JPEG input required');
  let orientation: ExifOrientation = 1;
  let found = false;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('Invalid JPEG marker');
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(offset + 2);
    const end = offset + 2 + length;
    if (length < 2 || end > bytes.length) throw new Error('Truncated JPEG');
    if (marker === 0xe1 && length >= 8 && bytes[offset + 4] === 0x45 && bytes[offset + 5] === 0x78 &&
      bytes[offset + 6] === 0x69 && bytes[offset + 7] === 0x66 && bytes[offset + 8] === 0 && bytes[offset + 9] === 0) {
      const tiff = offset + 10;
      const requireBytes = (start: number, count: number) => {
        if (start < tiff || start + count > end) throw new Error('Invalid EXIF bounds');
      };
      requireBytes(tiff, 8);
      const order = view.getUint16(tiff);
      if (order !== 0x4949 && order !== 0x4d4d) throw new Error('Invalid EXIF byte order');
      const little = order === 0x4949;
      if (view.getUint16(tiff + 2, little) !== 42) throw new Error('Invalid EXIF header');
      const ifd = tiff + view.getUint32(tiff + 4, little);
      requireBytes(ifd, 2);
      const count = view.getUint16(ifd, little);
      requireBytes(ifd + 2, count * 12);
      for (let i = 0; i < count; i++) {
        const entry = ifd + 2 + i * 12;
        if (view.getUint16(entry, little) !== 0x0112) continue;
        if (found || view.getUint16(entry + 2, little) !== 3 || view.getUint32(entry + 4, little) !== 1) throw new Error('Invalid EXIF orientation');
        const value = view.getUint16(entry + 8, little);
        if (value < 1 || value > 8) throw new Error('Unsupported EXIF orientation');
        orientation = value as ExifOrientation;
        view.setUint16(entry + 8, 1, little);
        found = true;
      }
    }
    offset = end;
  }
  return { bytes, orientation };
}
// Affine [a,b,c,d,tx,ty]: x'=ax+cy+tx, y'=bx+dy+ty.
export function orientationTransform(o: ExifOrientation, w: number, h: number): readonly number[] {
  switch (o) {
    case 1: return [1, 0, 0, 1, 0, 0];
    case 2: return [-1, 0, 0, 1, w, 0];
    case 3: return [-1, 0, 0, -1, w, h];
    case 4: return [1, 0, 0, -1, 0, h];
    case 5: return [0, 1, 1, 0, 0, 0];
    case 6: return [0, 1, -1, 0, h, 0];
    case 7: return [0, -1, -1, 0, h, w];
    case 8: return [0, -1, 1, 0, 0, w];
  }
}
export function centerCrop43(width: number, height: number) {
  const ratio = width > height ? 4 / 3 : 3 / 4;
  const w = Math.floor(Math.min(width, height * ratio));
  const h = Math.floor(Math.min(height, width / ratio));
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
