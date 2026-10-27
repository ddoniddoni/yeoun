import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const dependencies = await Promise.all(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).map(async name => {
  const installed = JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8'));
  const { stdout } = await exec('npm', ['view', `${name}@${installed.version}`, 'version', 'peerDependencies', 'engines', 'license', '--json']);
  return { name, installedVersion: installed.version, registry: JSON.parse(stdout) };
}));
await writeFile('docs/M0_DEPENDENCIES.json', JSON.stringify({ checkedAt: new Date().toISOString(), node: process.version, dependencies }, null, 2) + '\n');
console.log(`Recorded ${dependencies.length} exact-version npm metadata entries`);
