import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/server/session';

// Optimistic gate for the admin area; server actions and routes re-check the session.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (pathname.startsWith('/api/admin')) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.next();
  }

  // The login page itself decides whether to skip ahead: a token can be valid
  // while its account no longer exists, and bouncing it here would loop.
  if (pathname === '/admin/login') return NextResponse.next();

  if (!session) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
