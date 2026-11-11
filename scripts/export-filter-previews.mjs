// Publish only the app-owned reference renders, never the private color-review fixtures.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: { rendered: { type: 'string' } }, allowPositionals: false });
if (!values.rendered) throw new Error('Required: --rendered artifacts/local/<render>');
const rendered = resolve(values.rendered);
if (!rendered.startsWith(resolve(root, 'artifacts/local') + '/')) throw new Error('Expected local render output');
const review = JSON.parse(await readFile(resolve(rendered, 'review.json'), 'utf8'));
const seedBytes = await readFile(resolve(root, 'spec/filters.seed.json'));
const seed = JSON.parse(seedBytes);
if (review.sourceSeedSha256 !== createHash('sha256').update(seedBytes).digest('hex') || review.strength !== 'default') {
  throw new Error('Render the current seed at default strength first');
}
const referenceFile = 'assets/filter-previews/reference.png';
if (review.fixtures.length !== 1 || review.fixtures[0].id !== 'reference' || review.fixtures[0].file !== referenceFile) {
  throw new Error('Only the bundled reference may be published');
}
const expected = new Map([['original', { lookVersion: undefined, intensity: 0 }],
  ...seed.filters.map(filter => [filter.id, { lookVersion: filter.lookVersion, intensity: filter.defaults.intensity }])]);
if (review.records.length !== expected.size || new Set(review.records.map(record => record.id)).size !== expected.size) {
  throw new Error('Incomplete preview set');
}
for (const record of review.records) {
  const look = expected.get(record.id);
  if (!look || record.fixture !== 'reference' || record.file !== `reference--${record.id}.png`
    || record.lookVersion !== look.lookVersion || record.intensity !== look.intensity) throw new Error('Mismatched preview');
}
const directory = resolve(root, 'assets/filter-previews');
for (const record of review.records) await copyFile(resolve(rendered, record.file), resolve(directory, `${record.id}.png`));
await writeFile(resolve(directory, 'manifest.json'), JSON.stringify({ ...review,
  referenceSha256: createHash('sha256').update(await readFile(resolve(root, referenceFile))).digest('hex'),
  purpose: 'Bundled static examples at default settings; not a live camera thumbnail.',
  records: review.records.map(record => ({ ...record, renderedFile: record.file, file: `${record.id}.png` })),
}, null, 2) + '\n');
console.log(`Exported ${review.records.length} static filter previews`);
