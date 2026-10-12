import { readFile, writeFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url), read = p => readFile(new URL(p, root), 'utf8');
const write = async (p, value) => { if (await read(p).catch(() => '') !== value) await writeFile(new URL(p, root), value); };
function replace(source, before, after) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) throw new Error('Residue anchor missing/ambiguous: ' + before.slice(0, 120));
  return source.replace(before, after);
}
const scenePath = '_next/static/chunks/7758f29a8aeb1c60.js'; let scene = await read(scenePath);
const begin = '/* PORTFOLIO_STICKER_RESIDUE_START */', end = '/* PORTFOLIO_STICKER_RESIDUE_END */';
const block = begin + '\n' + await read('tools/sticker-residue-scene.js') + '\n' + end + '\n';
if (scene.includes(begin)) { const start = scene.indexOf(begin), stop = scene.indexOf(end, start); scene = scene.slice(0, start) + block + scene.slice(stop + end.length).replace(/^\n/, ''); }
else scene = replace(scene, 'let sI=0,', block + 'let sI=0,');
scene = replace(scene, 'F?.dispose()},[F]),(0,u.useEffect)(()=>{if(!T||m.current)return;', 'F?.dispose()},[F]),usePortfolioStickerCheckpoint({meshRef:a,geometry:D,atlas:T,particlesRef:p,timeRef:g,emitRef:v,camera:l,images:e,material:F}),(0,u.useEffect)(()=>{if(!T||m.current)return;if(portfolioRestoreStickerMesh({mesh:a.current,geometry:D,particlesRef:p,timeRef:g,emitRef:v,initializedRef:m}))return;');
scene = replace(scene, 'w.current=0,m.outputMaterial.uniforms.tInput.value=g.current.read.texture', 'w.current=0,portfolioRestoreResidueBackground(t,g.current.read),m.outputMaterial.uniforms.tInput.value=g.current.read.texture');
scene = replace(scene, 'usePortfolioBackgroundGrid(m.outputMaterial,t);', 'usePortfolioBackgroundGrid(m.outputMaterial,t);usePortfolioResidueBackground(t,g,m.outputMaterial);');
scene = replace(scene, 'usePortfolioBackgroundGrid(o,portfolioOverlayRenderer);', 'usePortfolioBackgroundGrid(o,portfolioOverlayRenderer);usePortfolioResidueMask(o);');
// Existing return readiness retains all camera/scroll/grid checks; also wait for
// real sticker atlas + matrices, rather than revealing an empty background.
scene = replace(scene, 'resolvedTheme === theme &&', 'resolvedTheme === theme && (window.__portfolioStickerResidue?.sceneReady() ?? true) &&');
const formatted = (await transform(scene, { loader: 'js', sourcefile: scenePath })).code; await write(scenePath, scene);
// Reuse the original cursor class, color, shader and camera tuning directly.
// This deliberately fails if their source boundaries change instead of silently
// inventing a different trail or animation for the three document readers.
const pointerStart = formatted.indexOf('class cP {'), pointerEnd = formatted.indexOf('function cI(', pointerStart);
const shaderStart = formatted.indexOf('uniform vec2 uTrail[16];'), shaderEnd = formatted.indexOf('varying vec2 vUv;', shaderStart);
const color = formatted.match(/let cF = ("#[a-fA-F0-9]+");/)?.[1];
if (pointerStart < 0 || pointerEnd < 0 || shaderStart < 0 || shaderEnd < 0 || !color) throw new Error('Original cursor boundaries missing');
const settings = {};
for (const key of ['parallaxEnabled', 'parallaxStrength', 'parallaxLag', 'parallaxRotate', 'leaveParallaxLag']) {
  const value = formatted.match(new RegExp(key + ':\\s*\\{\\s*value:\\s*(true|false|[0-9.]+)'))?.[1];
  if (!value) throw new Error('Original camera parameter missing: ' + key);
  settings[key] = JSON.parse(value);
}
const pointerFragment = 'uniform sampler2D tDiffuse;\n' + formatted.slice(shaderStart, shaderEnd) + 'varying vec2 vUv;\nvoid main(){gl_FragColor=applyPointerOverlay(vUv,texture2D(tDiffuse,vUv));\n#include <colorspace_fragment>\n}';
await write('tools/sticker-residue-motion.generated.js', '/* Generated from the original live scene; do not edit. */\nimport { ResidueVector2, ResidueColor, residueMath } from "./sticker-residue-math.js";\nconst sy={Vector2:ResidueVector2,Color:ResidueColor,MathUtils:residueMath};\nconst cF=' + color + ';\n' + formatted.slice(pointerStart, pointerEnd) + '\nexport {cP as ResiduePointerOverlay};\nexport const pointerFragment=' + JSON.stringify(pointerFragment) + ';\nexport const parallaxSettings=' + JSON.stringify(settings) + ';\n');
await build({ entryPoints: [fileURLToPath(new URL('tools/sticker-residue-detail.js', root))], outfile: fileURLToPath(new URL('portfolio-sticker-residue.js', root)), bundle: true, format: 'iife', target: 'es2022' });
await build({ entryPoints: [fileURLToPath(new URL('tools/project-entry-runtime.js', root))], outfile: fileURLToPath(new URL('portfolio-project-entry.js', root)), bundle: true, format: 'iife', target: 'es2022' });
const head = '<script src="/portfolio-sticker-residue.js"></script>';
for (const p of ['index.html', ...['aigc-design-efficiency','fliggy-lele-run','lexin-health-app'].map(id => 'projects/' + id + '/index.html')]) { const html = await read(p); await write(p, html.replaceAll(head, '').replace('<head>', '<head>' + head)); }
await build({ entryPoints: [fileURLToPath(new URL('tools/project-detail-client.js', root))], outfile: fileURLToPath(new URL('portfolio-projects.js', root)), bundle: true, format: 'iife', target: 'es2022' });
await (await import('./build-canvasflow-detail.mjs')).buildCanvasflowDetail();
console.log('Built real sticker/GPU residue checkpoints and four-route replay.');
