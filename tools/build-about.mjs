import { readFile, writeFile } from "node:fs/promises";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { preserveAboutPortraitColors } from "./about-portrait-color.mjs";

const root = new URL("../", import.meta.url);
const chunkPath = new URL("_next/static/chunks/7758f29a8aeb1c60.js", root);
const htmlPath = new URL("index.html", root);
const source = await readFile(new URL("about-runtime.js", import.meta.url), "utf8");
const component = new Function("s", "u", `${source}\nreturn PortfolioAbout;`)(jsxRuntime, React);
const markup = renderToStaticMarkup(React.createElement(component));

let chunk = await readFile(chunkPath, "utf8");
const start = "/* PORTFOLIO_ABOUT_START */";
const end = "/* PORTFOLIO_ABOUT_END */";
if (chunk.includes(start)) {
  const from = chunk.indexOf(start);
  const to = chunk.indexOf(end, from);
  if (to < 0) throw new Error("About runtime marker is incomplete.");
  chunk = chunk.slice(0, from) + start + "\n" + source + "\n" + chunk.slice(to);
} else {
  const anchor = "function fy(){return null}function fb()";
  if (!chunk.includes(anchor)) throw new Error("Home runtime insertion point was not found.");
  chunk = chunk.replace(anchor, `${start}\n${source}\n${end}\n${anchor}`);
  const from = chunk.indexOf('(0,s.jsxs)("div",{id:"about",');
  const to = chunk.indexOf('(0,s.jsx)(c3.default,{onImagesChange:n})', from);
  if (from < 0 || to < 0) throw new Error("Original About component was not found.");
  chunk = chunk.slice(0, from) + '(0,s.jsx)(PortfolioAbout,{portraitRef:f,lenis:A}),' + chunk.slice(to);
}

// Keep the existing WebGL image layer and its interaction; only About skips negative colors.
chunk = chunk.replace('{key:"about",imageUrl:"/img/portrait-original.jpg",targetRef:f}', '{key:"about",imageUrl:portfolioAboutPortrait.src,targetRef:f}');
if (!chunk.includes('{key:"about",imageUrl:portfolioAboutPortrait.src,targetRef:f')) {
  throw new Error("About portrait layer was not found.");
}
chunk = preserveAboutPortraitColors(chunk);

let html = await readFile(htmlPath, "utf8");
const htmlStart = "<!-- PORTFOLIO_ABOUT_START -->";
const htmlEnd = "<!-- PORTFOLIO_ABOUT_END -->";
const block = htmlStart + markup + htmlEnd;
if (html.includes(htmlStart)) {
  const from = html.indexOf(htmlStart);
  const to = html.indexOf(htmlEnd, from);
  if (to < 0) throw new Error("Static About marker is incomplete.");
  html = html.slice(0, from) + block + html.slice(to + htmlEnd.length);
} else {
  const from = html.indexOf('<div id="about"');
  const to = html.indexOf('<section id="selected-work"', from);
  if (from < 0 || to < 0) throw new Error("Static About replacement point was not found.");
  html = html.slice(0, from) + block + html.slice(to);
}

await writeFile(chunkPath, chunk);
await writeFile(htmlPath, html);
console.log("Updated About; portrait retains its original colors and existing WebGL interaction.");
