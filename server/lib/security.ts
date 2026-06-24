import type { Request } from 'express';
import { env, GATE_TOKEN_TTL_MS } from '../config/env.ts';

async function deriveAesKey(passphrase: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(passphrase),
  );
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['decrypt']);
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export async function verifyTurnstile(token: string, remoteIp?: string | null): Promise<boolean> {
  const params = new URLSearchParams({
    secret: env.turnstileSecret,
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
  if (!outcome.success && env.nodeEnv !== 'production') {
    console.warn('[turnstile] verification failed:', outcome['error-codes'] ?? outcome);
  }
  return Boolean(outcome.success);
}

export async function decryptPayload(envelope: {
  iv: string;
  data: string;
}): Promise<Record<string, unknown>> {
  const key = await deriveAesKey(env.payloadEncryptionKey);
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
  const signature = await hmacSha256Base64(payloadB64, env.gateSessionSecret);

  return {
    accessToken: `${payloadB64}.${signature}`,
    expiresAt,
  };
}

export async function verifyGateToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;

  const expected = await hmacSha256Base64(payloadB64, env.gateSessionSecret);
  if (expected !== signature) return false;

  try {
    const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function parseSecureBody(raw: unknown): Promise<Record<string, unknown>> {
  if (
    raw &&
    typeof raw === 'object' &&
    (raw as Record<string, unknown>).encrypted === true &&
    (raw as Record<string, unknown>).iv &&
    (raw as Record<string, unknown>).data
  ) {
    const envelope = raw as { iv: string; data: string };
    return decryptPayload(envelope);
  }

  return (raw ?? {}) as Record<string, unknown>;
}

export function getClientIp(req: Request): string | null {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp) return cfIp;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;

  return req.ip ?? null;
}
