import { readFile, writeFile } from "node:fs/promises";
import { preserveGeneratedFormat } from "./preserve-generated-format.mjs";

const root = new URL("../", import.meta.url);
const chunkPath = new URL("_next/static/chunks/1ed7a178f7acd3df.js", root);
const htmlPath = new URL("index.html", root);
const source = await readFile(new URL("navigation-runtime.js", import.meta.url), "utf8");
let chunk = await readFile(chunkPath, "utf8");
const originalChunk = chunk;
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

// Stage A: patch only the existing mobile menu controls; keep transition timing.
if (!header.includes('className:"lg:hidden flex flex-row justify-end items-center gap-4 col-span-6 p-2 cursor-pointer pointer-events-auto portfolio-menu-trigger"')) {
  replaceRequired('(0,e.jsx)("div",{className:"lg:hidden flex flex-row justify-end items-center gap-4 col-span-6 p-2 cursor-pointer pointer-events-auto",onClick:',
    '(0,e.jsx)("button",{type:"button","aria-label":R?"关闭菜单":"打开菜单","aria-expanded":R,"aria-controls":"portfolio-mobile-menu",className:"lg:hidden flex flex-row justify-end items-center gap-4 col-span-6 p-2 cursor-pointer pointer-events-auto portfolio-menu-trigger",onClick:');
}
if (!header.includes('id:"portfolio-mobile-menu"')) {
  replaceRequired('(0,e.jsxs)("div",{className:"lg:hidden z-40 fixed inset-0 flex flex-col justify-center items-start',
    '(0,e.jsxs)("div",{id:"portfolio-mobile-menu",role:"navigation","aria-label":"主导航",className:"lg:hidden z-40 fixed inset-0 flex flex-col justify-center items-start');
}
if (!header.includes('usePortfolioMenuKeyboard(R,O)')) replaceRequired('g.scrollEnv.useScrollEdgeShortcuts();', 'g.scrollEnv.useScrollEdgeShortcuts();usePortfolioMenuKeyboard(R,O);');
header = header.replace('light:"关于我",dark:"关于我",system:"关于我"', 'light:"主题：浅色",dark:"主题：深色",system:"主题：自动"');
header = header.replace('className:tt,light:"主题：浅色"', 'className:tt+" portfolio-menu-control",light:"主题：浅色"');
header = header.replace('(0,e.jsx)(l.ASCIISoundToggle,{className:tt,startDelayMs:300,scrambleColors:!1})', '(0,e.jsx)(PortfolioMenuSoundToggle,{className:tt})');
// The menu exposes both settings inline, so its fixed gear would overlap them.
header = header.replace('!B&&(0,e.jsx)(PortfolioSettings,{})', '!B&&!R&&(0,e.jsx)(PortfolioSettings,{})');

chunk = chunk.slice(0, headerStart) + header;
let html = await readFile(htmlPath, "utf8");
const staticHeaderStart = html.indexOf("<header");
const staticHeaderEnd = html.indexOf("</header>", staticHeaderStart);
if (staticHeaderStart < 0 || staticHeaderEnd < 0) throw new Error("Static header was not found.");
let staticHeader = html.slice(staticHeaderStart, staticHeaderEnd + "</header>".length);
const oldMenu = '<div class="lg:hidden flex flex-row justify-end items-center gap-4 col-span-6 p-2 cursor-pointer pointer-events-auto">';
const menuStart = staticHeader.indexOf(oldMenu);
if (menuStart >= 0) {
  const tags = /<\/?div\b[^>]*>/g;
  tags.lastIndex = menuStart + oldMenu.length;
  let depth = 1, tag, menuEnd = -1;
  while ((tag = tags.exec(staticHeader))) { depth += tag[0].startsWith('</') ? -1 : 1; if (!depth) { menuEnd = tags.lastIndex; break; } }
  if (menuEnd < 0) throw new Error("Static mobile menu boundary missing.");
  const contents = staticHeader.slice(menuStart + oldMenu.length, menuEnd - 6);
  staticHeader = staticHeader.slice(0, menuStart) + '<button type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="portfolio-mobile-menu" class="lg:hidden flex flex-row justify-end items-center gap-4 col-span-6 p-2 cursor-pointer pointer-events-auto portfolio-menu-trigger">' + contents + '</button>' + staticHeader.slice(menuEnd);
}
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
await writeFile(chunkPath, preserveGeneratedFormat(originalChunk, chunk));
await writeFile(htmlPath, html);
console.log("Updated navigation state and existing section targets.");
