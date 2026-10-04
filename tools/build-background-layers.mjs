import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const shellPath = new URL("_next/static/chunks/1ed7a178f7acd3df.js", root);
const homePath = new URL("_next/static/chunks/7758f29a8aeb1c60.js", root);
const htmlPath = new URL("index.html", root);

// The scene canvas is opaque; some visible photos/cards are WebGL image
// planes. Composite the unchanged SVG in its background shader, before scene
// objects, and keep the entire canvas in its existing background context.
function replaceOnce(text, before, after, label) {
  if (text.split(after).length - 1 === 1) return text;
  const count = text.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one target, found ${count}`);
  return text.replace(before, after);
}

function inject(text, name, anchor, source) {
  const start = `/* ${name}_START */`;
  const end = `/* ${name}_END */`;
  const block = `${start}\n${source.trim()}\n${end}\n`;
  if (text.includes(start)) {
    const first = text.indexOf(start);
    const last = text.indexOf(end, first);
    if (last < 0) throw new Error(`${name}: missing end marker`);
    return text.slice(0, first) + block + text.slice(last + end.length).replace(/^\r?\n/, "");
  }
  return replaceOnce(text, anchor, block + anchor, name);
}

let shell = await readFile(shellPath, "utf8");
let home = await readFile(homePath, "utf8");
let html = await readFile(htmlPath, "utf8");
const compositeSource = await readFile(new URL("background-grid-composite.glsl", import.meta.url), "utf8");
function composeGrid(shader, marker) {
  // Upgrade the intermediate output-space trial without changing base effects.
  shader = shader.replace(/#include <colorspace_fragment>\s*\/\/ PORTFOLIO_GRID_(?:COMPOSITE|OVERLAY)[\s\S]*?\n\s*}/, "#include <colorspace_fragment>");
  const start = `// ${marker}_START`;
  const end = `// ${marker}_END`;
  const block = `${start}\n${compositeSource.trim()}\n${end}\n`;
  if (shader.includes(start)) {
    const first = shader.indexOf(start), last = shader.indexOf(end, first);
    if (last < 0) throw new Error("Grid shader marker is incomplete");
    return shader.slice(0, first) + block + shader.slice(last + end.length).replace(/^\r?\n/, "");
  }
  return replaceOnce(shader, "#include <colorspace_fragment>", block + "#include <colorspace_fragment>", marker);
}

const hiddenGrid = 'className:"portfolio-background-grid","aria-hidden":!0,hidden:!0,style:{display:"none",pointerEvents:"none"},children:';
if (!shell.includes(hiddenGrid)) {
  shell = replaceOnce(shell,
    'className:"z-20 fixed inset-0 w-full h-full pointer-events-none mix-blend-difference",children:',
    'className:"portfolio-background-grid z-0 fixed inset-0 w-full h-full pointer-events-none mix-blend-difference","aria-hidden":!0,children:',
    "Grid background layer");
}
shell = replaceOnce(shell,
  ',"/"===t&&(0,e.jsx)(x.default,{}),',
  ',/* PORTFOLIO_GRID_IN_BACKGROUND */',
  "Remove the foreground grid mount");

shell = inject(shell, "PORTFOLIO_GRID_SOURCE", 't.s(["default",0,()=>{let{width:t,height:r}=',
  await readFile(new URL("background-grid-source.js", import.meta.url), "utf8"));
shell = replaceOnce(shell,
  '},[r,n,t]);return s?null:(0,e.jsx)("div",{className:"portfolio-background-grid',
  '},[r,n,t]);usePortfolioGridSource({width:t,height:r,verticalPath:a,horizontalPath:o,crossPath:h,loading:s});return s?null:(0,e.jsx)("div",{className:"portfolio-background-grid',
  "Publish the original grid geometry");
shell = replaceOnce(shell,
  'className:"portfolio-background-grid z-0 fixed inset-0 w-full h-full pointer-events-none mix-blend-difference","aria-hidden":!0,children:',
  'className:"portfolio-background-grid","aria-hidden":!0,hidden:!0,style:{display:"none",pointerEvents:"none"},children:',
  "Keep the SVG source out of foreground painting and hit testing");

home = replaceOnce(home,
  'function fb(){',
  'var portfolioBackgroundGrid=e.i(13717);function fb(){',
  "Reuse the existing grid component");
home = replaceOnce(home,
  '(0,s.jsx)("div",{className:"top-0 left-0 -z-1 fixed w-full h-dvh lg:h-screen",children:(0,s.jsx)(cV,{sectionPosition:p,domImages:v})})',
  '(0,s.jsxs)("div",{className:"portfolio-background-layer top-0 left-0 -z-1 fixed w-full h-dvh lg:h-screen",children:[(0,s.jsx)(cV,{sectionPosition:p,domImages:v}),(0,s.jsx)(portfolioBackgroundGrid.default,{})]})',
  "Mount the grid beside the canvas in the background stacking context");

