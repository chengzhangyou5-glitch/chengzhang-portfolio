import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { preserveGeneratedFormat } from './preserve-generated-format.mjs';
import React from 'react';
import { ProjectDetailHero } from './project-detail-hero.mjs';
import { ProjectNavigation, ProjectPdfReader, ProjectReadingReturn, ProjectDocumentHeading } from './project-detail-component.mjs';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { buildProjectContact } from './build-project-contact.mjs';
import { projectDetails } from './project-detail-content.mjs';
import { renderToStaticMarkup } from 'react-dom/server';
import { canvasflowDetail as project } from './canvasflow-detail-content.mjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export async function buildCanvasflowDetail() {
await buildProjectContact();
await build({ entryPoints: [fileURLToPath(new URL('project-reading-navigation.js', import.meta.url))], bundle: true, outfile: fileURLToPath(new URL('../portfolio-project-reading-navigation.js', import.meta.url)), format: 'iife', target: 'es2022' });

const root = new URL('../', import.meta.url);
const h = React.createElement;
const projectIndex = projectDetails.findIndex(detail => detail.id === project.id);
if (projectIndex < 0) throw new Error('CanvasFlow project navigation entry not found; no output written.');
const next = projectDetails[(projectIndex + 1) % projectDetails.length];
const previous = projectDetails[(projectIndex + projectDetails.length - 1) % projectDetails.length];
const pdfManifest = JSON.parse(await readFile(new URL(project.reading.manifest, root), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
if (pdfManifest.kind !== 'continuous-webp' || !pdfManifest.staticResources?.complete || pdfManifest.sha256 !== project.reading.sourceHash || sha(await readFile(new URL(project.pdf.slice(1), root))) !== pdfManifest.sha256) throw new Error('CanvasFlow PDF source/version mismatch.');
let segmentEnd = 0;
for (const segment of pdfManifest.segments) {
  if (segment.top !== segmentEnd || segment.width !== 3200 || segment.height <= 0 || segment.imageHeight > 4096 || segment.imageTop > segment.top || segment.imageTop + segment.imageHeight < segment.top + segment.height) throw new Error('CanvasFlow PDF segment gap or invalid dimensions.');
  segmentEnd += segment.height;
}
if (segmentEnd !== pdfManifest.totalHeight) throw new Error('Incomplete CanvasFlow PDF.');
const resourceRoot = new URL('./', new URL(project.reading.manifest, root));
for (const record of JSON.parse(await readFile(new URL('resources.json', resourceRoot), 'utf8'))) {
  const resource = new URL(record.path, resourceRoot);
  if (!resource.href.startsWith(resourceRoot.href)) throw new Error('PDF resource outside version directory.');
  const bytes = await readFile(resource);
  if (bytes.length !== record.bytes || sha(bytes) !== record.sha256) throw new Error('CanvasFlow PDF resource mismatch: ' + record.path);
}
const icon = name => h('svg', { className: name === 'arrow-left' ? 'canvasflow-arrow-left' : '', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('use', { href: '/assets/icons/experience-tabler.svg#chevron-down' }));

// This markup follows the user's latest four-block sketch, not the old dossier.
const content = renderToStaticMarkup(h('div', { className: 'canvasflow-detail' },
  h('header', { className: 'canvasflow-header' },
    h('a', { href: '/', lang: 'en' }, 'CHENGZHANG YOU'),
    h('a', { href: '/#featured-projects', 'data-canvasflow-return': true }, icon('arrow-left'), '返回精选项目')),
  h('main', { className: 'canvasflow-main' },
    h(ProjectReadingReturn, { canvasflow: true }),
    h(ProjectDetailHero, { project, readingAnchor: '#canvasflow-document' }),
    h('section', { id: 'canvasflow-document', className: 'canvasflow-document project-document', 'aria-labelledby': 'canvasflow-document-heading' },
      h(ProjectDocumentHeading, { headingId: 'canvasflow-document-heading', canvasflow: true }),
      h(ProjectPdfReader, { project, previous, next, pdfManifest })),
    h(ProjectNavigation, { next, canvasflow: true })
  )
)).replace(/<link rel="preload"[^>]+>/g, '');

let html = await readFile(new URL('index.html', root), 'utf8');
let scene = await readFile(new URL('_next/static/chunks/7758f29a8aeb1c60.js', root), 'utf8');
const start = scene.indexOf('function fb(){');
const end = scene.indexOf('e.s(["default",()=>fb],31713)', start);
if (start < 0 || end < 0) throw new Error('Homepage renderer entry not found; no output written.');

// Retain the EXACT homepage scene, shaders, pixel decorations, theme providers,
// grid rasterisation and scroll environment. Only the page component is replaced
// in this private derived chunk; the shared homepage file is never written.
const routeRuntime = (await readFile(new URL('tools/canvasflow-route-runtime.js', root), 'utf8')).replace('PORTFOLIO_CANVASFLOW_CONTENT', JSON.stringify(content)).replace('PORTFOLIO_CANVASFLOW_TITLE', JSON.stringify(`${project.title}｜游承樟`));
scene = scene.slice(0, start) + routeRuntime + scene.slice(end);
// Keep the original trail on the detail header/document. Only the active
// side-navigation cursor replaces it; the shared home scene stays intact.
const pointerUpdate = /(class cP\s*\{[\s\S]*?updatePointer\([^)]*\)\s*\{)/;
if (!pointerUpdate.test(scene)) throw new Error('Detail pointer overlay boundary missing.');
scene = scene.replace(pointerUpdate, '$1\nthis.uniforms.uPointerOpacity.value = document.documentElement.hasAttribute("data-project-pdf-cursor") ? 0 : 1;\n');
// These are mounted only by the detail scene; do not request or compile the
// three homepage models and portrait when their modules are not on this page.
if (!scene.includes('function PortfolioDeferredModel(props) {') || !scene.includes('function PortfolioDeferredImage(props) {')) throw new Error('Deferred scene boundaries missing; no output written.');
scene = scene.replace('function PortfolioDeferredModel(props) {', 'function PortfolioDeferredModel(props) { if (window.__portfolioEntryPath === "/projects/canvasflow-art-preview/") return null;')
  .replace('function PortfolioDeferredImage(props) {', 'function PortfolioDeferredImage(props) { if (window.__portfolioEntryPath === "/projects/canvasflow-art-preview/") return null;');
// These exact homepage asset names were relative to '/'. This detail route is
// nested, so normalise their addresses without changing scene behaviour.
scene = scene.replaceAll('"model/', '"/model/').replaceAll('"fonts/', '"/fonts/').replaceAll('"sticker_img/', '"/sticker_img/');
// The private minimal page fixes this same background state in its layout effect.
// The document's foreground does not use the homepage's refractive image pass.
// Keep its pixel atmosphere subtle; display the SAME live SVG grid separately
// within the background layer so its original strokes retain their contrast.
scene = scene.replaceAll('material.uniforms.uPortfolioGridReady.value = 1;', 'material.uniforms.uPortfolioGridReady.value = 0;');

// fb initially returns null while the captured shell hydrates. Its SSR slot must
// also be empty; retaining the homepage HTML would cause recovery and flashing.
const scrollClass = 'class="w-full h-full overflow-y-auto overscroll-contain no-scrollbar"';
const scrollStart = html.indexOf('<div ' + scrollClass);
if (scrollStart < 0) throw new Error('Captured scroll wrapper not found.');
const bodyStart = html.indexOf('>', scrollStart) + 1;
const divs = /<div\b[^>]*>|<\/div>/g;
divs.lastIndex = bodyStart;
let depth = 1, close = -1, tag;
while ((tag = divs.exec(html))) { depth += tag[0].startsWith('</') ? -1 : 1; if (!depth) { close = tag.index; break; } }
if (close < 0) throw new Error('Captured scroll wrapper is incomplete.');
const slot = html.slice(bodyStart, close);
if (!slot.startsWith('<div>') || !slot.endsWith('<!--$--><!--/$--></div>')) throw new Error('Captured Lenis/metadata structure changed; no output written.');
// ReactLenis owns this inner content div independently of fb.
html = html.slice(0, bodyStart) + '<div><!--$--><!--/$--></div>' + html.slice(close);
// The CanvasFlow route no longer owns a second GPU entry mask/loading bar.
for (const marker of ['class="z-30 fixed inset-0', 'class="left-1/2 top-1/2 z-40']) {
  const position = html.indexOf(marker);
  if (position < 0) continue;
  const from = html.lastIndexOf('<div', position), firstEnd = html.indexOf('>', from) + 1;
  divs.lastIndex = firstEnd; let level = 1, to = -1;
  while ((tag = divs.exec(html))) { level += tag[0].startsWith('</') ? -1 : 1; if (!level) { to = divs.lastIndex; break; } }
  if (to < 0) throw new Error('Entry mask SSR boundary is incomplete.');
  html = html.slice(0, from) + html.slice(to);
}
html = html.replaceAll('7758f29a8aeb1c60.js', 'canvasflow-detail-scene.js')
  .replaceAll('STUDIO©2026', `${project.title}｜游承樟`)
  .replaceAll('游承樟｜设计作品集', `${project.title}｜游承樟`);
// The original captured shell was server-rendered for '/'. Let it hydrate that
// same internal route, then restore this detail URL with the saved native method
// (without causing a Next navigation to a route its captured server never had).
const routeAdapter = `<script>(()=>{const url=location.href;window.__portfolioEntryPath=new URL(url).pathname;const restore=history.replaceState.bind(history);window.__canvasflowRestoreRoute=()=>{restore(history.state,'',url);delete window.__canvasflowRestoreRoute;};restore(history.state,'','/'+location.search);})();</script>`;
html = html.replace('<head>', '<head><link rel="stylesheet" href="/portfolio-project-reading-navigation.css"><script src="/portfolio-project-reading-navigation.js" defer></script>');
html = html.replace('<head>', '<head><link rel="stylesheet" href="/portfolio-project-document.css">');
html = html.replace('<head>', '<head><link rel="stylesheet" href="/portfolio-canvasflow.css"><link rel="stylesheet" href="/portfolio-project-hero.css"><link rel="stylesheet" href="/portfolio-project-navigation.css"><link rel="stylesheet" href="/portfolio-project-pdf.css"><link rel="stylesheet" href="/portfolio-contact.css"><link rel="stylesheet" href="/portfolio-project-contact.css"><script src="/portfolio-project-contact-entry.js" defer></script><script src="/portfolio-project-pdf.js" defer></script>' + routeAdapter);

await mkdir(new URL('projects/canvasflow-art-preview/', root), { recursive: true });
const sceneOutput = new URL('_next/static/chunks/canvasflow-detail-scene.js', root);
const previousScene = await readFile(sceneOutput, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
await writeFile(sceneOutput, preserveGeneratedFormat(previousScene, scene));
await writeFile(new URL('projects/canvasflow-art-preview/index.html', root), html);
console.log('Built CanvasFlow detail only; homepage and the other three detail pages remain untouched.');

}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildCanvasflowDetail();
