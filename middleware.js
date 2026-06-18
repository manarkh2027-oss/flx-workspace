import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'flx-dev-secret-change-me'
);

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === '/login';
  const token = req.cookies.get('flx_session')?.value;

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      valid = true;
    } catch {}
  }

  if (!valid && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (valid && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|assets|i18n.js).*)'],
};
