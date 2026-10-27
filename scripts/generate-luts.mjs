import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { buildLutBundle, loadLutSeed, writeLutBundle } from './lib/lutAssets.ts';
import { LUT_ENGINE_VERSION } from './lib/lutManifest.ts';

try {
  const { values } = parseArgs({ options: { seed: { type: 'string' }, out: { type: 'string' } }, allowPositionals: false });
  const root = fileURLToPath(new URL('../', import.meta.url));
  const seedPath = values.seed ? resolve(values.seed) : resolve(root, 'spec/filters.seed.json');
  const { seed, hash } = await loadLutSeed(seedPath, resolve(root, 'spec/filters.schema.json'));
  const output = values.out ? resolve(values.out) : resolve(root, 'assets/lut-drafts', LUT_ENGINE_VERSION, hash);
  const manifest = await writeLutBundle(output, buildLutBundle(seed, hash));
  console.log(`LUT 초안 생성: identity + 대표 필터 3종\n${manifest}`);
  console.log('생성 결과는 draft입니다. 수치 테스트, 별도 자산 검사, GPU 및 색감 검수 결과가 아닙니다.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
