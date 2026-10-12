// Refresh only the selected-work resource data/markup and CanvasFlow cover.
// Keep scene, navigation, typography, other details and PDF resources intact.
import {readFile,writeFile} from 'node:fs/promises';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import {transform} from 'esbuild';
import {preserveGeneratedFormat} from './preserve-generated-format.mjs';
import {buildCanvasflowDetail} from './build-canvasflow-detail.mjs';
const root=new URL('../',import.meta.url),read=name=>readFile(new URL(name,root),'utf8');
const responsive=JSON.parse(await read('assets/works/optimized.json'));
const source=(await read('tools/selected-works-runtime.js')).replace('__PORTFOLIO_WORKS_RESPONSIVE__',JSON.stringify(responsive));
const rhythm=await read('tools/selected-works-rhythm.js'),experience=await read('tools/work-experience-runtime.js');
const bindings={useContainerEl:()=>null},gate={useHomeLoadingGate:()=>false},media={useShellMedia:()=>({soundEnabled:false})};
const {component,experienceComponent}=new Function('e','i','worksScrollEnv','worksLoadingGate','worksMediaEnv',`${experience}\n${rhythm}\n${source}\nreturn {component:PortfolioWorksSection,experienceComponent:PortfolioWorkExperience};`)(jsxRuntime,React,bindings,gate,media);
const experienceMarkup=renderToStaticMarkup(React.createElement(experienceComponent));
const markup=renderToStaticMarkup(React.createElement(component)).replace(/<link rel="preload" as="image"[^>]+>/g,'').replace(experienceMarkup,`<!-- PORTFOLIO_EXPERIENCE_START -->${experienceMarkup}<!-- PORTFOLIO_EXPERIENCE_END -->`);
const sharedPath='_next/static/chunks/1ed7a178f7acd3df.js',before=await read(sharedPath);
const start='/* PORTFOLIO_SELECTED_WORKS_START */',end='/* PORTFOLIO_SELECTED_WORKS_END */',a=before.indexOf(start),b=before.indexOf(end,a);
if(a<0||b<0)throw new Error('Selected Works runtime boundary missing');
const block=`${start}\nconst worksScrollEnv=t.i(29680).scrollEnv;\nconst worksLoadingGate=t.i(97839);\nconst worksMediaEnv=t.i(23525);\n${rhythm}\n${source}\nfunction h(props){return e.jsx(PortfolioWorksSection,props);}\n${end}`;
const shared=before.slice(0,a)+block+before.slice(b+end.length);
await transform(shared,{loader:'js'});
let html=await read('index.html');const from=html.indexOf('<section id="selected-work"');
const tokens=/<section\b[^>]*>|<\/section>/g;tokens.lastIndex=from;let depth=0,to=-1,match;
while((match=tokens.exec(html))){depth+=match[0].startsWith('</')?-1:1;if(!depth){to=tokens.lastIndex;break;}}
if(from<0||to<0)throw new Error('Selected Works markup boundary missing');
html=html.slice(0,from)+markup+html.slice(to);
await writeFile(new URL(sharedPath,root),preserveGeneratedFormat(before,shared));await writeFile(new URL('index.html',root),html);
await buildCanvasflowDetail();
console.log('Updated selected-work cover resources and CanvasFlow cover only.');
