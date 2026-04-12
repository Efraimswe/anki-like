// Module-level refresh lock — only one concurrent refresh call allowed
let refreshPromise: Promise<boolean> | null = null;

export function getTokenExpiry(): number | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)token_expiry=([^;]+)/);
  return match ? parseInt(match[1], 10) : null;
}

export async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (res.status === 401 && !url.includes('/api/auth/')) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      const retry = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
      });
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(body.message || 'Request failed');
      }
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }

    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/sign-')) {
      window.location.replace('/sign-in');
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(body.message || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
