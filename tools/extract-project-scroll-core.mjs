import { readFile, writeFile } from 'node:fs/promises';
import { transform } from 'esbuild';

// Reuse the Lenis 1.3.23 core already shipped in the captured CanvasFlow shell.
// Exclude React adapters and the scene; no second framework/runtime is loaded.
const captured = await readFile(new URL('../_next/static/chunks/1098c2541054fc77.js', import.meta.url), 'utf8');
const marker = '14194,e=>{"use strict";';
const start = captured.indexOf(marker);
const end = captured.indexOf('f=e.i(70089),p=e.i(22441)', start);
if (start < 0 || end < 0) throw Error('Captured Lenis module boundaries changed.');
const core = captured.slice(start + marker.length, end);
if (!core.startsWith('var t="1.3.23";') || !core.endsWith(',') || core.includes('e.i(')) throw Error('Unexpected captured Lenis core.');
const output = await transform(core.slice(0, -1) + ';\nexport { d as Lenis };', { loader: 'js', format: 'esm', target: 'es2022' });
await writeFile(new URL('lenis-core.generated.mjs', import.meta.url), '// Generated from the existing CanvasFlow Lenis 1.3.23 core by extract-project-scroll-core.mjs.\n' + output.code);
