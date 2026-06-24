import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 8787),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  turnstileSecret:
    process.env.TURNSTILE_SECRET ?? '0x4AAAAAADhBiHHNm5wkr0Z43RxseAwqOOg',
  payloadEncryptionKey:
    process.env.PAYLOAD_ENCRYPTION_KEY ?? 'allsign-payload-key-v1-change-in-prod',
  gateSessionSecret:
    process.env.GATE_SESSION_SECRET ?? 'allsign-gate-session-secret-v1',
  powSecret:
    process.env.POW_SECRET ??
    process.env.GATE_SESSION_SECRET ??
    'allsign-gate-session-secret-v1',
  powDifficulty: Number(process.env.POW_DIFFICULTY ?? '5'),
  powChallengeTtlMs: Number(process.env.POW_CHALLENGE_TTL_MS ?? '60000'),
} as const;

export const GATE_TOKEN_TTL_MS = 3 * 60 * 1000;
