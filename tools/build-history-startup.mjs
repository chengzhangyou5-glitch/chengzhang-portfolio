import { readFile, writeFile } from 'node:fs/promises';
import { transform } from 'esbuild';

// Rebuild from the latest sources, including the recently added GPU residue
// checkpoint. Never replace its shaders, particle motion or stored field.
await import('./build-page-readiness.mjs');
await import('./build-project-entry.mjs');
const root = new URL('../', import.meta.url), file = new URL('_next/static/chunks/7758f29a8aeb1c60.js', root);
let scene = await readFile(file, 'utf8');
const begin = '/* PORTFOLIO_STICKER_STARTUP_START */', end = '/* PORTFOLIO_STICKER_STARTUP_END */';
const block = begin + '\n' + await readFile(new URL('tools/sticker-start-runtime.js', root), 'utf8') + '\n' + end + '\n';
if (scene.includes(begin)) {
  const start = scene.indexOf(begin), stop = scene.indexOf(end, start);
  if (stop < 0) throw new Error('Incomplete sticker startup helper');
  scene = scene.slice(0, start) + block + scene.slice(stop + end.length).replace(/^\r?\n/, '');
} else {
  if (scene.split('let s8=').length !== 2) throw new Error('Sticker startup anchor missing/ambiguous');
  scene = scene.replace('let s8=', block + 'let s8=');
}
const original = 'for(let t of e)ut(t,w,"scroll");p.current=e', updated = 'for(let t of e)ut(t,w,"scroll");portfolioSeedInitialStickers(e,w,l);p.current=e';
if (!scene.includes(updated)) {
  if (scene.split(original).length !== 2) throw new Error('Initial particle loop missing/ambiguous');
  scene = scene.replace(original, updated);
}
await transform(scene, { loader: 'js', sourcefile: file.pathname });
if (await readFile(file, 'utf8') !== scene) await writeFile(file, scene);
await import('./build-sticker-residue.mjs');
console.log('Built immediate sticker startup and stable native-history return.');
