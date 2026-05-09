'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@/types';
import { AuthContext, fetchApi } from '@/hooks/use-auth';
import { ThemeContext } from '@/hooks/use-theme';
import { attemptRefresh, getTokenExpiry } from '@/lib/auth-client';
import SelectionTranslateOverlay from '@/components/ui/SelectionTranslateOverlay';
import { ToastProvider } from '@/components/ui/Toast';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'light');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<User>('/api/users/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Proactive refresh timer: fires at 80% of token lifetime to prevent logouts
  useEffect(() => {
    if (!user) return;
    let timerId: ReturnType<typeof setTimeout>;

    function scheduleRefresh() {
      const expiry = getTokenExpiry();
      if (!expiry) return;

      const delay = (expiry - Date.now()) * 0.8;

      if (delay <= 0) {
        attemptRefresh().then((ok) => { if (ok) scheduleRefresh(); });
        return;
      }

      timerId = setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          const onVisible = () => {
            document.removeEventListener('visibilitychange', onVisible);
            attemptRefresh().then((ok) => { if (ok) scheduleRefresh(); });
          };
          document.addEventListener('visibilitychange', onVisible);
          return;
        }
        attemptRefresh().then((ok) => { if (ok) scheduleRefresh(); });
      }, delay);
    }

    scheduleRefresh();
    return () => clearTimeout(timerId);
  }, [user]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const res = await fetchApi<{ user: User }>('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(res.user);
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    const res = await fetchApi<{ user: User }>('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(res.user);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await fetchApi('/api/auth/sign-out', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((u: User) => setUser(u), []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signUp: handleSignUp, signOut: handleSignOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
            <SelectionTranslateOverlay />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
