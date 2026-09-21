import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Защита служебных разделов:
 *  /admin/** — только ADMIN
 *  /owner/** — только OWNER (админу нужен /admin)
 *  /login    — если уже авторизован, редирект в свой раздел
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname, search } = req.nextUrl;

  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL(token.role === 'ADMIN' ? '/admin' : '/owner', req.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminArea = pathname.startsWith('/admin');
  const isOwnerArea = pathname.startsWith('/owner');

  if (isAdminArea && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(token.role === 'OWNER' ? '/owner' : '/login', req.url));
  }
  if (isOwnerArea && token.role !== 'OWNER') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/login'],
};
