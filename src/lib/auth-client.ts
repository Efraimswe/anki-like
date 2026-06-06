export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/sign-')) {
    window.location.replace('/sign-in');
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(body.message || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
