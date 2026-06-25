const TURNSTILE_SECRET =
  Deno.env.get('TURNSTILE_SECRET') ?? '0x4AAAAAADhBiHHNm5wkr0Z43RxseAwqOOg';
const PAYLOAD_ENCRYPTION_KEY =
  Deno.env.get('PAYLOAD_ENCRYPTION_KEY') ?? 'allsign-payload-key-v1-change-in-prod';
const GATE_SESSION_SECRET =
  Deno.env.get('GATE_SESSION_SECRET') ?? 'allsign-gate-session-secret-v1';

export const GATE_TOKEN_TTL_MS = 15 * 60 * 1000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-access-token',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export function handleOptions(): Response {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

export async function verifyTurnstile(
  token: string,
  remoteIp?: string | null,
): Promise<boolean> {
  const params = new URLSearchParams({
    secret: TURNSTILE_SECRET,
    response: token,
  });
  if (remoteIp) {
    params.set('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const outcome = await response.json();
  return Boolean(outcome.success);
}

async function deriveAesKey(passphrase: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(passphrase),
  );
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['decrypt']);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function decryptPayload(envelope: {
  iv: string;
  data: string;
}): Promise<Record<string, unknown>> {
  const key = await deriveAesKey(PAYLOAD_ENCRYPTION_KEY);
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.data);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

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

export async function issueGateToken(): Promise<{ accessToken: string; expiresAt: number }> {
  const expiresAt = Date.now() + GATE_TOKEN_TTL_MS;
  const payload = JSON.stringify({ exp: expiresAt, n: crypto.randomUUID() });
  const payloadB64 = btoa(payload);
  const signature = await hmacSha256Base64(payloadB64, GATE_SESSION_SECRET);

  return {
    accessToken: `${payloadB64}.${signature}`,
    expiresAt,
  };
}

export async function verifyGateToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;

  const expected = await hmacSha256Base64(payloadB64, GATE_SESSION_SECRET);
  if (expected !== signature) return false;

  try {
    const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function parseSecureBody(req: Request): Promise<Record<string, unknown>> {
  const raw = await req.json();

  if (raw?.encrypted === true && raw?.iv && raw?.data) {
    return decryptPayload({ iv: raw.iv, data: raw.data });
  }

  return raw;
}
