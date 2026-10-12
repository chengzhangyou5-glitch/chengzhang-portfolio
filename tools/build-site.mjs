import { cp } from 'node:fs/promises';
import { buildProduction } from './build-production.mjs';

// Export the approved main snapshot; do not regenerate page components or PDFs.
const result = await buildProduction();
// Retain the site's existing printed /portfolio entry alongside the five pages.
await cp(new URL('../portfolio/', import.meta.url), new URL('../dist/portfolio/', import.meta.url), { recursive: true });
console.log(JSON.stringify(result, null, 2));
