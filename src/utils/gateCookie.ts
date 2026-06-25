export async function syncGateCookie(
  accessToken: string,
  expiresAt: number,
): Promise<boolean> {
  try {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ accessToken, expiresAt }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function clearGateCookie(): Promise<void> {
  try {
    await fetch('/api/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {
    // Ignore — cookie may already be gone.
  }
}

/** In local Vite dev there is no /api/session; allow the app to load anyway. */
export function allowWithoutEdgeCookie(): boolean {
  return import.meta.env.DEV;
}
