import { readFile, writeFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Rebuild route/cover clients first, then apply the shared transition entry.
// This one command produces the complete feature without relying on build order.
await import('./build-selected-works.mjs');

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
async function write(path, value) { if (await read(path) !== value) await writeFile(new URL(path, root), value); }
function replace(source, before, after) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) throw new Error('Project entry anchor missing or ambiguous: ' + before.slice(0, 120));
  return source.replace(before, after);
}
// The return-only probe shares the existing scene/camera. Rebuild CanvasFlow's
// private derived chunk afterward so it retains its own minimal route runtime.
const homeScenePath = '_next/static/chunks/7758f29a8aeb1c60.js';
let homeScene = await read(homeScenePath);
const probeStart = '/* PORTFOLIO_RETURN_PAINT_START */', probeEnd = '/* PORTFOLIO_RETURN_PAINT_END */';
const probeBlock = probeStart + '\n' + await read('tools/return-paint-runtime.js') + '\n' + probeEnd + '\n';
if (homeScene.includes(probeStart)) {
  const first = homeScene.indexOf(probeStart), last = homeScene.indexOf(probeEnd, first);
  if (last < 0) throw new Error('Incomplete return paint probe');
  homeScene = homeScene.slice(0, first) + probeBlock + homeScene.slice(last + probeEnd.length).replace(/^\n/, '');
} else homeScene = homeScene.replace('let cV=', probeBlock + 'let cV=');
homeScene = replace(homeScene, '(0,s.jsx)(PortfolioSceneReadyFrame,{ready:p,onReady:portfolioFrameReady}),', '(0,s.jsx)(PortfolioSceneReadyFrame,{ready:p,onReady:portfolioFrameReady}),(0,s.jsx)(PortfolioReturnPaintReadyFrame,{}),');
await transform(homeScene, { loader: 'js', sourcefile: homeScenePath });
await write(homeScenePath, homeScene);
await (await import('./build-canvasflow-detail.mjs')).buildCanvasflowDetail();
await build({ entryPoints: [fileURLToPath(new URL('tools/project-entry-runtime.js', root))], outfile: fileURLToPath(new URL('portfolio-project-entry.js', root)), bundle: true, format: 'iife', target: 'es2022' });
const head = '<link rel="stylesheet" href="/portfolio-project-entry.css"><script src="/portfolio-project-entry.js"></script>';
for (const path of ['index.html', ...['canvasflow-art-preview','aigc-design-efficiency','fliggy-lele-run','lexin-health-app'].map(id => 'projects/' + id + '/index.html')]) {
  let html = await read(path);
  html = html.replaceAll(head, '').replace('<head>', '<head>' + head);
  await write(path, html);
}
const cssPath = '_next/static/chunks/635eb04122aa774f.css';
let css = await read(cssPath);
if (!css.includes('@import url("/portfolio-project-entry.css");')) css = '@import url("/portfolio-project-entry.css");\n' + css;
await write(cssPath, css);

const transitionPath = '_next/static/chunks/e553ef8ae208a000.js';
let transition = await read(transitionPath);
const marker = '/* PORTFOLIO_PROJECT_MASK_PLACEHOLDER */';
if (!transition.includes(marker)) transition = transition.replace('function T(){', marker + '\n' + await read('tools/project-mask-placeholder.js') + '\nfunction T(){');
transition = replace(transition, 'function T(){let e=', 'function T(){if(typeof window!=="undefined"&&window.__portfolioEntryPath==="/projects/canvasflow-art-preview/")return null;let e=');
// Maintain the SSR entry shape using plain DOM when the transferred glass owns
// the transition. The original GPU mask remains for ordinary first home entry.
transition = replace(transition, 'q&&(0,t.jsx)(s,{children:', 'q&&(typeof window!=="undefined"&&window.__portfolioProjectEntry?.incoming&&"entry"===T.mode?(0,t.jsx)(PortfolioProjectMaskPlaceholder,{}):(0,t.jsx)(s,{children:');
transition = replace(transition, 'pixelSize:16})]})}),O&&', 'pixelSize:16})]})})),O&&');
const incomingEffect = `(0,r.useEffect)(()=>{if(window.__portfolioProjectEntry?.incoming&&"entry"===T.mode&&"reveal"===T.phase){L({type:"transition",transition:{mode:"idle"}});L({type:"canvas/set",value:!1});c();f(!0);requestAnimationFrame(()=>dispatchEvent(new Event("portfolio:page-ready")));}},[T,c,f]);`;
// On a covered return, prepare existing header text concurrently with the
// background. It must not start its initial entrance after the cover fades.
const returnPreparationEffect = `(0,r.useEffect)(()=>{if(window.__portfolioReturnPresentation&&v&&"entry"===T.mode&&"wait"===T.phase)f(!0);},[T.mode,T.phase,v,f]);`;
if (!transition.includes(incomingEffect)) transition = transition.replace('let N="idle"===T.mode?', incomingEffect + 'let N="idle"===T.mode?');
if (!transition.includes(returnPreparationEffect)) transition = transition.replace(incomingEffect, returnPreparationEffect + incomingEffect);
await transform(transition, { loader: 'js', sourcefile: transitionPath });
await write(transitionPath, transition);
// Every captured/derived script must parse before the preview is tested.
for (const path of ['_next/static/chunks/7758f29a8aeb1c60.js','_next/static/chunks/canvasflow-detail-scene.js']) await transform(await read(path), { loader: 'js', sourcefile: path });
console.log('Built click-origin glass transitions; native project links and history retained.');
