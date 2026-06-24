export const SECURITY_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  turnstileSiteKey:
    import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '0x4AAAAAADhBiA89GlSL9EDX',
  payloadEncryptionKey:
    import.meta.env.VITE_PAYLOAD_ENCRYPTION_KEY ??
    'allsign-payload-key-v1-change-in-prod',
} as const;

export const GATE_SESSION_KEY = 'allsign_gate_session';

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function apiUrl(path: string): string {
  const base = trimTrailingSlash(SECURITY_CONFIG.apiBaseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
