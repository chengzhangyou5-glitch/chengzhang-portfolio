import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

export async function buildProjectContact() {
  const root = new URL('../', import.meta.url);
  // Read the canonical component verbatim. No forked dialog body or new data.
  const source = await readFile(new URL('contact-runtime.js', import.meta.url), 'utf8');
  const adapter = await readFile(new URL('project-contact-adapter.js', import.meta.url), 'utf8');
  await build({ stdin: { contents: `import * as i from 'react';import * as e from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';\n${source}\n${adapter}`, resolveDir: fileURLToPath(root), sourcefile: 'project-contact-composition.js' }, bundle: true, format: 'esm', target: 'es2022', minify: true, outfile: fileURLToPath(new URL('portfolio-project-contact.js', root)) });
  await build({ entryPoints: [fileURLToPath(new URL('project-contact-entry.js', import.meta.url))], bundle: true, format: 'iife', target: 'es2022', outfile: fileURLToPath(new URL('portfolio-project-contact-entry.js', root)) });
}
