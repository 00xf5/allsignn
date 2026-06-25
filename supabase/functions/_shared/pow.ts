// @ts-nocheck — Deno shared module
import { jsonResponse } from './security.ts';

const POW_SECRET =
  Deno.env.get('POW_SECRET') ??
  Deno.env.get('GATE_SESSION_SECRET') ??
  'allsign-gate-session-secret-v1';

export const POW_DIFFICULTY = Number(Deno.env.get('POW_DIFFICULTY') ?? '6');
export const POW_CHALLENGE_TTL_MS = Number(Deno.env.get('POW_CHALLENGE_TTL_MS') ?? '60000');
export const POW_MIN_NONCE = 1000;

export interface PowChallengePayload {
  id: string;
  prefix: string;
  difficulty: number;
  exp: number;
}

export interface PowSolution {
  challengeToken: string;
  nonce: number;
  hash: string;
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

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function decodeChallengeToken(token: string): PowChallengePayload | null {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  try {
    const payload = JSON.parse(atob(payloadB64)) as PowChallengePayload;
    if (
      !payload?.id ||
      !payload?.prefix ||
      typeof payload.difficulty !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function issuePowChallenge(): Promise<{
  challengeToken: string;
  prefix: string;
  difficulty: number;
  expiresAt: number;
}> {
  const payload: PowChallengePayload = {
    id: crypto.randomUUID(),
    prefix: randomHex(16),
    difficulty: POW_DIFFICULTY,
    exp: Date.now() + POW_CHALLENGE_TTL_MS,
  };

  const payloadB64 = btoa(JSON.stringify(payload));
  const signature = await hmacSha256Base64(payloadB64, POW_SECRET);

  return {
    challengeToken: `${payloadB64}.${signature}`,
    prefix: payload.prefix,
    difficulty: payload.difficulty,
    expiresAt: payload.exp,
  };
}

export async function verifyPowSolution(
  solution: Partial<PowSolution> | null | undefined,
): Promise<{ valid: boolean; reason?: string }> {
  if (!solution?.challengeToken || typeof solution.nonce !== 'number' || !solution.hash) {
    return { valid: false, reason: 'missing-pow-solution' };
  }

  if (!Number.isInteger(solution.nonce) || solution.nonce < POW_MIN_NONCE) {
    return { valid: false, reason: 'invalid-pow-nonce' };
  }

  const [payloadB64, signature] = solution.challengeToken.split('.');
  if (!payloadB64 || !signature) {
    return { valid: false, reason: 'invalid-challenge-token' };
  }

  const expectedSignature = await hmacSha256Base64(payloadB64, POW_SECRET);
  if (expectedSignature !== signature) {
    return { valid: false, reason: 'challenge-signature-mismatch' };
  }

  const challenge = decodeChallengeToken(solution.challengeToken);
  if (!challenge) {
    return { valid: false, reason: 'invalid-challenge-payload' };
  }

  if (challenge.exp <= Date.now()) {
    return { valid: false, reason: 'challenge-expired' };
  }

  const expectedHash = await sha256Hex(`${challenge.prefix}:${solution.nonce}`);
  if (expectedHash !== solution.hash.toLowerCase()) {
    return { valid: false, reason: 'hash-mismatch' };
  }

  const target = '0'.repeat(challenge.difficulty);
  if (!expectedHash.startsWith(target)) {
    return { valid: false, reason: 'insufficient-work' };
  }

  return { valid: true };
}

export function powChallengeResponse() {
  return issuePowChallenge().then((challenge) =>
    jsonResponse({
      success: true,
      action: 'challenge',
      ...challenge,
    }),
  );
}
