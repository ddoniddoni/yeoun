// Artwork export only; does not start the app, alter LUTs, or install packages.
// macOS Quick Look is already available on the project workstation.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { filterIllustrations, illustrationBody } from '../assets/filter-icons/artwork.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceDir = path.join(root, 'work/filter-icon-artwork/source');
const renderedDir = path.join(root, 'work/filter-icon-artwork/rendered');
const assetDir = path.join(root, 'assets/filter-icons');
await Promise.all([sourceDir, renderedDir, assetDir].map(dir => mkdir(dir, { recursive: true })));
const files = [];
for (const icon of filterIllustrations) {
  const file = path.join(sourceDir, `${icon.id}.svg`);
  // Quick Look's SVG document viewport is 300 points; the PNG output is 192px.
  await writeFile(file, `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fff"/>${illustrationBody(icon)}</svg>\n`);
  files.push(file);
}
execFileSync('/usr/bin/qlmanage', ['-t', '-s', '192', '-f', '1', '-o', renderedDir, ...files], { stdio: 'pipe' });
for (const icon of filterIllustrations) {
  await copyFile(path.join(renderedDir, `${icon.id}.svg.png`), path.join(assetDir, `${icon.id}.png`));
}
const tiles = filterIllustrations.map((icon, index) => {
  const x = 22 + index % 6 * 144;
  const y = 150 + Math.floor(index / 6) * 192;
  const selected = icon.id === 'portrait-clear';
  return `<g transform="translate(${x} ${y})">
    <rect x="10" y="0" width="112" height="94" rx="16" fill="#fff" stroke="${selected ? '#B84435' : '#E6D8CE'}" stroke-width="${selected ? 2 : 1}"/>
    <svg x="30" y="11" width="72" height="72" viewBox="0 0 64 64">${illustrationBody(icon)}</svg>
    ${selected ? '<circle cx="112" cy="83" r="10" fill="#B84435"/><path d="M107 83l3 3 6-7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    <text x="66" y="123" text-anchor="middle" font-size="16" fill="${selected ? '#B84435' : '#776963'}">${icon.label}</text>
  </g>`;
}).join('');
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 900 900">
  <rect width="900" height="900" fill="#FFF9F3"/>
  <g font-family="Apple SD Gothic Neo, sans-serif">
    <text x="32" y="64" font-size="32" font-weight="600" fill="#302A28">여운 · 필터 그림</text>
    <text x="32" y="99" font-size="16" fill="#776963">작은 인화지 위에, 각 색감의 한 장면</text>
    ${tiles}
    <path d="M32 770h836" stroke="#E6D8CE"/>
    <text x="32" y="807" font-size="15" fill="#776963">이름과 함께 고르는 18개의 사물 그림 · 같은 선, 다른 이야기</text>
    <text x="32" y="835" font-size="13" fill="#776963">식별용 일러스트이며 실제 필터 처리 사진은 아닙니다.</text>
  </g>
</svg>`;
const sheetPath = path.join(sourceDir, 'contact-sheet.svg');
await writeFile(sheetPath, sheet);
execFileSync('/usr/bin/qlmanage', ['-t', '-s', '1200', '-f', '1', '-o', renderedDir, sheetPath], { stdio: 'pipe' });
console.log(`Exported ${filterIllustrations.length} filter icons to assets/filter-icons (192 × 192 PNG)`);
console.log(`Contact sheet: ${path.join(renderedDir, 'contact-sheet.svg.png')}`);
