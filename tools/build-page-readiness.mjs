import { readFile, writeFile, rename } from 'node:fs/promises';
import { transform } from 'esbuild';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
async function writeChanged(path, source) {
  const existing = await read(path);
  // Existing captured chunks contain occasional trailing spaces. Only clean
  // changed lines so the patch does not reformat unrelated vendor code.
  const oldLines = new Set(existing.split('\n'));
  source = source.split('\n').map(line => oldLines.has(line) ? line : line.replace(/[\t ]+\r?$/, '')).join('\n');
  // Also remove inherited whitespace on the giant minified line whose media
  // readiness expression was changed during the initial build.
  if (path.endsWith('1ed7a178f7acd3df.js')) source = source.replace(/([\t ]+)\n/g, '\n');
  if (source === existing) return;
  const output = new URL(path, root), temporary = new URL(path + '.readiness-tmp', root);
  await writeFile(temporary, source);
  await rename(temporary, output);
}
function patch(source, before, after) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) throw new Error('Readiness patch anchor missing or ambiguous: ' + before.slice(0, 100));
  return source.replace(before, after);
}
function inject(source, name, runtime, anchor) {
  const start = `/* ${name}_START */`, end = `/* ${name}_END */`;
  const block = `${start}\n${runtime}\n${end}\n`;
  if (source.includes(start)) {
    const first = source.indexOf(start), last = source.indexOf(end, first);
    if (last < 0) throw new Error('Incomplete runtime marker');
    return source.slice(0, first) + block + source.slice(last + end.length).replace(/^\n/, '');
  }
  if (!source.includes(anchor)) throw new Error('Runtime insertion anchor missing');
  return source.replace(anchor, block + anchor);
}

const mediaPath = '_next/static/chunks/1ed7a178f7acd3df.js';
let media = await read(mediaPath);
media = patch(media, 'f=n&&o,m=(0,i.useCallback)', 'f=n,m=(0,i.useCallback)');
media = patch(media, 'if(!d||!f)return;let t=c.current;', 'if(!d||!f||!o)return;let t=c.current;');
media = patch(media, '[d,f,l]),(0,e.jsx)(r.Provider', '[d,f,l,o]),(0,e.jsx)(r.Provider');

const transitionPath = '_next/static/chunks/e553ef8ae208a000.js';
let transition = await read(transitionPath);
transition = inject(transition, 'PORTFOLIO_PAGE_READINESS', await read('tools/page-readiness-runtime.js'), 'function T(){');
transition = patch(transition, 'let y=100/3,x=', 'let y=50,x=');
transition = patch(transition, 'fontsLoaded:v,fontsAssetReady:g,bgmAssetReady:x', 'fontsLoaded:v,fontsAssetReady:g');
transition = patch(transition,
  'U=E(h,0,100),k=(0,r.useMemo)(()=>P.entryLoading.enabled?E((g?y:0)+(x?y:0)+U/100*y,0,100):U,[x,P.entryLoading.enabled,g,U]),O="entry"===T.mode&&P.entryLoading.enabled',
  'U=E(h,0,100),portfolioEntry=usePortfolioPageReadiness(d,"idle"===T.mode),k=(0,r.useMemo)(()=>P.entryLoading.enabled?E((g?y:0)+U/100*y,0,100):U,[P.entryLoading.enabled,g,U]),O="entry"===T.mode&&!portfolioEntry.fast&&P.entryLoading.enabled');
transition = patch(transition, '(!P.entryLoading.enabled||d&&v)', '(!P.entryLoading.enabled||d&&v&&portfolioEntry.ready)');
transition = patch(transition, '[T,d,v,P])', '[T,d,v,P,portfolioEntry.ready])');
transition = patch(transition, '(!z.routeLoading.enabled||d&&v)', '(!z.routeLoading.enabled||d&&v&&portfolioEntry.ready)');
transition = patch(transition, '[T,d,v,i,z])', '[T,d,v,i,z,portfolioEntry.ready])');
transition = patch(transition, 'open:N,duration:.8,initialProgress:V', 'open:N,duration:portfolioEntry.fast?.32:.8,initialProgress:V');

function patchScene(scene, runtime) {
scene = inject(scene, 'PORTFOLIO_SCENE_READINESS', runtime, 'let cV=');
const begin = scene.indexOf('let cV='), end = scene.indexOf('},cW=', begin);
if (begin < 0 || end < 0) throw new Error('Scene readiness component boundaries not found');
let component = scene.slice(begin, end);
component = patch(component, 'c=c$.every(e=>r[e])', 'portfolioEntry=(0,u.useRef)(portfolioSceneEntry()).current,portfolioModels=portfolioCriticalModels(portfolioEntry),c=portfolioModels.every(e=>r[e])');
component = patch(component, 'h=0===t.layers.length||t.layers.every(e=>o.signature===f&&o.map[e.key])', 'portfolioLayers=portfolioCriticalLayers(portfolioEntry,t.layers),h=portfolioLayers.every(e=>o.signature===f&&o.map[e.key])');
component = patch(component, 'w=c$.length+E.length,M=c$.reduce((e,t)=>r[t]?e+1:e,0),R=E.reduce', 'w=portfolioModels.length+portfolioLayers.length,M=portfolioModels.reduce((e,t)=>r[t]?e+1:e,0),R=portfolioLayers.reduce');
component = patch(component, ',(0,u.useEffect)(()=>{p&&(A(100),v(!0))},[p,v,A]);', ';let portfolioFrameReady=(0,u.useCallback)(()=>{A(100),v(!0)},[v,A]);');
component = patch(component, 'children:[(0,s.jsx)(cH,{}),', 'children:[(0,s.jsx)(cH,{}),(0,s.jsx)(PortfolioSceneReadyFrame,{ready:p,onReady:portfolioFrameReady}),');
component = component.replaceAll('(0,s.jsx)(cp,', '(0,s.jsx)(PortfolioDeferredModel,').replaceAll('(0,s.jsx)(cw,', '(0,s.jsx)(PortfolioDeferredImage,');
scene = scene.slice(0, begin) + component + scene.slice(end);
return scene;
}
const runtime = await read('tools/performance-scene-resources.js') + '\n' + await read('tools/scene-readiness-runtime.js');
const scenePath = '_next/static/chunks/7758f29a8aeb1c60.js';
const detailScenePath = '_next/static/chunks/canvasflow-detail-scene.js';
const scene = patchScene(await read(scenePath), runtime);
// Patch the existing derived artifact too. Regenerating it wholesale could
// incidentally import unrelated homepage changes made by another workstream.
const detailScene = patchScene(await read(detailScenePath), runtime);
const detailHtmlPath = 'projects/canvasflow-art-preview/index.html';
const detailHtml = patch(await read(detailHtmlPath),
  'const url=location.href;const restore=history.replaceState.bind(history);',
  'const url=location.href;window.__portfolioEntryPath=new URL(url).pathname;const restore=history.replaceState.bind(history);');
const outputs = [[mediaPath, media], [transitionPath, transition], [scenePath, scene], [detailScenePath, detailScene]];

// Validate every prospective chunk before writing any runtime output.
for (const [name, source] of outputs)
  await transform(source, { loader: 'js', sourcefile: name });
for (const [name, source] of outputs)
  await writeChanged(name, source);
await writeChanged(detailHtmlPath, detailHtml);
console.log('Built critical-resource readiness; routing, styles and asset initialization retained.');
