import { mkdirSync } from 'node:fs';
import esbuild from 'esbuild';

mkdirSync('server-dist', { recursive: true });

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'server-dist/index.mjs',
  packages: 'external',
  logLevel: 'info',
});

console.log('[build:server] Wrote server-dist/index.mjs');
