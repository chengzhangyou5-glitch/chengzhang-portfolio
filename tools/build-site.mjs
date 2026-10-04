import { readdir, mkdir, rm, cp, stat, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
if (!output.startsWith(resolve(root) + sep)) throw new Error('Invalid build output path.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const directories = new Set(['_next', 'assets', 'fonts', 'img', 'model', 'sticker_img', 'work', 'projects', 'portfolio']);
let entries = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  const allowed = entry.isDirectory() ? directories.has(entry.name) : /\.(?:html|css|js|svg|png|mp3|ico)$/.test(entry.name);
  if (!allowed) continue;
  await cp(resolve(root, entry.name), resolve(output, entry.name), { recursive: true });
  entries++;
}
for (const file of ['index.html', 'portfolio/index.html', 'projects/canvasflow-art-preview/index.html', '_next/static/chunks/canvasflow-detail-scene.js']) await stat(resolve(output, file));
// The annotation bundle is a local development tool. Remove its loader from
// published HTML rather than requesting an intentionally excluded file.
async function cleanDevelopmentLoaders(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) await cleanDevelopmentLoaders(file);
    else if (entry.name.endsWith('.html')) {
      const source = await readFile(file, 'utf8');
      const cleaned = source.replace(/<script\b[^>]*\bsrc=["'][^"']*dev-tools\/feedback\.js[^"']*["'][^>]*>\s*<\/script>/g, '').replaceAll('STUDIO©2026', '游承樟 — 个人作品集');
      if (cleaned !== source) await writeFile(file, cleaned);
    }
  }
}
await cleanDevelopmentLoaders(output);
console.log(`Built reviewed static snapshot: ${entries} entries copied into dist; tools, backups, dependencies and local feedback excluded.`);
