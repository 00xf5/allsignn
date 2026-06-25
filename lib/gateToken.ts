const DEFAULT_GATE_SECRET = 'allsign-gate-session-secret-v1';

async function hmacSha256Base64(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export function gateSessionSecret(): string {
  return process.env.GATE_SESSION_SECRET ?? DEFAULT_GATE_SECRET;
}

export async function verifyGateToken(
  token: string | null | undefined,
  secret = gateSessionSecret(),
): Promise<boolean> {
  if (!token) return false;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;

  const expected = await hmacSha256Base64(payloadB64, secret);
  if (expected !== signature) return false;

  try {
    const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export const GATE_COOKIE_NAME = 'allsign_gate';

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildGateCookie(token: string, expiresAt: number): string {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  return `${GATE_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearGateCookieHeader(): string {
  return `${GATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Vite app chunks — require gate cookie. Bootstrap chunks stay public. */
export function isPublicAssetPath(pathname: string): boolean {
  const file = pathname.split('/').pop() ?? '';
  if (!file) return true;
  if (file.startsWith('index-')) return true;
  if (file.startsWith('gate-')) return true;
  if (file.endsWith('.css')) return true;
  return false;
}
