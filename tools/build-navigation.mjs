import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const chunkPath = new URL("_next/static/chunks/1ed7a178f7acd3df.js", root);
const htmlPath = new URL("index.html", root);
const source = await readFile(new URL("navigation-runtime.js", import.meta.url), "utf8");
let chunk = await readFile(chunkPath, "utf8");
const headerStart = chunk.indexOf('88106,t=>{"use strict";');
if (headerStart < 0) throw new Error("Header runtime module was not found.");
let header = chunk.slice(headerStart);

function replaceRequired(before, after) {
  if (!header.includes(before)) throw new Error(`Navigation patch target was not found: ${before.slice(0, 100)}`);
  header = header.replace(before, after);
}

const sourceStart = "/* PORTFOLIO_NAVIGATION_START */";
const sourceEnd = "/* PORTFOLIO_NAVIGATION_END */";
if (header.includes(sourceStart)) {
  const from = header.indexOf(sourceStart);
  const to = header.indexOf(sourceEnd, from);
  if (to < 0) throw new Error("Navigation source marker is incomplete.");
  header = header.slice(0, from) + `${sourceStart}\n${source}\n${sourceEnd}` + header.slice(to + sourceEnd.length);
} else {
  replaceRequired('function PortfolioSettings(){', `${sourceStart}\n${source}\n${sourceEnd}\nfunction PortfolioSettings(){`);
}

if (!header.includes("portfolioActiveSection=usePortfolioNavigationSection")) {
  replaceRequired('te=(0,A.useNearBottom)(.5);', 'te=(0,A.useNearBottom)(.5),portfolioActiveSection=usePortfolioNavigationSection(t,q,G);');
  replaceRequired('g.scrollEnv.lenisScrollTo(e,{lerp:.1})', 'g.scrollEnv.lenisScrollTo(portfolioNavigationTarget(e),{lerp:.1})');
  replaceRequired('sessionStorage.setItem(E,e),z("/")', 'sessionStorage.setItem(E,e==="#featured-projects"?"#selected-work":e),z("/")');

  const specs = [
    { name: "experience", old: 'ti(`#${v.SELECTED_WORK_SECTION_ID}`)', target: 'ti("#work-experience")' },
    { name: "projects", old: 'ti(`#${w.CONTACT_SECTION_ID}`)', target: 'ti("#featured-projects")' },
    { name: "about", old: 'ti("#about")', target: 'ti("#about")' },
    { name: "contact", old: 'ti("#contact")', target: 'ti("#contact")' }
  ];
  for (const spec of specs) {
    const buttonPattern = new RegExp(`\\(0,e\\.jsx\\)\\("button",\\{type:"button",className:\\x60([^\\x60]*)\\x60,onClick:\\(\\)=>${spec.old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` , "g");
    let count = 0;
    header = header.replace(buttonPattern, (_, className) => {
      count += 1;
      return `(0,e.jsx)("button",{type:"button",className:\`${className} portfolio-nav-item\`,"data-portfolio-nav":"${spec.name}","aria-current":portfolioActiveSection==="${spec.name}"?"location":void 0,onClick:()=>${spec.target}`;
    });
    if (!count) throw new Error(`Navigation button was not found: ${spec.name}`);
  }

  replaceRequired('font-mono-2 text-[10svw] text-l1",children:', 'font-mono-2 text-[10svw] text-l1 portfolio-nav-menu",children:');
  replaceRequired('text:"精选项目",startDelayMs:500})})]})]})}',
    'text:"精选项目",startDelayMs:500})}),(0,e.jsx)("button",{type:"button",className:`${Q} uppercase text-left cursor-pointer portfolio-nav-item`,"data-portfolio-nav":"about","aria-current":portfolioActiveSection==="about"?"location":void 0,onClick:()=>ti("#about"),children:(0,e.jsx)(c.default,{text:"关于我",startDelayMs:600})}),(0,e.jsx)("button",{type:"button",className:`${Q} uppercase text-left cursor-pointer portfolio-nav-item`,"data-portfolio-nav":"contact","aria-current":portfolioActiveSection==="contact"?"location":void 0,onClick:()=>ti("#contact"),children:(0,e.jsx)(c.default,{text:"联系我",startDelayMs:700})})]})]})}');
}

chunk = chunk.slice(0, headerStart) + header;
let html = await readFile(htmlPath, "utf8");
const staticHeaderStart = html.indexOf("<header");
const staticHeaderEnd = html.indexOf("</header>", staticHeaderStart);
if (staticHeaderStart < 0 || staticHeaderEnd < 0) throw new Error("Static header was not found.");
let staticHeader = html.slice(staticHeaderStart, staticHeaderEnd + "</header>".length);
const firstClass = staticHeader.match(/<button type="button" class="([^"]*)"/)?.[1];
if (!firstClass) throw new Error("Static navigation classes were not found.");
const dottedBase = firstClass.replace(/ p-2 uppercase cursor-pointer.*$/, "");
const staticItems = {
  "工作经历": ["experience", ""],
  "精选项目": ["projects", ""],
  "关于我": ["about", " pointer-events-auto"],
  "联系我": ["contact", " pointer-events-auto inline-flex shrink-0 items-baseline gap-0 normal-case"]
};
let staticCount = 0;
staticHeader = staticHeader.replace(/<button type="button" class="[^"]*"[^>]*>(.*?)<\/button>/gs, (button, contents) => {
  const label = contents.replace(/<[^>]*>/g, "");
  const item = staticItems[label];
  if (!item) return button;
  staticCount += 1;
  const [name, extra] = item;
  return `<button type="button" class="${dottedBase} p-2 uppercase cursor-pointer${extra} portfolio-nav-item" data-portfolio-nav="${name}">${contents}</button>`;
});
if (staticCount !== 4) throw new Error(`Expected four static navigation items, found ${staticCount}.`);
html = html.slice(0, staticHeaderStart) + staticHeader + html.slice(staticHeaderEnd + "</header>".length);
await writeFile(chunkPath, chunk);
await writeFile(htmlPath, html);
console.log("Updated navigation state and existing section targets.");
