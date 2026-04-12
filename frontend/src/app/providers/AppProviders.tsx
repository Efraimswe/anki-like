import type { ReactNode } from 'react';
import { AuthProvider } from '@/entities/session';
import { ThemeProvider } from '@/shared/lib/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
