import { GATE_COOKIE_NAME, isPublicAssetPath, readCookie, verifyGateToken } from './lib/gateToken';

export const config = {
  matcher: ['/assets/:path*'],
};

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (!pathname.startsWith('/assets/') || isPublicAssetPath(pathname)) {
    return fetch(request);
  }

  const cookieToken = readCookie(request.headers.get('cookie'), GATE_COOKIE_NAME);
  if (!(await verifyGateToken(cookieToken))) {
    return new Response('Forbidden', { status: 403 });
  }

  return fetch(request);
}
