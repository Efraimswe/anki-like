import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

const publicPaths = ['/sign-in', '/sign-up', '/api/auth/'];

function isPublic(pathname: string) {
  return publicPaths.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths and static assets
  if (isPublic(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // API routes: check Bearer token or cookie
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Page routes: redirect to sign-in if no token
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Access token expired — try inline refresh before redirecting
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      try {
        const refreshUrl = new URL('/api/auth/refresh', request.url);
        const refreshRes = await fetch(refreshUrl, {
          method: 'POST',
          headers: { Cookie: `refresh_token=${refreshToken}` },
        });
        if (refreshRes.ok) {
          const response = NextResponse.next();
          refreshRes.headers.getSetCookie().forEach((cookie) => {
            response.headers.append('Set-Cookie', cookie);
          });
          return response;
        }
      } catch {
        // Refresh fetch failed — fall through to redirect
      }
    }
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
