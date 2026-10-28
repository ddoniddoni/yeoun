import { digestLutBytes, readBundledLutBytes } from '../../src/platform/files/lutAssets';

jest.mock('expo-asset', () => ({ Asset: Object.assign(jest.fn(), { fromModule: jest.fn() }) }));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('expo-crypto', () => ({ CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digest: jest.fn() }));
const mockAsset = jest.requireMock<{ Asset: jest.Mock & { fromModule: jest.Mock } }>('expo-asset').Asset;
const mockFile = jest.requireMock<{ File: jest.Mock }>('expo-file-system').File;
const mockDigest = jest.requireMock<{ digest: jest.Mock }>('expo-crypto').digest;

function setup() {
  const registered = { name: 'identity', type: 'lut', hash: 'metro-md5', uri: 'bundled-resource', downloaded: true };
  const asset = { localUri: 'file:///cache/identity.lut', downloadAsync: jest.fn(async () => undefined) };
  const file = { exists: true, size: 40, bytes: jest.fn(async () => new Uint8Array(40)) };
  mockAsset.fromModule.mockReturnValue(registered);
  mockAsset.mockReturnValue(asset);
  mockFile.mockReturnValue(file);
  return { registered, asset, file };
}
afterEach(() => jest.resetAllMocks());

test('uses a fresh wrapper and reads only a bounded local file, without trusting the old downloaded flag', async () => {
  const r = setup();
  await readBundledLutBytes(1);
  await readBundledLutBytes(1);
  expect(mockAsset.fromModule).toHaveBeenCalledWith(1);
  expect(mockAsset).toHaveBeenCalledTimes(2);
  expect(r.asset.downloadAsync).toHaveBeenCalledTimes(2);
  expect(mockFile).toHaveBeenCalledWith('file:///cache/identity.lut');
  expect(r.file.bytes).toHaveBeenCalledTimes(2);
});

test('rejects drawable images, missing/oversized files and unavailable local URIs', async () => {
  const r = setup();
  r.registered.type = 'png';
  await expect(readBundledLutBytes(1)).rejects.toThrow(/raw/);
  r.registered.type = 'lut';
  r.asset.localUri = 'https://example.invalid/file';
  await expect(readBundledLutBytes(1)).rejects.toThrow(/local/);
  expect(mockFile).not.toHaveBeenCalled();
  r.asset.localUri = 'file:///cache/identity.lut';
  r.file.exists = false;
  await expect(readBundledLutBytes(1)).rejects.toThrow(/Missing/);
  r.file.exists = true;
  r.file.size = 1_000_001;
  await expect(readBundledLutBytes(1)).rejects.toThrow(/oversized/);
  expect(r.file.bytes).not.toHaveBeenCalled();
});

test('rechecks the byte length after reading and propagates download failures', async () => {
  const r = setup();
  r.file.bytes.mockResolvedValue(new Uint8Array(1_000_001));
  await expect(readBundledLutBytes(1)).rejects.toThrow(/after read/);
  r.asset.downloadAsync.mockRejectedValue(new Error('download failed'));
  await expect(readBundledLutBytes(1)).rejects.toThrow('download failed');
});

test('hashes binary bytes of the selected view and emits padded lowercase SHA-256 hex', async () => {
  mockDigest.mockImplementation(async (_algorithm: string, data: unknown) => {
    // The native iOS/Android boundary accepts a TypedArray, not a bare ArrayBuffer.
    if (!(data instanceof Uint8Array)) throw new Error('Expected native TypedArray input');
    return Uint8Array.from({ length: 32 }, (_, index) => index).buffer;
  });
  const view = new Uint8Array([99, 10, 20, 88]).subarray(1, 3);
  expect(await digestLutBytes(view)).toBe('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
  expect(mockDigest.mock.calls[0]![0]).toBe('SHA-256');
  const input = mockDigest.mock.calls[0]![1] as Uint8Array;
  expect(input).toBeInstanceOf(Uint8Array);
  expect(input.buffer).not.toBe(view.buffer);
  expect(input.byteOffset).toBe(0);
  expect(Array.from(input)).toEqual([10, 20]);
  mockDigest.mockResolvedValue(new ArrayBuffer(31));
  await expect(digestLutBytes(view)).rejects.toThrow(/digest length/);
});