home = inject(home, "PORTFOLIO_BACKGROUND_GRID_RUNTIME", "let sI=0,",
  await readFile(new URL("background-grid-runtime.js", import.meta.url), "utf8"));
home = replaceOnce(home,
  '});(0,u.useEffect)(()=>{let n=Math.max(1,Math.floor(r.width*e.resolutionScale))',
  '});usePortfolioBackgroundGrid(m.outputMaterial,t);(0,u.useEffect)(()=>{let n=Math.max(1,Math.floor(r.width*e.resolutionScale))',
  "Bind the grid texture to the existing background pass");
home = replaceOnce(home,
  'uOutputMix:{value:p.outputMix}})).vertexShader=',
  'uOutputMix:{value:p.outputMix},uPortfolioGrid:{value:null},uPortfolioGridReady:{value:0}})).vertexShader=',
  "Background grid uniforms");

// Modify only the output background shader, preserving its original effects.
const shaderPrefix = '(d=t("precision mediump float;';
const shaderStart = home.indexOf(shaderPrefix) + '(d=t('.length;
const shaderEnd = home.indexOf(',{uBgColor:', shaderStart);
if (shaderStart < '(d=t('.length || shaderEnd < shaderStart) throw new Error("Background shader not found");
let shader = JSON.parse(home.slice(shaderStart, shaderEnd));
if (!shader.includes("uniform sampler2D uPortfolioGrid;")) {
  shader = replaceOnce(shader, "uniform sampler2D tInput;", "uniform sampler2D tInput;\nuniform sampler2D uPortfolioGrid;\nuniform float uPortfolioGridReady;", "Grid shader declarations");
}
shader = composeGrid(shader, "PORTFOLIO_BASE_GRID");
home = home.slice(0, shaderStart) + JSON.stringify(shader) + home.slice(shaderEnd);

// About/projects also use an existing pixel-pattern background overlay at
// renderOrder 10. Its opaque pixels hide the base pass; preserve that effect
// and composite the SAME grid into those pixels. Image planes (order 20) and
// the existing glass foreground (order 12) still render above both backgrounds.
home = replaceOnce(home,
  '{size:i}=(0,sv.useThree)(),o=(0,u.useRef)(null),[a,l]=e,c=',
  '{size:i,gl:portfolioOverlayRenderer}=(0,sv.useThree)(),o=(0,u.useRef)(null),[a,l]=e,c=',
  "Use the existing overlay renderer");
const overlayBinding = 'uRadiusScale:{value:r},uResolution:{value:new sy.Vector2(1,1)},uPortfolioGrid:{value:null},uPortfolioGridReady:{value:0}}),[t,r]);usePortfolioBackgroundGrid(o,portfolioOverlayRenderer);return(0,u.useLayoutEffect)';
if (!home.includes(overlayBinding)) {
  const previousBinding = 'uRadiusScale:{value:r},uResolution:{value:new sy.Vector2(1,1)},uPortfolioGrid:{value:null},uPortfolioGridReady:{value:0}}),[t,r]);let portfolioOverlayMaterial=(0,u.useMemo)(()=>({uniforms:c}),[c]);usePortfolioBackgroundGrid(portfolioOverlayMaterial,portfolioOverlayRenderer);return(0,u.useLayoutEffect)';
  if (home.includes(previousBinding)) home = replaceOnce(home, previousBinding, overlayBinding, "Bind the actual overlay material");
  else home = replaceOnce(home, 'uRadiusScale:{value:r},uResolution:{value:new sy.Vector2(1,1)}}),[t,r]);return(0,u.useLayoutEffect)', overlayBinding, "Bind the grid to the pixel background uniforms");
}
const overlayStart = home.indexOf('s1=({overlayColors:');
const overlayEnd = home.indexOf('};var s2=', overlayStart);
if (overlayStart < 0 || overlayEnd < 0) throw new Error("Pixel background shader not found");
let overlay = home.slice(overlayStart, overlayEnd);
if (!overlay.includes("uniform sampler2D uPortfolioGrid;")) {
  overlay = replaceOnce(overlay, "uniform vec2 uResolution;", "uniform vec2 uResolution;\n          uniform sampler2D uPortfolioGrid;\n          uniform float uPortfolioGridReady;", "Pixel background grid declarations");
}
overlay = composeGrid(overlay, "PORTFOLIO_PIXEL_GRID");
home = home.slice(0, overlayStart) + overlay + home.slice(overlayEnd);

// The existing loading gate omits the grid from the initial SSR markup; keep
// that behavior and only synchronize the background container's class name.
html = replaceOnce(html,
  'class="top-0 left-0 -z-1 fixed w-full h-dvh lg:h-screen"',
  'class="portfolio-background-layer top-0 left-0 -z-1 fixed w-full h-dvh lg:h-screen"',
  "Synchronize the SSR background container");

await writeFile(shellPath, shell);
await writeFile(homePath, home);
await writeFile(htmlPath, html);
console.log("Original SVG grid now renders in the scene background pass, below image planes, 3D meshes and HTML content.");
