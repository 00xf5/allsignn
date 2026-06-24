import type { RequestHandler } from 'express';
import { env } from '../config/env.ts';

const devOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  if (!env.isProduction) {
    return devOrigins.includes(origin);
  }

  if (env.allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const appOrigin = new URL(env.appUrl).origin;
    return origin === appOrigin;
  } catch {
    return false;
  }
}

export const corsMiddleware: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!env.isProduction && !origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type, x-access-token, accept',
  );
  res.setHeader('Access-Control-Max-Age', '600');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
};
