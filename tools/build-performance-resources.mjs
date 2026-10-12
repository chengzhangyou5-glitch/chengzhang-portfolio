import { readFile, writeFile } from 'node:fs/promises';
import { preserveGeneratedFormat } from './preserve-generated-format.mjs';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { transform } from 'esbuild';

const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
function block(text, name, source) {
  const start = `/* ${name}_START */`, end = `/* ${name}_END */`;
  const from = text.indexOf(start), to = text.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`Missing ${name} markers`);
  return text.slice(0, from) + `${start}\n${source}\n${end}` + text.slice(to + end.length);
}
function once(text, before, after) {
  if (text.includes(after)) return text;
  if (text.split(before).length !== 2) throw new Error(`Ambiguous performance anchor: ${before.slice(0, 70)}`);
  return text.replace(before, after);
}

const scenePath = '_next/static/chunks/7758f29a8aeb1c60.js';
let scene = await read(scenePath);
const originalScene = scene;
scene = block(scene, 'PORTFOLIO_SCENE_READINESS',
  await read('tools/performance-scene-resources.js') + '\n' + await read('tools/scene-readiness-runtime.js'));

// GLB only changes packaging. Every vertex, index, normal and material is identical.
const original = JSON.parse(await read('model/cnt.gltf'));
if (original.buffers.length !== 1 || !original.buffers[0].uri.startsWith('data:')) throw new Error('Unexpected Contact model packaging');
const binary = Buffer.from(original.buffers[0].uri.split(',')[1], 'base64');
if (binary.length !== original.buffers[0].byteLength || binary.length % 4) throw new Error('Contact buffer integrity check failed');
const packed = structuredClone(original); delete packed.buffers[0].uri;
const rawJson = Buffer.from(JSON.stringify(packed));
const json = Buffer.alloc(Math.ceil(rawJson.length / 4) * 4, 32); rawJson.copy(json);
const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + json.length + binary.length, 8); header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.writeUInt32LE(0x004e4942, 4);
const glb = Buffer.concat([header, json, binHeader, binary]);
if (!glb.subarray(28 + json.length).equals(binary)) throw new Error('GLB changed geometry');
scene = once(scene, 'model:"model/cnt.gltf"', 'model:"model/cnt.glb"');

const sharedPath = '_next/static/chunks/1ed7a178f7acd3df.js';
let shared = await read(sharedPath);
const originalShared = shared;
const audioSource = await read('tools/performance-audio-player.js');
if (shared.includes('/* PORTFOLIO_PERFORMANCE_AUDIO_START */')) shared = block(shared, 'PORTFOLIO_PERFORMANCE_AUDIO', audioSource);
else shared = once(shared, 'function a({children:t}){let[n,a]', `/* PORTFOLIO_PERFORMANCE_AUDIO_START */\n${audioSource}\n/* PORTFOLIO_PERFORMANCE_AUDIO_END */\nfunction a({children:t}){let[n,a]`);
shared = once(shared, 'f=n,m=(0,i.useCallback)', 'f=n,portfolioAudioEnabled=(0,i.useRef)(l),m=(0,i.useCallback)');
shared = once(shared, 't=>{u(t),localStorage.setItem(s,t?"on":"off")}', 't=>{portfolioAudioEnabled.current=t,u(t),localStorage.setItem(s,t?"on":"off"),window.dispatchEvent(new CustomEvent("portfolio:sound-intent"))}');
const audioFrom = shared.indexOf('(0,i.useEffect)(()=>{if(!d)return;h(!1);');
if (audioFrom >= 0) {
  const audioTo = shared.indexOf('},[d]);let y=', audioFrom);
  if (audioTo < 0) throw new Error('BGM initializer boundary missing');
  shared = shared.slice(0, audioFrom) + '(portfolioAudioEnabled.current=l,usePortfolioBgmPlayer(d,c,portfolioAudioEnabled,h))' + shared.slice(audioTo + '},[d])'.length);
} else if (!shared.includes('usePortfolioBgmPlayer(d,c,portfolioAudioEnabled,h)')) throw new Error('BGM scope missing');

const responsive = JSON.parse(await read('assets/works/optimized.json'));
const works = (await read('tools/selected-works-runtime.js')).replace('__PORTFOLIO_WORKS_RESPONSIVE__', JSON.stringify(responsive));
const rhythm = await read('tools/selected-works-rhythm.js');
const experience = await read('tools/work-experience-runtime.js');
shared = block(shared, 'PORTFOLIO_SELECTED_WORKS', `const worksScrollEnv=t.i(29680).scrollEnv;\nconst worksLoadingGate=t.i(97839);\nconst worksMediaEnv=t.i(23525);\n${rhythm}\n${works}\nfunction h(props){return e.jsx(PortfolioWorksSection,props);}`);
const component = new Function('e','i','worksScrollEnv','worksLoadingGate','worksMediaEnv', `${experience}\n${rhythm}\n${works}\nreturn PortfolioWorksSection;`)(jsxRuntime,React,{useContainerEl:()=>null},{useHomeLoadingGate:()=>false},{useShellMedia:()=>({soundEnabled:false})});
const experienceComponent = new Function('e','i',`${experience}\nreturn PortfolioWorkExperience;`)(jsxRuntime,React);
const experienceMarkup = renderToStaticMarkup(React.createElement(experienceComponent));
const markup = renderToStaticMarkup(React.createElement(component)).replace(experienceMarkup,`<!-- PORTFOLIO_EXPERIENCE_START -->${experienceMarkup}<!-- PORTFOLIO_EXPERIENCE_END -->`);
let html = await read('index.html');const from = html.indexOf('<section id="selected-work"');
const token=/<section\b[^>]*>|<\/section>/g;token.lastIndex=from;
let depth=0,to=-1,match;
while((match=token.exec(html))){depth+=match[0].startsWith('</')?-1:1;if(!depth){to=token.lastIndex;break;}}
if(from<0||to<0)throw new Error('Selected Works SSR boundary missing');
html = html.slice(0,from)+markup+html.slice(to);
// No PDF/detail builders are invoked; only scoped homepage output is regenerated.
for(const [name,source] of [[scenePath,scene],[sharedPath,shared]]) await transform(source,{loader:'js',sourcefile:name});
await writeFile(new URL('model/cnt.glb',root),glb);
await writeFile(new URL(scenePath,root),preserveGeneratedFormat(originalScene,scene));await writeFile(new URL(sharedPath,root),preserveGeneratedFormat(originalShared,shared));await writeFile(new URL('index.html',root),html);
console.log(JSON.stringify({contactGLBBytes:glb.length,geometryBytes:binary.length,homepageOnly:true}));
