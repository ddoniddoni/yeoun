// Artwork export only. Does not build, install, or run the app.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const brand = fileURLToPath(new URL('../assets/brand/', import.meta.url));
for (const [source, output, size] of [
  ['yeoun-icon-source.png', 'yeoun-icon.png', 1024],
  ['yeoun-icon-source.png', 'yeoun-play-store.png', 512],
  ['yeoun-adaptive-source.png', 'yeoun-adaptive-foreground.png', 1024],
]) {
  execFileSync('/usr/bin/sips', ['-z', String(size), String(size), brand + source, '--out', brand + output], { stdio: 'pipe' });
}
// Play requires 32-bit PNG; keep the existing opaque pixels and add an alpha channel.
const playPath = brand + 'yeoun-play-store.png';
const play = PNG.sync.read(readFileSync(playPath));
writeFileSync(playPath, PNG.sync.write(play, { colorType: 6, inputColorType: 6 }));
execFileSync('/usr/bin/sips', ['-e', '/System/Library/ColorSync/Profiles/sRGB Profile.icc', playPath], { stdio: 'pipe' });
console.log('Exported iOS 1024px, Play 512px RGBA, and Android adaptive 1024px icons.');
