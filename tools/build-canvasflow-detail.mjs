import { readFile, writeFile, mkdir } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { canvasflowDetail as project } from './canvasflow-detail-content.mjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export async function buildCanvasflowDetail() {

const root = new URL('../', import.meta.url);
const h = React.createElement;
const icon = name => h('svg', { className: name === 'arrow-left' ? 'canvasflow-arrow-left' : '', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('use', { href: '/assets/icons/experience-tabler.svg#chevron-down' }));

// This markup follows the user's latest four-block sketch, not the old dossier.
const content = renderToStaticMarkup(h('div', { className: 'canvasflow-detail' },
  h('header', { className: 'canvasflow-header' },
    h('a', { href: '/', lang: 'en' }, 'CHENGZHANG YOU'),
    h('a', { href: '/#featured-projects', 'data-canvasflow-return': true }, icon('arrow-left'), '返回精选项目')),
  h('main', { className: 'canvasflow-main' },
    h('section', { className: 'canvasflow-intro', 'aria-labelledby': 'canvasflow-title' },
      h('div', { className: 'canvasflow-identity' },
        h('h1', { id: 'canvasflow-title', lang: 'en' }, project.title),
        h('div', { className: 'canvasflow-profile' }, h('dl', { className: 'canvasflow-meta' },
          h('div', null, h('dt', null, '担任角色'), h('dd', null, project.role)),
          h('div', null, h('dt', null, '项目定位'), h('dd', null, project.positioning))),
        h('ul', { className: 'canvasflow-tags', 'aria-label': '项目能力' }, project.tags.map(tag => h('li', { key: tag }, tag))))),
      h('figure', { className: 'canvasflow-cover' }, h('img', { src: project.cover.src, width: project.cover.width, height: project.cover.height, alt: 'CanvasFlow AI 原型预览', decoding: 'async', fetchPriority: 'high' }))),
    h('div', { className: 'canvasflow-notes' }, project.sections.map(section =>
      h('section', { className: 'canvasflow-note', key: section.title }, h('h2', null, section.title), h('p', null, section.text)))),
    h('a', { className: 'canvasflow-scroll-cue', href: '/projects/canvasflow-art-preview/#canvasflow-document' }, icon('arrow-down'), h('span', null, '向下浏览完整项目')),
    h('section', { id: 'canvasflow-document', className: 'canvasflow-document', 'aria-labelledby': 'canvasflow-document-heading' },
      h('h2', { id: 'canvasflow-document-heading' }, '完整项目'),
      h('div', { className: 'canvasflow-document-pages' }, [1, 2, 3].map(page => h('article', { className: 'canvasflow-document-placeholder', key: page, 'aria-label': `项目内容待接入，第 ${page} 页` }, h('p', null, '项目内容待接入'), h('span', { lang: 'en' }, String(page).padStart(2, '0'))))))
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
const detailMount = `(0,u.useEffect)(()=>{
    window.__canvasflowRestoreRoute?.();
    document.title='CanvasFlow AI — 游承樟';
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';stylesheet.href='/portfolio-canvasflow.css';
    document.head.appendChild(stylesheet);
    const container=document.querySelector('.overflow-y-auto');
    const shell=container?.firstElementChild;
    if(!container||!shell)return;
    const banner=shell.querySelector('[class*="grid-rows-[auto_1fr]"]');
    shell.classList.add('canvasflow-background-shell');
    banner?.classList.add('canvasflow-background-banner');
    const showGrid=()=>{const grid=shell.querySelector('.portfolio-background-grid');if(grid?.hasAttribute('hidden'))grid.removeAttribute('hidden');};
    const gridObserver=new MutationObserver(showGrid);
    gridObserver.observe(shell,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    showGrid();
    const host=document.createElement('div');
    host.innerHTML=${JSON.stringify(content)};
    container.appendChild(host);
    const links=host.querySelectorAll('[data-canvasflow-return]');
    const remember=()=>{try{sessionStorage.setItem('hq:pendingScrollAnchor','#featured-projects');sessionStorage.setItem('portfolio:works-return','${project.id}');}catch{}};
    links.forEach(link=>{try{const origin=sessionStorage.getItem('portfolio:works-origin')||'';link.href='/' +(origin.startsWith('?')?origin:'')+'#featured-projects';}catch{}link.addEventListener('click',remember);});
    return()=>{links.forEach(link=>link.removeEventListener('click',remember));gridObserver.disconnect();host.remove();stylesheet.remove();shell.classList.remove('canvasflow-background-shell');banner?.classList.remove('canvasflow-background-banner');};
  },[]);`;
// Preserve the entire original component tree during hydration. Attach the
// route's foreground to the existing scroll container after mount; the same
// homepage scene remains alive behind it, with no second renderer or iframe.
scene = scene.slice(0, start) + scene.slice(start, end).replace('function fb(){', `function fb(){${detailMount}`) + scene.slice(end);
// These exact homepage asset names were relative to '/'. This detail route is
// nested, so normalise their addresses without changing scene behaviour.
scene = scene.replaceAll('"model/', '"/model/').replaceAll('"fonts/', '"/fonts/').replaceAll('"sticker_img/', '"/sticker_img/');
if (!scene.includes('sI,e)&&(sI=e)')) throw new Error('Background content-state assignment not found.');
scene = scene.replace('sI,e)&&(sI=e)', 'sI,1)&&(sI=1)');
// The document's foreground does not use the homepage's refractive image pass.
// Keep its pixel atmosphere subtle; display the SAME live SVG grid separately
// within the background layer so its original strokes retain their contrast.
scene = scene.replaceAll('material.uniforms.uPortfolioGridReady.value = 1;', 'material.uniforms.uPortfolioGridReady.value = 0;');

html = html.replaceAll('7758f29a8aeb1c60.js', 'canvasflow-detail-scene.js')
  .replaceAll('STUDIO©2026', 'CanvasFlow AI — 游承樟');
// The original captured shell was server-rendered for '/'. Let it hydrate that
// same internal route, then restore this detail URL with the saved native method
// (without causing a Next navigation to a route its captured server never had).
const routeAdapter = `<script>(()=>{const url=location.href;const restore=history.replaceState.bind(history);window.__canvasflowRestoreRoute=()=>{restore(history.state,'',url);delete window.__canvasflowRestoreRoute;};restore(history.state,'','/'+location.search);})();</script>`;
html = html.replace('<head>', '<head>' + routeAdapter);

await mkdir(new URL('projects/canvasflow-art-preview/', root), { recursive: true });
await writeFile(new URL('_next/static/chunks/canvasflow-detail-scene.js', root), scene);
await writeFile(new URL('projects/canvasflow-art-preview/index.html', root), html);
console.log('Built CanvasFlow detail only; homepage and the other three detail pages remain untouched.');

}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildCanvasflowDetail();
