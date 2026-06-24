import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.ts';
import gateRouter from './routes/gate.ts';
import loginRouter from './routes/login.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'authorization, content-type, x-access-token',
  );
  next();
});

app.options('*', (_req, res) => {
  res.sendStatus(204);
});

const mountApi = (basePath: string) => {
  app.use(`${basePath}/gate`, gateRouter);
  app.use(`${basePath}/login`, loginRouter);
};

mountApi('/api');
mountApi('/functions/v1');

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'allsign-api' });
});

if (env.nodeEnv === 'production') {
  const distDir = path.join(rootDir, 'dist');
  app.use(express.static(distDir));

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

app.listen(env.port, () => {
  console.log(`Allsign API listening on http://localhost:${env.port}`);
  if (env.nodeEnv === 'production') {
    console.log('Serving frontend from /dist');
  }
});
