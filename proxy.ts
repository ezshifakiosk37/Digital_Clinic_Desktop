import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // 1. If anyone hits "/", decide where to send them based on their login status
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // 2. Protect other routes
  const isGuestOnly = pathname === '/sign-in';

  if (!token && !isGuestOnly) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      await jwtVerify(token, secret);
      
      // If logged in, don't let them go to sign-in
      if (isGuestOnly) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      const response = NextResponse.redirect(new URL('/sign-in', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
