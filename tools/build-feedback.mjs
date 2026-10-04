import { build } from 'esbuild';
await build({
  entryPoints: ['tools/feedback.jsx'],
  outfile: 'dev-tools/feedback.js',
  bundle: true,
  minify: true,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'linked',
});
