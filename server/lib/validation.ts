const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function sanitizeLoginFields(body: Record<string, unknown>): {
  ok: true;
  email: string;
  password: string;
  provider?: string;
  turnstileToken?: string;
} | { ok: false; error: string } {
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const provider = typeof body.provider === 'string' ? body.provider.trim().slice(0, 32) : undefined;
  const turnstileToken =
    typeof body.turnstileToken === 'string' ? body.turnstileToken.slice(0, 4096) : undefined;

  if (!email || !isValidEmail(email)) {
    return { ok: false, error: 'A valid email address is required.' };
  }

  if (!password || password.length < 3 || password.length > 512) {
    return { ok: false, error: 'Invalid credential payload.' };
  }

  return {
    ok: true,
    email,
    password,
    provider,
    turnstileToken,
  };
}

export function requireClientSignals(body: Record<string, unknown>): boolean {
  const signals = body.clientSignals;
  return Boolean(
    signals &&
      typeof signals === 'object' &&
      typeof (signals as Record<string, unknown>).userAgent === 'string' &&
      Array.isArray((signals as Record<string, unknown>).languages) &&
      (signals as Record<string, unknown>).languages.length > 0,
  );
}
