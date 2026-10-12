import { readFile, writeFile } from "node:fs/promises";
import { preserveGeneratedFormat } from "./preserve-generated-format.mjs";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

const root = new URL("../", import.meta.url);
const chunkPath = new URL("_next/static/chunks/1ed7a178f7acd3df.js", root);
const indexPath = new URL("index.html", root);
const source = await readFile(new URL("work-experience-runtime.js", import.meta.url), "utf8");
const component = new Function("e", "i", `${source}\nreturn PortfolioWorkExperience;`)(jsxRuntime, React);
const markup = renderToStaticMarkup(React.createElement(component));

// Keep the source editable without bundling another React instance or changing the page shell.
const start = "/* PORTFOLIO_EXPERIENCE_START */";
const end = "/* PORTFOLIO_EXPERIENCE_END */";
let chunk = await readFile(chunkPath, "utf8");
const originalChunk = chunk;
if (chunk.includes(start)) {
  const from = chunk.indexOf(start);
  const to = chunk.indexOf(end, from);
  if (to < 0) throw new Error("Missing experience end marker.");
  chunk = chunk.slice(0, from) + start + "\n" + source + "\n" + chunk.slice(to);
} else {
  const anchor = 'let a="selected-work",o={};function h(';
  if (!chunk.includes(anchor)) throw new Error("Selected-work component was not found.");
  chunk = chunk.replace(anchor, `let a="selected-work",o={};${start}\n${source}\n${end}\nfunction h(`);
}

const oldCards = 'children:f.map(t=>{var i;';
const newCards = 'children:f.map(t=>{if(t.href==="#work-private-archive")return e.jsx(PortfolioWorkExperience,{},t.href);var i;';
const hasSelectedWorks = chunk.includes("/* PORTFOLIO_SELECTED_WORKS_START */");
if (!hasSelectedWorks) {
  if (chunk.includes(oldCards)) chunk = chunk.replace(oldCards, newCards);
  if (!chunk.includes(newCards)) throw new Error("Experience card replacement was not found.");
}

// The replaced archive card must no longer contribute an image plane to the WebGL scene.
const oldImages = '()=>f.map(t=>({href:t.href,imageUrl:t.imageUrl,hoverImageUrl:t.hoverImageUrl,targetRef:m[t.href]}))';
const newImages = '()=>f.filter(t=>t.href!=="#work-private-archive").map(t=>({href:t.href,imageUrl:t.imageUrl,hoverImageUrl:t.hoverImageUrl,targetRef:m[t.href]}))';
if (!hasSelectedWorks) {
  if (chunk.includes(oldImages)) chunk = chunk.replace(oldImages, newImages);
  if (!chunk.includes(newImages)) throw new Error("Archive image-plane exclusion was not found.");
}

let html = await readFile(indexPath, "utf8");
const htmlStart = "<!-- PORTFOLIO_EXPERIENCE_START -->";
const htmlEnd = "<!-- PORTFOLIO_EXPERIENCE_END -->";
const block = htmlStart + markup + htmlEnd;
if (html.includes(htmlStart)) {
  const from = html.indexOf(htmlStart);
  const to = html.indexOf(htmlEnd, from);
  if (to < 0) throw new Error("Missing HTML experience end marker.");
  html = html.slice(0, from) + block + html.slice(to + htmlEnd.length);
} else {
  const section = '<section id="selected-work"';
  const sectionStart = html.indexOf(section);
  const gridEnd = html.indexOf('style="row-gap:0px">', sectionStart);
  if (sectionStart < 0 || gridEnd < 0) throw new Error("Selected-work SSR grid was not found.");
  const position = gridEnd + 'style="row-gap:0px">'.length;
  html = html.slice(0, position) + block + html.slice(position);
}

await writeFile(chunkPath, preserveGeneratedFormat(originalChunk, chunk));
await writeFile(indexPath, html);
console.log("Updated work experience runtime and static HTML.");
