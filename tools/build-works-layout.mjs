// Scoped P1-02 build: no detail HTML, scene, PDF or component regeneration.
import { readFile, writeFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const read = p => readFile(new URL(p, root), 'utf8');
const write = async (p, source) => { if (await read(p).catch(() => null) !== source) await writeFile(new URL(p, root), source); };
function block(source, name, contents) {
  const start = `/* ${name}_START */`, end = `/* ${name}_END */`;
  const from = source.indexOf(start), to = source.indexOf(end, from);
  if (from < 0 || to < 0) throw Error('Missing scoped runtime: ' + name);
  return source.slice(0, from) + start + '\n' + contents.trimEnd() + '\n' + source.slice(to);
}
await write('portfolio-works-layout.js', await read('tools/works-layout-runtime.js'));
let html = await read('index.html');
const tag = '<script src="/portfolio-works-layout.js"></script>';
if (!html.includes(tag)) {
  // Read width after the viewport meta, before the first stylesheet paints.
  html = html.replace(/(<meta name="viewport"[^>]*>)/, '$1' + tag);
  if (!html.includes(tag)) throw Error('Viewport meta missing');
  await write('index.html', html);
}
const source = (await read('tools/selected-works-runtime.js')).replace('__PORTFOLIO_WORKS_RESPONSIVE__', JSON.stringify(JSON.parse(await read('assets/works/optimized.json'))));
const contents = 'const worksScrollEnv = t.i(29680).scrollEnv;\nconst worksLoadingGate = t.i(97839);\nconst worksMediaEnv = t.i(23525);\n' + await read('tools/selected-works-rhythm.js') + '\n' + source + '\nfunction h(props){return e.jsx(PortfolioWorksSection,props);}';
const chunk = block(await read('_next/static/chunks/1ed7a178f7acd3df.js'), 'PORTFOLIO_SELECTED_WORKS', contents);
const transition = block(await read('_next/static/chunks/e553ef8ae208a000.js'), 'PORTFOLIO_PAGE_READINESS', await read('tools/page-readiness-runtime.js'));
await transform(chunk, { loader: 'js' }); await transform(transition, { loader: 'js' });
await write('_next/static/chunks/1ed7a178f7acd3df.js', chunk);
await write('_next/static/chunks/e553ef8ae208a000.js', transition);
await build({ entryPoints: [fileURLToPath(new URL('tools/project-entry-runtime.js', root))], outfile: fileURLToPath(new URL('portfolio-project-entry.js', root)), bundle: true, format: 'iife', target: 'es2022' });
console.log('Built phone layout decision, selection and return probes only.');
