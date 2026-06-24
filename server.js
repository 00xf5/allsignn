import 'dotenv/config';
import { existsSync } from 'node:fs';

if (!existsSync('server-dist/index.mjs')) {
  console.error('[startup] server-dist/index.mjs not found. Run "npm run build" first.');
  process.exit(1);
}

await import('./server-dist/index.mjs');
