'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface ThemeContextType {
  theme: string;
  toggleTheme: (event?: React.MouseEvent) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
