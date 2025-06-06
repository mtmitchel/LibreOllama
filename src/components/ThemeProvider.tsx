import React, { useEffect } from 'react';
import { ThemeContext, useThemeDetection, useStoredTheme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useStoredTheme();
  const systemTheme = useThemeDetection();
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  }, [effectiveTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, systemTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
