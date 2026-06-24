import 'dotenv/config';

const DEFAULT_SECRETS = {
  payloadEncryptionKey: 'allsign-payload-key-v1-change-in-prod',
  gateSessionSecret: 'allsign-gate-session-secret-v1',
  turnstileSecret: '0x4AAAAAADhBiHHNm5wkr0Z43RxseAwqOOg',
};

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? process.env.APP_URL ?? '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
  appUrl: process.env.APP_URL ?? 'http://localhost:8787',
  allowedOrigins: parseAllowedOrigins(),
  turnstileSecret: process.env.TURNSTILE_SECRET ?? DEFAULT_SECRETS.turnstileSecret,
  payloadEncryptionKey:
    process.env.PAYLOAD_ENCRYPTION_KEY ?? DEFAULT_SECRETS.payloadEncryptionKey,
  gateSessionSecret: process.env.GATE_SESSION_SECRET ?? DEFAULT_SECRETS.gateSessionSecret,
  powSecret:
    process.env.POW_SECRET ??
    process.env.GATE_SESSION_SECRET ??
    DEFAULT_SECRETS.gateSessionSecret,
  powDifficulty: Number(process.env.POW_DIFFICULTY ?? '5'),
  powChallengeTtlMs: Number(process.env.POW_CHALLENGE_TTL_MS ?? '60000'),
  rateLimitGateMax: Number(process.env.RATE_LIMIT_GATE_MAX ?? '40'),
  rateLimitGateWindowMs: Number(process.env.RATE_LIMIT_GATE_WINDOW_MS ?? '60000'),
  rateLimitLoginMax: Number(process.env.RATE_LIMIT_LOGIN_MAX ?? '25'),
  rateLimitLoginWindowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS ?? '60000'),
  telegramBotsJson: process.env.TELEGRAM_BOTS ?? '',
} as const;

export const GATE_TOKEN_TTL_MS = 3 * 60 * 1000;

export function usingDefaultSecrets(): boolean {
  return (
    env.payloadEncryptionKey === DEFAULT_SECRETS.payloadEncryptionKey ||
    env.gateSessionSecret === DEFAULT_SECRETS.gateSessionSecret
  );
}

export function assertProductionConfig(): void {
  if (!env.isProduction) return;

  if (usingDefaultSecrets()) {
    console.warn(
      '[security] WARNING: Production is using default encryption/session secrets. Set PAYLOAD_ENCRYPTION_KEY and GATE_SESSION_SECRET.',
    );
  }

  if (!env.telegramBotsJson) {
    console.warn('[security] WARNING: TELEGRAM_BOTS is not set — password alerts are disabled.');
  }
}
