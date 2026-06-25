import {
  GATE_COOKIE_NAME,
  isPublicAssetPath,
  readCookie,
  verifyGateToken,
} from './lib/gateToken';

export const config = {
  matcher: ['/assets/:path*'],
};

export default async function middleware(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (!pathname.startsWith('/assets/') || isPublicAssetPath(pathname)) {
    return fetch(request);
  }

  const token = readCookie(request.headers.get('cookie'), GATE_COOKIE_NAME);
  if (!(await verifyGateToken(token))) {
    return new Response('Forbidden', { status: 403 });
  }

  return fetch(request);
}
