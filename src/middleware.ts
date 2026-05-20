import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['en', 'ar'] as const;
const DEFAULT_LOCALE = 'en';

function detectLocale(request: NextRequest): string {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && (LOCALES as readonly string[]).includes(cookie)) return cookie;
  const accept = request.headers.get('accept-language') ?? '';
  if (accept.startsWith('ar') || accept.includes(',ar')) return 'ar';
  return DEFAULT_LOCALE;
}

// Routes that NEVER require auth — let through unconditionally
const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/signin',
  '/signup',
  '/driver/sign-in',
  '/driver/sign-up',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/user/request/new',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = detectLocale(request);

  // Inject locale header so next-intl server functions can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale);

  const base = NextResponse.next({ request: { headers: requestHeaders } });
  base.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });

  // Auth entry pages: redirect already-authenticated users to their dashboard
  const AUTH_ENTRY_PATHS = ['/sign-in', '/sign-up', '/driver/sign-in', '/driver/sign-up', '/signin', '/signup'];
  const isAuthEntry = AUTH_ENTRY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isAuthEntry) {
    const existingToken = request.cookies.get('commuter_token')?.value;
    if (existingToken) {
      // Only redirect if we can confirm a valid role — avoids redirect loops
      const roleCookie = request.cookies.get('commuter_role')?.value as 'driver' | 'user' | undefined;
      let confirmedRole: 'driver' | 'user' | undefined = roleCookie;

      if (!confirmedRole) {
        try {
          const parts = existingToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString()
            ) as { role?: 'driver' | 'user'; exp?: number };
            const notExpired = !payload.exp || payload.exp * 1000 > Date.now();
            if (notExpired && (payload.role === 'driver' || payload.role === 'user')) {
              confirmedRole = payload.role;
            }
          }
        } catch {
          // Malformed token — fall through and show the sign-in page
        }
      }

      if (confirmedRole === 'driver') {
        return NextResponse.redirect(new URL('/driver/requests', request.url));
      }
      if (confirmedRole === 'user') {
        return NextResponse.redirect(new URL('/user/my-requests', request.url));
      }
      // Role unknown — fall through and let the user sign in again
    }
  }

  // Always allow public paths — no token check, no redirect loop possible
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isPublic) return base;

  // Check auth token
  const token = request.cookies.get('commuter_token')?.value;
  if (!token) {
    const isDriverPath = pathname.startsWith('/driver');
    const signInUrl = new URL(
      isDriverPath ? '/driver/sign-in' : '/sign-in',
      request.url
    );
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Read role from dedicated cookie first; fall back to JWT payload
  let role: 'driver' | 'user' | undefined =
    request.cookies.get('commuter_role')?.value as 'driver' | 'user' | undefined;

  try {
    // Decode without verification — we only need role + exp for routing
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    ) as { role?: 'driver' | 'user'; exp?: number };

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const expired = NextResponse.redirect(
        new URL(role === 'driver' ? '/driver/sign-in' : '/sign-in', request.url)
      );
      expired.cookies.delete('commuter_token');
      expired.cookies.delete('commuter_role');
      return expired;
    }

    if (!role && payload.role) role = payload.role;
  } catch {
    // Token not a standard JWT — rely on role cookie alone
    if (!role) {
      const malformed = NextResponse.redirect(new URL('/', request.url));
      malformed.cookies.delete('commuter_token');
      return malformed;
    }
  }

  // Enforce role-based path access
  if (pathname.startsWith('/driver') && role !== 'driver') {
    return NextResponse.redirect(new URL('/user/my-requests', request.url));
  }
  if (pathname.startsWith('/user') && role !== 'user') {
    return NextResponse.redirect(new URL('/driver/requests', request.url));
  }

  return base;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|map)).*)',
  ],
};
