// Base fetch client used by every API module.
// Reads NEXT_PUBLIC_API_URL which should include the trailing /api segment.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface CallOptions {
  method?:    Method;
  body?:      Record<string, unknown> | FormData;
  auth?:      boolean;   // default true
  multipart?: boolean;   // true = don't set Content-Type (browser sets boundary)
}

export async function call<T = unknown>(
  path: string,
  opts: CallOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (auth) {
    const { getToken } = await import('@/lib/auth/tokenStorage');
    const tok = getToken();
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
  }

  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
    // no Content-Type — browser sets multipart boundary
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  // Caching is intentionally disabled — every request hits the network fresh.
  const res = await fetch(`${BASE}/${path.replace(/^\/+/, '')}`, {
    method,
    headers,
    body: requestBody,
    cache: 'no-store',
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const msg =
      (payload as { message?: string })?.message ??
      `Request failed with status ${res.status}`;

    // 401 — token expired or invalid: clear session and bounce to sign-in.
    // Skip this for unauthenticated requests (auth: false) — a 401 on login
    // means wrong credentials, not an expired session.
    if (res.status === 401 && auth) {
      const { clearSession } = await import('@/lib/auth/tokenStorage');
      clearSession();
      if (typeof window !== 'undefined') {
        const isDriverPath = window.location.pathname.startsWith('/driver');
        window.location.replace(isDriverPath ? '/driver/sign-in' : '/sign-in');
      }
    }

    throw new ApiError(res.status, msg, payload);
  }

  return payload as T;
}
