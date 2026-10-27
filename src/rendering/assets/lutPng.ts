export const MAX_LUT_PNG_BYTES = 1_000_000;
const signature = [137, 80, 78, 71, 13, 10, 26, 10];

function uint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0;
}
function kindAt(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset]!, bytes[offset + 1]!, bytes[offset + 2]!, bytes[offset + 3]!);
}
function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let index = start; index < end; index++) {
    crc ^= bytes[index]!;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Bounded raw LUT PNG only. Reject profiles/gamma/animation before a native decoder allocates. */
export function assertLutPngContainer(bytes: Uint8Array): void {
  if (bytes.length < 33 || bytes.length > MAX_LUT_PNG_BYTES || signature.some((byte, index) => bytes[index] !== byte) ||
      uint32(bytes, 8) !== 13 || kindAt(bytes, 12) !== 'IHDR' || uint32(bytes, 16) !== 210 || uint32(bytes, 20) !== 210 ||
      bytes[24] !== 8 || bytes[25] !== 6 || bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] !== 0) {
    throw new Error('Expected a non-interlaced 210x210 RGBA8 PNG under 1 MB');
  }
  let cursor = 8;
  let hasImageData = false;
  while (cursor + 12 <= bytes.length) {
    const length = uint32(bytes, cursor);
    const kind = kindAt(bytes, cursor + 4);
    const end = cursor + length + 12;
    if (end > bytes.length) throw new Error('Truncated PNG chunk');
    if (!['IHDR', 'IDAT', 'IEND'].includes(kind)) throw new Error(`Unexpected LUT PNG chunk: ${kind}`);
    if (kind === 'IHDR' && cursor !== 8) throw new Error('Duplicate PNG header');
    if (uint32(bytes, end - 4) !== crc32(bytes, cursor + 4, end - 4)) throw new Error(`Invalid PNG CRC: ${kind}`);
    if (kind === 'IDAT' && length > 0) hasImageData = true;
    if (kind === 'IEND') {
      if (hasImageData && length === 0 && end === bytes.length) return;
      break;
    }
    cursor = end;
  }
  throw new Error('Invalid PNG ending');
}
