import { apiUrl, SECURITY_CONFIG } from '../config/security';
import { GATE_TOKEN_TTL_MS } from '../config/botShield.shared';
import { encryptPayload } from './crypto';
import { getAccessToken } from './session';
import {
  getClientSignals,
  handleBotRedirectResponse,
  type ClientSignals,
} from './botShield';
import type { PowSolution } from './pow';

export interface LoginPayload {
  email: string;
  provider?: string;
  password: string;
  turnstileToken?: string | null;
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

function buildSecureHeaders(): Record<string, string> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Access verification required. Please refresh the page.');
  }

  return {
    ...jsonHeaders,
    'X-Access-Token': accessToken,
  };
}

async function inspectBotResponse(response: Response): Promise<Response> {
  try {
    const data = await response.clone().json();
    handleBotRedirectResponse(data);
  } catch {
    // Non-JSON responses are ignored.
  }
  return response;
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
    const response = await fetch(apiUrl('/api/gate'), {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'challenge',
        clientSignals: getClientSignals(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? `Security service unavailable (${response.status}).`);
    }
    handleBotRedirectResponse(data);
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'Connection timed out. Ensure the API is running (npm run dev) and try again.',
      );
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
  error?: string;
  isBot?: boolean;
  redirectUrl?: string;
}> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(apiUrl('/api/gate'), {
      method: 'POST',
      headers: {
        ...jsonHeaders,
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

    if (!response.ok) {
      throw new Error(data.error ?? `Verification failed (${response.status}). Please try again.`);
    }

    handleBotRedirectResponse(data);
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

  const response = await fetch(apiUrl('/api/login'), {
    method: 'POST',
    headers: buildSecureHeaders(),
    body: JSON.stringify(encryptedBody),
  });

  return inspectBotResponse(response);
}

export { GATE_TOKEN_TTL_MS, SECURITY_CONFIG };
