import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertProductionConfig, env } from './config/env.ts';
import { corsMiddleware } from './middleware/cors.ts';
import { securityHeaders } from './middleware/securityHeaders.ts';
import gateRouter from './routes/gate.ts';
import loginRouter from './routes/login.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

assertProductionConfig();

const app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '256kb', strict: true }));

const mountApi = (basePath: string) => {
  app.use(`${basePath}/gate`, gateRouter);
  app.use(`${basePath}/login`, loginRouter);
};

mountApi('/api');
mountApi('/functions/v1');

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'allsign-api', env: env.nodeEnv });
});

if (env.isProduction) {
  const distDir = path.join(rootDir, 'dist');
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/functions/v1')) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(env.port, env.host, () => {
  console.log(`Allsign  listening on http://${env.host}:${env.port} (${env.nodeEnv})`);
  if (env.isProduction) {
    console.log('Serving frontend from /dist');
  }
});
