import { GATE_SESSION_KEY } from '../config/security';
import type { GeoInfo } from './geoip';

export interface GateSession {
  accessToken: string;
  expiresAt: number;
  geo?: GeoInfo;
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

/** Resolved visitor IP + geo (from gate and/or login). Use for targeted content. */
export function getVisitorGeo(): GeoInfo | null {
  const geo = getGateSession()?.geo;
  return geo && Object.keys(geo).length > 0 ? geo : null;
}

export function saveVisitorGeo(geo: GeoInfo): void {
  const session = getGateSession();
  if (!session) return;
  saveGateSession({ ...session, geo: { ...session.geo, ...geo } });
}
