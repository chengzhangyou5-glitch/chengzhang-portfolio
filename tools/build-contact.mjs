import { readFile, writeFile } from "node:fs/promises";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

const root = new URL("../", import.meta.url);
const chunkPath = new URL("_next/static/chunks/1ed7a178f7acd3df.js", root);
const scenePath = new URL("_next/static/chunks/7758f29a8aeb1c60.js", root);
const htmlPath = new URL("index.html", root);
const source = await readFile(new URL("contact-runtime.js", import.meta.url), "utf8");
const { component, signature } = new Function("e", "i", "contactScrollEnv", `${source}\nreturn {component:PortfolioContact,signature:portfolioContactData.signature};`)(jsxRuntime, React, null);
const markup = renderToStaticMarkup(React.createElement(React.forwardRef(component)));

// Replace only the existing contact module; its exported ID and forwarded scene ref are retained.
let chunk = await readFile(chunkPath, "utf8");
const moduleStart = '},28192,t=>{"use strict";';
const moduleEnd = '},62291,1111,t=>';
const from = chunk.indexOf(moduleStart);
const to = chunk.indexOf(moduleEnd, from);
if (from < 0 || to < 0) throw new Error("Contact runtime module was not found.");
const replacement = `${moduleStart}var e=t.i(22441),i=t.i(70089),contactScrollEnv=t.i(29680).scrollEnv;\n/* PORTFOLIO_CONTACT_START */\n${source}\n/* PORTFOLIO_CONTACT_END */\nlet n="contact",a=i.forwardRef(PortfolioContact);t.s(["CONTACT_SECTION_ID",0,n,"default",0,a])`;
chunk = chunk.slice(0, from) + replacement + chunk.slice(to);

// The original fixed HUD swaps the clock for a copyright label only at the page end.
const oldSignature = 'className:"p-2 uppercase",text:`Studio (c) ${tl}`';
const newSignature = `className:"p-2 portfolio-contact-signature",text:${JSON.stringify(signature)}`;
if (chunk.includes(oldSignature)) chunk = chunk.replace(oldSignature, newSignature);
else if (chunk.includes('className:"p-2 portfolio-contact-signature",text:')) {
  chunk = chunk.replace(/className:"p-2 portfolio-contact-signature",text:"[^"\\]*(?:\\.[^"\\]*)*"/, newSignature);
} else throw new Error("End-screen copyright label was not found.");

let html = await readFile(htmlPath, "utf8");
const footerStart = html.indexOf('<footer id="contact"');
const footerEnd = html.indexOf("</footer>", footerStart);
if (footerStart < 0 || footerEnd < 0) throw new Error("Contact static HTML was not found.");
html = html.slice(0, footerStart) + markup + html.slice(footerEnd + "</footer>".length);

// Adapt the Contact glass model alone; the shared shader and other objects stay intact.
let scene = await readFile(scenePath, "utf8");
const materialSource = await readFile(new URL("contact-light-material.js", import.meta.url), "utf8");
const lightStart = "/* PORTFOLIO_CONTACT_LIGHT_START */";
const lightEnd = "/* PORTFOLIO_CONTACT_LIGHT_END */";
const lightBlock = `${lightStart}\n${materialSource.trim()}\n${lightEnd}\n`;
function replaceSceneOnce(before, after, label) {
  if (scene.includes(after)) return;
  if (scene.split(before).length !== 2) throw new Error(`${label}: expected exactly one scene target`);
  scene = scene.replace(before, after);
}
if (scene.includes(lightStart)) {
  const first = scene.indexOf(lightStart), last = scene.indexOf(lightEnd, first);
  if (last < 0) throw new Error("Contact light material marker is incomplete");
  scene = scene.slice(0, first) + lightBlock + scene.slice(last + lightEnd.length).replace(/^\r?\n/, "");
} else {
  replaceSceneOnce("function cd(e){", lightBlock + "function cd(e){", "Contact material helper");
}
replaceSceneOnce(
  "B=(0,u.useMemo)(()=>cf(A,v),[A,v])",
  "B=(0,u.useMemo)(()=>portfolioContactLightGlass(cf(A,v),v,p,e),[A,v,p,e])",
  "Contact material profile"
);
replaceSceneOnce(
  'tingColor:["#FFFFFF","#009dff","#8e9dc4","#64c3ff"]',
  'tingColor:["#c4ddef","#2384d3","#8e9dc4","#64c3ff"]',
  "Contact light tint"
);

await writeFile(chunkPath, chunk);
await writeFile(scenePath, scene);
await writeFile(htmlPath, html);
console.log("Updated contact runtime, light material and static HTML.");
