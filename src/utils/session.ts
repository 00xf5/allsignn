import { GATE_SESSION_KEY } from '../config/security';

interface GateSession {
  accessToken: string;
  expiresAt: number;
}

export function getGateSession(): GateSession | null {
  const raw = sessionStorage.getItem(GATE_SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as GateSession;
    if (!session.accessToken || !session.expiresAt) return null;
    if (session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(GATE_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(GATE_SESSION_KEY);
    return null;
  }
}

export function saveGateSession(session: GateSession): void {
  sessionStorage.setItem(GATE_SESSION_KEY, JSON.stringify(session));
}

export function clearGateSession(): void {
  sessionStorage.removeItem(GATE_SESSION_KEY);
}

export function getAccessToken(): string | null {
  return getGateSession()?.accessToken ?? null;
}
