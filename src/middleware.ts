import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessToken, type TokenPayload } from './lib/auth';

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up'];
const API_PUBLIC_PATHS = ['/api/auth/sign-in', '/api/auth/sign-up', '/api/auth/refresh'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith('/api/auth/'));
}

function isOnboardingPath(pathname: string): boolean {
  return pathname.startsWith('/onboarding');
}

function buildPageResponse(request: NextRequest, payload: TokenPayload): NextResponse {
  if (isOnboardingPath(request.nextUrl.pathname) && payload.onboardingCompleted) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (!isOnboardingPath(request.nextUrl.pathname) && !payload.onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

async function tryRefresh(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) return null;
  try {
    const res = await fetch(new URL('/api/auth/refresh', request.url), {
      method: 'POST',
      headers: { Cookie: `refresh_token=${refreshToken}` },
    });
    if (!res.ok) return null;
    const setCookies = res.headers.getSetCookie();
    const accessCookie = setCookies.find((c) => c.startsWith('access_token='));
    const newToken = accessCookie?.split(';')[0].slice('access_token='.length);
    const payload = newToken ? await verifyAccessToken(newToken) : null;
    return payload ? { payload, setCookies } : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // Public paths and static assets bypass auth
  if (isPublicPath(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // API routes handling
  if (pathname.startsWith('/api/')) {
    if (API_PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!payload.onboardingCompleted && !pathname.startsWith('/api/onboarding/') && !pathname.startsWith('/api/dev/')) {
      return NextResponse.json({ error: 'Onboarding incomplete' }, { status: 403 });
    }

    return NextResponse.next();
  }

  // Page routes handling
  const payload = token ? await verifyAccessToken(token) : null;

  if (payload) {
    return buildPageResponse(request, payload);
  }

  const refreshed = await tryRefresh(request);
  if (refreshed) {
    const response = buildPageResponse(request, refreshed.payload);
    refreshed.setCookies.forEach((c) => response.headers.append('Set-Cookie', c));
    return response;
  }

  return NextResponse.redirect(new URL('/sign-in', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/|.*\\.png$).*)'],
};
