import { readFile, writeFile, stat } from "node:fs/promises";
import { preserveGeneratedFormat } from "./preserve-generated-format.mjs";

const root = new URL("../", import.meta.url);
const chunkPath = new URL("_next/static/chunks/7758f29a8aeb1c60.js", root);
const cssPath = new URL("_next/static/chunks/635eb04122aa774f.css", root);
const groups = JSON.parse((await readFile(new URL("assets/personal-world/content.json", root), "utf8")).replace(/^\uFEFF/, ""));
const rawSource = await readFile(new URL("personal-world-runtime.js", import.meta.url), "utf8");
const responsive = JSON.parse(await readFile(new URL("assets/personal-world/optimized.json", root), "utf8"));
const source = rawSource.replace("__PORTFOLIO_PERSONAL_WORLD_CONTENT__", JSON.stringify(groups, null, 2))
  .replace("__PORTFOLIO_PERSONAL_WORLD_RESPONSIVE__", JSON.stringify(responsive));
if (groups.length !== 2 || groups.some(group => group.topics.length !== 2
  || group.topics.some(topic => topic.images.length < 3))) {
  throw new Error("Expected two groups, two topics each, and at least three local photos per topic.");
}
for (const group of groups) for (const topic of group.topics) for (const image of topic.images) {
  if (!image.src.startsWith("/assets/personal-world/")) throw new Error(`Nonlocal photo: ${image.src}`);
  await stat(new URL(image.src.slice(1), root));
}
new Function("s", "u", "c7", source); // Validate syntax before touching the captured runtime.

let chunk = await readFile(chunkPath, "utf8");
const originalChunk = chunk;
const start = "/* PORTFOLIO_PERSONAL_WORLD_START */";
const end = "/* PORTFOLIO_PERSONAL_WORLD_END */";
const from = chunk.includes(start) ? chunk.indexOf(start) : chunk.indexOf("function fm({ringProgress01:");
const markerEnd = chunk.indexOf(end, from);
let to = chunk.includes(start) ? markerEnd + end.length : chunk.indexOf("function fg(){", from);
if (from < 0 || to < from || (chunk.includes(start) && markerEnd < 0)) {
  throw new Error("Tunnel middle-stage boundaries or original ring invocation missing.");
}
if (chunk.includes(start) && chunk.slice(to, to + 2) === "\r\n") to += 2;
else if (chunk.includes(start) && chunk[to] === "\n") to++;
chunk = chunk.slice(0, from) + `${start}\n${source}\n${end}\n` + chunk.slice(to);
const prewarmAnchor = '(0,s.jsx)(PortfolioReturnPaintReadyFrame,{})';
if (!chunk.includes('(0,s.jsx)(PortfolioPersonalWorldPrewarm,{sectionPosition:e})')) {
  if (chunk.split(prewarmAnchor).length !== 2) throw new Error("Photo prewarm scene anchor missing or ambiguous");
  chunk = chunk.replace(prewarmAnchor, prewarmAnchor + ',(0,s.jsx)(PortfolioPersonalWorldPrewarm,{sectionPosition:e})');
}
let css = await readFile(cssPath, "utf8");
const importRule = '@import url("/portfolio-personal-world.css");';
if (!css.includes(importRule)) css = importRule + "\n" + css;

await writeFile(chunkPath, preserveGeneratedFormat(originalChunk, chunk));
await writeFile(cssPath, css);
console.log(`Built a caption-free radial sequence (${groups.flatMap(group => group.topics).reduce((sum, topic) => sum + topic.images.length, 0)} local photos); existing ring, tunnel timing and titles retained.`);
