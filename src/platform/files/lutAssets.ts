import { Asset } from 'expo-asset';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { File } from 'expo-file-system';
import { MAX_LUT_PNG_BYTES } from '../../rendering/assets/lutPng';

/** Only called with modules from the static LUT registry, never a user path/URL. */
export async function readBundledLutBytes(moduleId: number): Promise<Uint8Array> {
  if (!Number.isInteger(moduleId) || moduleId < 0) throw new Error('Invalid LUT asset module');
  const registered = Asset.fromModule(moduleId);
  if (registered.type !== 'lut') throw new Error('Expected a raw .lut bundle asset');
  // Do not trust a previous JS wrapper's downloaded flag after the OS purges its cache.
  const asset = new Asset({ name: registered.name, type: registered.type, hash: registered.hash, uri: registered.uri });
  await asset.downloadAsync();
  if (!asset.localUri?.startsWith('file://')) throw new Error('LUT asset has no readable local file');
  const file = new File(asset.localUri);
  if (!file.exists || file.size < 33 || file.size > MAX_LUT_PNG_BYTES) throw new Error('Missing or oversized LUT asset file');
  const bytes = await file.bytes();
  if (bytes.length < 33 || bytes.length > MAX_LUT_PNG_BYTES) throw new Error('Invalid LUT file size after read');
  return bytes;
}

export async function digestLutBytes(bytes: Uint8Array): Promise<string> {
  // Explicit ArrayBuffer ownership also handles Buffer/subarray inputs without hashing neighboring bytes.
  const result = new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, Uint8Array.from(bytes).buffer));
  if (result.length !== 32) throw new Error('Invalid SHA-256 digest length');
  return Array.from(result, byte => byte.toString(16).padStart(2, '0')).join('');
}
