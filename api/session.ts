import {
  buildGateCookie,
  clearGateCookieHeader,
  verifyGateToken,
} from '../lib/gateToken';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method === 'DELETE') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearGateCookieHeader(),
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { accessToken?: string; expiresAt?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { accessToken, expiresAt } = body;
  if (!accessToken || typeof expiresAt !== 'number') {
    return new Response(JSON.stringify({ ok: false, error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (expiresAt <= Date.now()) {
    return new Response(JSON.stringify({ ok: false, error: 'Token expired' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!(await verifyGateToken(accessToken))) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildGateCookie(accessToken, expiresAt),
    },
  });
}
