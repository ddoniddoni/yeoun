import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { loadLutSeed, validateLutBundle } from './lib/lutAssets.ts';
import { LUT_ENGINE_VERSION } from './lib/lutManifest.ts';

try {
  const { values } = parseArgs({ options: { seed: { type: 'string' }, manifest: { type: 'string' } }, allowPositionals: false });
  const root = fileURLToPath(new URL('../', import.meta.url));
  const seedPath = values.seed ? resolve(values.seed) : resolve(root, 'spec/filters.seed.json');
  const { seed, hash } = await loadLutSeed(seedPath, resolve(root, 'spec/filters.schema.json'));
  const path = values.manifest ? resolve(values.manifest)
    : resolve(root, 'assets/lut-drafts', LUT_ENGINE_VERSION, hash, 'filter-manifest.json');
  const manifest = await validateLutBundle(path, seed, hash);
  console.log(`초안 자산 ${manifest.assets.length}개: manifest, SHA-256, PNG 형식과 패딩 확인.`);
  console.log('색상 정확도·GPU sampling·색감 승인은 검사하지 않았으며 상태는 draft로 유지됩니다.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
