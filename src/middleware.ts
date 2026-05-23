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

// Paths that never require a token — always let through
const PUBLIC = [
  '/',
  '/sign-in',
  '/sign-up',
  '/driver/sign-in',
  '/driver/sign-up',
  '/forgot-password',
  '/reset-password',
];

function isPublic(pathname: string): boolean {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Handle both base64 and base64url
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(b64, 'base64').toString()) as {
      role?: string;
      exp?: number;
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = detectLocale(request);

  // Inject locale header so next-intl server functions can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale);

  const base = NextResponse.next({ request: { headers: requestHeaders } });
  base.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });

  // Skip Next internals, API, and static files (matcher also filters these)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|ttf|map)$/.test(pathname)
  ) {
    return base;
  }

  // Public paths — no auth check
  if (isPublic(pathname)) return base;

  // Protected route — token must be present
  const token = request.cookies.get('commuter_token')?.value;
  if (!token || token === 'undefined' || token === 'null') {
    const isDriverPath = pathname.startsWith('/driver');
    const loginUrl = new URL(isDriverPath ? '/driver/sign-in' : '/sign-in', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Determine role: prefer dedicated cookie, fall back to JWT payload
  const roleCookie = request.cookies.get('commuter_role')?.value;
  let role: string | undefined =
    roleCookie === 'driver' || roleCookie === 'user' ? roleCookie : undefined;

  const payload = decodeJwtPayload(token);

  if (payload) {
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const res = NextResponse.redirect(new URL('/sign-in', request.url));
      res.cookies.delete('commuter_token');
      res.cookies.delete('commuter_role');
      return res;
    }
    if (!role && (payload.role === 'driver' || payload.role === 'user')) {
      role = payload.role;
    }
  }

  // No role determinable → bad session, force clean state
  if (!role) {
    const noRole = NextResponse.redirect(new URL('/', request.url));
    noRole.cookies.delete('commuter_token');
    noRole.cookies.delete('commuter_role');
    return noRole;
  }

  // Role/portal mismatch → clear session and home (avoids redirect loops)
  if (pathname.startsWith('/driver') && role !== 'driver') {
    const wrong = NextResponse.redirect(new URL('/', request.url));
    wrong.cookies.delete('commuter_token');
    wrong.cookies.delete('commuter_role');
    return wrong;
  }
  if (pathname.startsWith('/user') && role !== 'user') {
    const wrong = NextResponse.redirect(new URL('/', request.url));
    wrong.cookies.delete('commuter_token');
    wrong.cookies.delete('commuter_role');
    return wrong;
  }

  return base;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|map)).*)',
  ],
};
