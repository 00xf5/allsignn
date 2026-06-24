import type { Request, Response } from 'express';

export const BOT_REDIRECT_POOL = [
  'https://www.amazon.com/',
  'https://www.cloudflare.com/',
  'https://www.arsenal.com/',
  'https://www.temu.com/',
  'https://www.ebay.com/',
  'https://www.alibaba.com/',
  'https://www.target.com/',
  'https://www.walmart.com/',
];

/** Known crawler / automation user-agent tokens (specific — avoids false positives). */
export const BOT_UA_PATTERNS = [
  'googlebot',
  'google-inspectiontool',
  'adsbot-google',
  'mediapartners-google',
  'apis-google',
  'feedfetcher-google',
  'bingbot',
  'bingpreview',
  'msnbot',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'rogerbot',
  'scrapy/',
  'curl/',
  'wget/',
  'python-requests',
  'python-urllib',
  'httpx/',
  'go-http-client',
  'headlesschrome',
  'phantomjs',
  'selenium',
  'puppeteer',
  'playwright',
  'bytespider',
  'meta-externalagent',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'anthropic-ai',
  'archive.org_bot',
  'ia_archiver',
  'discordbot',
  'telegrambot',
  'pinterestbot',
  'uptimerobot',
  'postman',
  'insomnia',
  'axios/',
  'node-fetch',
  'libwww-perl',
  'okhttp',
];

export interface ClientSignals {
  userAgent: string;
  webdriver: boolean;
  languages: string[];
  platform: string;
  vendor: string;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  timezone: string;
}

function headerValue(req: Request, name: string): string | null {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function pickBotRedirect(): string {
  const index = Math.floor(Math.random() * BOT_REDIRECT_POOL.length);
  return BOT_REDIRECT_POOL[index];
}

export function matchesBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 8) return false;
  const normalized = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function evaluateBotSignals(
  req: Request,
  clientSignals?: Partial<ClientSignals> | null,
): { isBot: boolean; reason?: string } {
  const headerUa = headerValue(req, 'user-agent');
  const clientUa = clientSignals?.userAgent?.trim() || null;
  const effectiveUa = headerUa || clientUa;

  if (matchesBotUserAgent(headerUa) || matchesBotUserAgent(clientUa)) {
    return { isBot: true, reason: 'blocked-user-agent' };
  }

  if (clientSignals?.webdriver) {
    return { isBot: true, reason: 'webdriver-flag' };
  }

  if (clientSignals && !clientSignals.languages?.length) {
    return { isBot: true, reason: 'missing-languages' };
  }

  // Raw script hits without browser signals (curl, etc.)
  if (!clientSignals) {
    if (!effectiveUa) {
      return { isBot: true, reason: 'missing-user-agent' };
    }
    const accept = headerValue(req, 'accept');
    if (!accept || accept === '*/*') {
      return { isBot: true, reason: 'suspicious-accept-header' };
    }
  }

  return { isBot: false };
}

export function sendBotRedirect(res: Response, reason?: string): void {
  res.status(403).json({
    success: false,
    isBot: true,
    redirectUrl: pickBotRedirect(),
    reason,
  });
}
