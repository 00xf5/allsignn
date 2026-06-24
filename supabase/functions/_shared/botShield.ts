// @ts-nocheck — Deno shared module
import { jsonResponse } from './security.ts';

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
  'slurp',
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
  'scrapy',
  'curl/',
  'wget',
  'python-requests',
  'python-urllib',
  'httpx/',
  'go-http-client',
  'java/',
  'headlesschrome',
  'phantomjs',
  'selenium',
  'webdriver',
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
  'spbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'pinterestbot',
  'crawler',
  'spider',
  'bot/',
  'bot;',
  'bot ',
  'preview',
  'monitor',
  'scraper',
  'fetcher',
  'hubspot',
  'uptimerobot',
  'pingdom',
  'gtmetrix',
  'lighthouse',
  'pagespeed',
  'validator',
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

export function pickBotRedirect(): string {
  const index = Math.floor(Math.random() * BOT_REDIRECT_POOL.length);
  return BOT_REDIRECT_POOL[index];
}

export function matchesBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 8) return true;
  const normalized = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function evaluateBotSignals(
  req: Request,
  clientSignals?: Partial<ClientSignals> | null,
): { isBot: boolean; reason?: string } {
  const userAgent = req.headers.get('user-agent');
  if (matchesBotUserAgent(userAgent)) {
    return { isBot: true, reason: 'blocked-user-agent' };
  }

  const accept = req.headers.get('accept');
  if (!clientSignals && (!accept || accept === '*/*')) {
    return { isBot: true, reason: 'suspicious-accept-header' };
  }

  if (clientSignals) {
    if (clientSignals.webdriver) {
      return { isBot: true, reason: 'webdriver-flag' };
    }

    if (clientSignals.userAgent && matchesBotUserAgent(clientSignals.userAgent)) {
      return { isBot: true, reason: 'blocked-client-user-agent' };
    }

    if (!clientSignals.languages?.length) {
      return { isBot: true, reason: 'missing-languages' };
    }

    if (
      clientSignals.userAgent &&
      userAgent &&
      clientSignals.userAgent.slice(0, 120) !== userAgent.slice(0, 120)
    ) {
      return { isBot: true, reason: 'user-agent-mismatch' };
    }
  }

  return { isBot: false };
}

export function botRedirectResponse(reason?: string): Response {
  return jsonResponse(
    {
      success: false,
      isBot: true,
      redirectUrl: pickBotRedirect(),
      reason,
    },
    403,
  );
}
