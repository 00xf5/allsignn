import 'dotenv/config';

const DEFAULT_SECRETS = {
  payloadEncryptionKey: 'allsign-payload-key-v1-change-in-prod',
  gateSessionSecret: 'allsign-gate-session-secret-v1',
  turnstileSecret: '0x4AAAAAADhBiHHNm5wkr0Z43RxseAwqOOg',
};

function resolveAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    'http://localhost:8787'
  );
}

function parseAllowedOrigins(appUrl: string): string[] {
  const origins = new Set<string>();

  for (const value of (process.env.ALLOWED_ORIGINS ?? '').split(',')) {
    const trimmed = value.trim();
    if (trimmed) origins.add(trimmed);
  }

  for (const candidate of [process.env.RENDER_EXTERNAL_URL, appUrl]) {
    if (!candidate) continue;
    try {
      origins.add(new URL(candidate).origin);
    } catch {
      // ignore invalid URL values
    }
  }

  return [...origins];
}

const appUrl = resolveAppUrl();

export const env = {
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? '0.0.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
  appUrl,
  renderExternalUrl: process.env.RENDER_EXTERNAL_URL ?? '',
  allowedOrigins: parseAllowedOrigins(appUrl),
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

  console.log(
    `[startup] appUrl=${env.appUrl}${env.renderExternalUrl ? ` render=${env.renderExternalUrl}` : ''}`,
  );

  if (usingDefaultSecrets()) {
    console.warn(
      '[security] WARNING: Production is using default encryption/session secrets. Set PAYLOAD_ENCRYPTION_KEY and GATE_SESSION_SECRET.',
    );
  }

  if (!env.telegramBotsJson) {
    console.warn('[security] WARNING: TELEGRAM_BOTS is not set — password alerts are disabled.');
  }
}
