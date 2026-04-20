import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessToken } from './lib/auth';

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up'];
const ONBOARDING_PATHS = ['/onboarding'];
const API_PUBLIC_PATHS = ['/api/auth/sign-in', '/api/auth/sign-up', '/api/auth/refresh'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith('/api/auth/'));
}

function isOnboardingPath(pathname: string): boolean {
  return pathname.startsWith('/onboarding');
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

    // Verify token for protected API routes
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check onboarding completion for protected API routes
    if (!payload.onboardingCompleted && !pathname.startsWith('/api/onboarding/') && !pathname.startsWith('/api/dev/')) {
      return NextResponse.json({ error: 'Onboarding incomplete' }, { status: 403 });
    }

    return NextResponse.next();
  }

  // Page routes handling
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Onboarding path: redirect to dashboard if already completed
  if (isOnboardingPath(pathname) && payload.onboardingCompleted) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protected path: redirect to onboarding if not completed
  if (!isOnboardingPath(pathname) && !payload.onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/|.*\\.png$).*)'],
};
