'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { AuthContext, fetchApi } from '@/hooks/use-auth';
import { ThemeContext } from '@/hooks/use-theme';
import SelectionTranslateOverlay from '@/components/ui/SelectionTranslateOverlay';

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

  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      );
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
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <SelectionTranslateOverlay />
      </AuthProvider>
    </ThemeProvider>
  );
}
