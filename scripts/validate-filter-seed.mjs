import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createFilterSeedValidator } from './lib/filterSeed.ts';

// Node 26 (the recorded development environment) runs these erasable TypeScript modules directly.
const args = process.argv.slice(2);
if (args.length > 1) {
  console.error('사용법: npm run validate:filters -- [seed.json 경로]');
  process.exitCode = 1;
} else {
  const inputPath = args[0] ? resolve(args[0]) : new URL('../spec/filters.seed.json', import.meta.url);
  const schemaPath = new URL('../spec/filters.schema.json', import.meta.url);
  try {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const input = JSON.parse(await readFile(inputPath, 'utf8'));
    const result = createFilterSeedValidator(schema)(input);
    if (!result.ok) {
      for (const issue of result.issues) {
        console.error(`${issue.path || '/'} [${issue.kind}:${issue.code}] ${issue.message}`);
      }
      process.exitCode = 1;
    } else {
      console.log(`제작 초안 형식 확인: ${result.data.collections.length}개 컬렉션, ${result.data.filters.length}개 필터.`);
      console.log('LUT 자산, 색감 승인, GPU 및 실기기 동작은 이 명령의 검증 범위가 아닙니다.');
    }
  } catch (error) {
    console.error(`필터 seed를 검사하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
