import { readFile, writeFile } from "node:fs/promises";

// Patch only the existing tunnel titles; retain the captured animation runtime.
const primary = ["BEYOND", "THE WORK."];
const secondary = ["A GLIMPSE", "OF MY", "WORLD."];
const final = ["FROM MY WORLD", "TO YOURS."];
const root = new URL("../", import.meta.url);
const chunkPath = new URL("_next/static/chunks/7758f29a8aeb1c60.js", root);
const htmlPath = new URL("index.html", root);
const titleClass = "flex flex-col justify-center items-center col-span-12 row-span-6 font-bold text-[7.2svw] lg:text-[6.8svw] uppercase leading-none";

function replaceOnce(source, pattern, replacement, label) {
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) throw new Error(`${label}: expected one match, found ${matches.length}.`);
  return source.replace(pattern, replacement);
}

let chunk = await readFile(chunkPath, "utf8");
chunk = replaceOnce(chunk, /fs=\[[^\]]*\],fu=\[[^\]]*\],fc=\[[^\]]*\]/g,
  `fs=${JSON.stringify(primary)},fu=${JSON.stringify(secondary)},fc=${JSON.stringify(final)}`, "Tunnel title copy");

const start = chunk.indexOf("function fp({stage:");
const end = chunk.indexOf("function fm({ringProgress01:", start);
if (start < 0 || end < 0) throw new Error("Two-stage title component boundaries missing.");
let title = chunk.slice(start, end);
if (!title.includes('"data-hyperspace-copy":a')) {
  title = title.replace("{className:", '{"data-hyperspace-copy":a,className:');
}
const oldStyle = 'style:{fontVariationSettings:\'"wdth" 120\',color:"#fff",lineHeight:o?1:1.15,gap:o?void 0:".1em",paddingBlock:o?void 0:".25em"}';
// Each array item is a fixed line. Keep the existing responsive font-size classes.
const newStyle = 'style:{fontVariationSettings:\'"wdth" 120\',color:"#fff",lineHeight:1.15,gap:".1em",paddingBlock:".25em",whiteSpace:o?"nowrap":void 0}';
if (!title.includes(newStyle)) {
  if (!title.includes(oldStyle)) throw new Error("Original title typography was not found.");
  title = title.replace(oldStyle, newStyle);
}
chunk = chunk.slice(0, start) + title + chunk.slice(end);

const finalStart = chunk.indexOf("function fg(){");
const finalEnd = chunk.indexOf("var fv=", finalStart);
if (finalStart < 0 || finalEnd < 0) throw new Error("Final tunnel title boundaries missing.");
let finalTitle = chunk.slice(finalStart, finalEnd);
if (!finalTitle.includes('"data-hyperspace-copy":"end"')) {
  finalTitle = finalTitle.replace("{ref:e,className:", '{ref:e,"data-hyperspace-copy":"end",className:');
}
const finalOldStyle = 'style:{fontVariationSettings:\'"wdth" 120\'}';
const finalNewStyle = 'style:{fontVariationSettings:\'"wdth" 120\',color:"#fff",lineHeight:1.15,gap:".1em",paddingBlock:".25em",whiteSpace:"nowrap"}';
if (!finalTitle.includes(finalNewStyle)) {
  if (!finalTitle.includes(finalOldStyle)) throw new Error("Original final-title typography was not found.");
  finalTitle = finalTitle.replace(finalOldStyle, finalNewStyle);
}
chunk = chunk.slice(0, finalStart) + finalTitle + chunk.slice(finalEnd);

let html = await readFile(htmlPath, "utf8");
const escapedClass = titleClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const staticTitle = new RegExp(`<div(?: data-hyperspace-copy="primary")? class="${escapedClass}" style="[^"]*">(?:<span style="opacity:0">[^<]*<\\/span>)+<\\/div>`, "g");
const markup = `<div data-hyperspace-copy="primary" class="${titleClass}" style="font-variation-settings:&quot;wdth&quot; 120;color:#fff;line-height:1.15;gap:.1em;padding-block:.25em;white-space:nowrap">${primary.map(line => `<span style="opacity:0">${line}</span>`).join("")}</div>`;
html = replaceOnce(html, staticTitle, markup, "Static first-stage title");

// Validate both replacements before writing either runtime or static markup.
await writeFile(chunkPath, chunk);
await writeFile(htmlPath, html);
console.log("Updated first/final tunnel titles to fixed two-line layouts; middle stage and animation runtime retained.");
