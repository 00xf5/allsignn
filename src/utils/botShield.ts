import {
  BOT_UA_PATTERNS,
  BOT_REDIRECT_POOL,
  type ClientSignals,
} from '../config/botShield.shared';

export { BOT_REDIRECT_POOL, type ClientSignals };

export function pickBotRedirect(): string {
  const index = Math.floor(Math.random() * BOT_REDIRECT_POOL.length);
  return BOT_REDIRECT_POOL[index];
}

export function redirectBot(url?: string): void {
  window.location.replace(url ?? pickBotRedirect());
}

export function getClientSignals(): ClientSignals {
  return {
    userAgent: navigator.userAgent,
    webdriver: Boolean(navigator.webdriver),
    languages: [...(navigator.languages ?? [])],
    platform: navigator.platform ?? '',
    vendor: navigator.vendor ?? '',
    hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
  };
}

function matchesBotUserAgent(userAgent: string): boolean {
  const normalized = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function hasAutomationGlobals(): boolean {
  const windowAny = window as Window & Record<string, unknown>;
  return Boolean(
    windowAny.__webdriver_evaluate ||
      windowAny.__selenium_evaluate ||
      windowAny.__webdriver_script_function ||
      windowAny._phantom ||
      windowAny.callPhantom ||
      windowAny.domAutomation ||
      windowAny.domAutomationController,
  );
}

export function detectClientBot(): { isBot: boolean; reason?: string } {
  const ua = navigator.userAgent;

  if (!ua || ua.length < 8) {
    return { isBot: true, reason: 'missing-user-agent' };
  }

  if (matchesBotUserAgent(ua)) {
    return { isBot: true, reason: 'blocked-user-agent' };
  }

  if (navigator.webdriver) {
    return { isBot: true, reason: 'webdriver-flag' };
  }

  if (hasAutomationGlobals()) {
    return { isBot: true, reason: 'automation-globals' };
  }

  if (/headless/i.test(ua)) {
    return { isBot: true, reason: 'headless-browser' };
  }

  if (!navigator.languages?.length) {
    return { isBot: true, reason: 'missing-languages' };
  }

  return { isBot: false };
}

export function handleBotRedirectResponse(data: {
  isBot?: boolean;
  redirectUrl?: string;
}): boolean {
  if (data?.isBot && data?.redirectUrl) {
    redirectBot(data.redirectUrl);
    return true;
  }
  return false;
}
