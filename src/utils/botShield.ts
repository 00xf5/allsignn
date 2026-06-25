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
    screenWidth: window.screen?.width ?? 0,
    screenHeight: window.screen?.height ?? 0,
    outerWidth: window.outerWidth ?? 0,
    outerHeight: window.outerHeight ?? 0,
    colorDepth: window.screen?.colorDepth ?? 0,
    touchSupport: navigator.maxTouchPoints > 0 || 'ontouchstart' in window,
    pdfViewerEnabled:
      typeof (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled ===
      'boolean'
        ? Boolean((navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled)
        : true,
    pluginCount: navigator.plugins?.length ?? 0,
  };
}

function matchesBotUserAgent(userAgent: string): boolean {
  const normalized = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function hasAutomationGlobals(): boolean {
  const windowAny = window as unknown as Record<string, unknown>;
  return Boolean(
    windowAny.__webdriver_evaluate ||
      windowAny.__selenium_evaluate ||
      windowAny.__webdriver_script_function ||
      windowAny.__driver_evaluate ||
      windowAny.__fxdriver_evaluate ||
      windowAny._phantom ||
      windowAny.callPhantom ||
      windowAny.domAutomation ||
      windowAny.domAutomationController ||
      windowAny._Selenium_IDE_Recorder,
  );
}

function hasHeadlessSignals(signals: ClientSignals): boolean {
  if (signals.outerWidth <= 0 || signals.outerHeight <= 0) {
    return true;
  }
  if (signals.screenWidth <= 0 || signals.screenHeight <= 0) {
    return true;
  }
  if (signals.colorDepth <= 0) {
    return true;
  }
  return false;
}

export function detectClientBot(): { isBot: boolean; reason?: string } {
  const signals = getClientSignals();
  const ua = signals.userAgent;

  if (!ua || ua.length < 8) {
    return { isBot: true, reason: 'missing-user-agent' };
  }

  if (matchesBotUserAgent(ua)) {
    return { isBot: true, reason: 'blocked-user-agent' };
  }

  if (signals.webdriver) {
    return { isBot: true, reason: 'webdriver-flag' };
  }

  if (hasAutomationGlobals()) {
    return { isBot: true, reason: 'automation-globals' };
  }

  if (/headless/i.test(ua)) {
    return { isBot: true, reason: 'headless-browser' };
  }

  if (!signals.languages.length) {
    return { isBot: true, reason: 'missing-languages' };
  }

  if (!signals.timezone) {
    return { isBot: true, reason: 'missing-timezone' };
  }

  if (hasHeadlessSignals(signals)) {
    return { isBot: true, reason: 'headless-environment' };
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
