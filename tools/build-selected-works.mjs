import { readFile, writeFile, mkdir } from "node:fs/promises";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

import { buildProjectDetails } from "./build-project-details.mjs";
import { buildCanvasflowDetail } from "./build-canvasflow-detail.mjs";

const root = new URL("../", import.meta.url);
const responsive = JSON.parse(await readFile(new URL("assets/works/optimized.json", root), "utf8"));
const source = (await readFile(new URL("selected-works-runtime.js", import.meta.url), "utf8"))
  .replace("__PORTFOLIO_WORKS_RESPONSIVE__", JSON.stringify(responsive));
const rhythm = await readFile(new URL("selected-works-rhythm.js", import.meta.url), "utf8");
const experience = await readFile(new URL("work-experience-runtime.js", import.meta.url), "utf8");
const { component, projects, experienceComponent } = new Function("e", "i", "worksScrollEnv", "worksLoadingGate", "worksMediaEnv", `${experience}\n${rhythm}\n${source}\nreturn { component: PortfolioWorksSection, projects: portfolioSelectedProjects, experienceComponent: PortfolioWorkExperience };`)(jsxRuntime, React, { useContainerEl: () => null }, { useHomeLoadingGate: () => false }, { useShellMedia: () => ({ soundEnabled: false }) });
// React 19 emits image preloads before standalone markup. Those belong in a document
// head, not before this section inside an already-hydrated component tree.
const imagePreload = /<link rel="preload" as="image" href="\/assets\/works\/[^">]+"\/?\s*>/g;
const experienceMarkup = renderToStaticMarkup(React.createElement(experienceComponent));
const markup = renderToStaticMarkup(React.createElement(component)).replace(imagePreload, "")
  .replace(experienceMarkup, `<!-- PORTFOLIO_EXPERIENCE_START -->${experienceMarkup}<!-- PORTFOLIO_EXPERIENCE_END -->`);
const chunkPath = new URL("_next/static/chunks/1ed7a178f7acd3df.js", root);
let chunk = await readFile(chunkPath, "utf8");
// Minimal read-only bridge to the existing player's ref. Playback, settings,
// volume, keyboard shortcut and navigation retain their original behavior.
const mediaOriginal = "soundEnabled:l,setSoundEnabled:m},children:t})}t.s([\"ShellMediaProvider\"";
const mediaBridge = "soundEnabled:l,setSoundEnabled:m,getBgmElement:()=>c.current},children:t})}t.s([\"ShellMediaProvider\"";
if (chunk.includes(mediaOriginal)) chunk = chunk.replace(mediaOriginal, mediaBridge);
else if (!chunk.includes(mediaBridge)) throw new Error("Existing BGM provider bridge location missing.");
// Replace only the canvas pointer overlay while the scoped cover cursor is
// visible. Background/fluid passes and other pages retain their existing state.
const scenePath = new URL("_next/static/chunks/7758f29a8aeb1c60.js", root);
let scene = await readFile(scenePath, "utf8");
const pointerOriginal = "$.setPointerOverlayEnabled(g)";
const pointerScoped = '$.setPointerOverlayEnabled(g&&!document.documentElement.hasAttribute("data-works-cover-cursor"))';
if (scene.includes(pointerOriginal)) scene = scene.replace(pointerOriginal, pointerScoped);
else if (!scene.includes(pointerScoped)) throw new Error("Existing pixel pointer overlay location missing.");
const trailOriginal = "$.updatePointer(L.current,o&&g,t)";
const trailScoped = '$.updatePointer(L.current,o&&g&&!document.documentElement.hasAttribute("data-works-cover-cursor"),t)';
if (scene.includes(trailOriginal)) scene = scene.replace(trailOriginal, trailScoped);
else if (!scene.includes(trailScoped)) throw new Error("Existing pixel pointer trail location missing.");
const start = "/* PORTFOLIO_SELECTED_WORKS_START */";
const end = "/* PORTFOLIO_SELECTED_WORKS_END */";
const block = `${start}\nconst worksScrollEnv = t.i(29680).scrollEnv;\nconst worksLoadingGate = t.i(97839);\nconst worksMediaEnv = t.i(23525);\n${rhythm}\n${source}\nfunction h(props){return e.jsx(PortfolioWorksSection,props);}\n${end}`;
if (chunk.includes(start)) {
  const from = chunk.indexOf(start), to = chunk.indexOf(end, from);
  if (to < 0) throw new Error("Selected Works end marker missing.");
  chunk = chunk.slice(0, from) + block + chunk.slice(to + end.length);
} else {
  const from = chunk.indexOf("function h({onImagesChange:t})", chunk.indexOf("/* PORTFOLIO_EXPERIENCE_END */"));
  const to = chunk.indexOf('t.s(["SELECTED_WORK_SECTION_ID"', from);
  if (from < 0 || to < 0) throw new Error("Selected-work runtime boundaries missing.");
  chunk = chunk.slice(0, from) + block + chunk.slice(to);
}

const htmlPath = new URL("index.html", root);
let html = await readFile(htmlPath, "utf8");
html = html.replace(imagePreload, "");
const from = html.indexOf('<section id="selected-work"');
if (from < 0) throw new Error("Selected-work SSR section missing.");
const token = /<section\b[^>]*>|<\/section>/g;
token.lastIndex = from;
let depth = 0, to = -1, match;
while ((match = token.exec(html))) {
  depth += match[0].startsWith("</") ? -1 : 1;
  if (depth === 0) { to = token.lastIndex; break; }
}
if (to < 0) throw new Error("Selected-work SSR section incomplete.");
html = html.slice(0, from) + markup + html.slice(to);
html = html.replace('<link rel="stylesheet" href="/portfolio-works.css">', "");

// The CSS entry import also survives the captured app's head reconciliation.
const cssPath = new URL("_next/static/chunks/635eb04122aa774f.css", root);
let css = await readFile(cssPath, "utf8");
if (!css.includes('@import url("/portfolio-works.css");')) css = '@import url("/portfolio-works.css");\n' + css;

await buildProjectDetails();
await writeFile(chunkPath, chunk);
await writeFile(htmlPath, html);
await writeFile(cssPath, css);
await writeFile(scenePath, scene);
// Derive the detail scene after writing the latest shared homepage runtime.
await buildCanvasflowDetail();
console.log(`Built Selected Works runtime, static HTML, and ${projects.length} project detail pages.`);
