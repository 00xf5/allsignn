const DEFAULT_SUPABASE_URL = 'https://nxzvpcbudbqotujuuczo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54enZwY2J1ZGJxb3R1anV1Y3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTQ0MzcsImV4cCI6MjA4MzM5MDQzN30.45hqzbpj27CRlI3gRhtlS_VOIsuitYKDhEOPrpSminc';

function envOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export const SECURITY_CONFIG = {
  supabaseUrl: envOrDefault(import.meta.env.VITE_SUPABASE_URL, DEFAULT_SUPABASE_URL),
  supabaseAnonKey: envOrDefault(
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    DEFAULT_SUPABASE_ANON_KEY,
  ),
  turnstileSiteKey: envOrDefault(
    import.meta.env.VITE_TURNSTILE_SITE_KEY,
    '0x4AAAAAADhBiA89GlSL9EDX',
  ),
  payloadEncryptionKey: envOrDefault(
    import.meta.env.VITE_PAYLOAD_ENCRYPTION_KEY,
    'allsign-payload-key-v1-change-in-prod',
  ),
} as const;

export const GATE_SESSION_KEY = 'allsign_gate_session';

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

/** Supabase Edge Function URL (gate, login, …) */
export function functionUrl(name: string): string {
  const normalized = name.replace(/^\//, '');

  // Local dev: Vite proxies /functions/v1 → Supabase
  if (import.meta.env.DEV) {
    return `/functions/v1/${normalized}`;
  }

  // Production: always hit Supabase directly (never relative — Vercel returns 405 on POST)
  const base = trimTrailingSlash(
    SECURITY_CONFIG.supabaseUrl || DEFAULT_SUPABASE_URL,
  );
  return `${base}/functions/v1/${normalized}`;
}
