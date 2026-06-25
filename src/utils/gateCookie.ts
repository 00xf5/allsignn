import { GATE_COOKIE_NAME } from '../config/botShield.shared';

export function setBrowserGateCookie(accessToken: string, expiresAt: number): void {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${GATE_COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearBrowserGateCookie(): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${GATE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/**
 * Middleware reads Cookie on /assets/app-*.js requests.
 * Always mirror the gate token into document.cookie (Vercel /api/session may be unavailable).
 */
export async function syncGateCookie(
  accessToken: string,
  expiresAt: number,
): Promise<boolean> {
  setBrowserGateCookie(accessToken, expiresAt);

  try {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ accessToken, expiresAt }),
    });
    if (response.ok) {
      return true;
    }
    if (!import.meta.env.DEV && response.status === 403) {
      return false;
    }
  } catch {
    // Fall through — browser cookie / ?gate= query may still work for assets.
  }

  return import.meta.env.DEV || Boolean(accessToken);
}

export async function clearGateCookie(): Promise<void> {
  clearBrowserGateCookie();
  try {
    await fetch('/api/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {
    // Ignore.
  }
}

export function allowWithoutEdgeCookie(): boolean {
  return import.meta.env.DEV;
}
