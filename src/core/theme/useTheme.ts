/**
 * Design System Theme Hook
 * 
 * React hook for consuming and managing theme state
 * Provides reactive theme updates throughout the application
 */

import { useState, useEffect } from 'react';
import { 
  themeManager, 
  type Theme, 
  type ThemeConfig,
  setTheme as setThemeAction,
  toggleTheme as toggleThemeAction,
  toggleHighContrast as toggleHighContrastAction
} from './themeManager';

/**
 * Theme hook return type
 */
export interface UseThemeReturn {
  // Current state
  theme: Theme;
  resolvedTheme: 'light' | 'dark' | 'light-high-contrast' | 'dark-high-contrast';
  isDarkMode: boolean;
  isHighContrast: boolean;
  systemPreference: 'light' | 'dark';
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleHighContrast: () => void;
  
  // Utilities
  isTheme: (theme: Theme) => boolean;
  isResolvedTheme: (theme: string) => boolean;
}

/**
 * Main theme hook
 * 
 * Provides reactive access to theme state and actions
 */
export function useTheme(): UseThemeReturn {
  const [config, setConfig] = useState<ThemeConfig>(() => themeManager.getConfig());

  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = themeManager.addListener(setConfig);
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const resolvedTheme = themeManager.getResolvedTheme();

  return {
    // Current state
    theme: config.theme,
    resolvedTheme,
    isDarkMode: resolvedTheme.includes('dark'),
    isHighContrast: resolvedTheme.includes('high-contrast'),
    systemPreference: config.systemPreference,
    
    // Actions
    setTheme: setThemeAction,
    toggleTheme: toggleThemeAction,
    toggleHighContrast: toggleHighContrastAction,
    
    // Utilities
    isTheme: (theme: Theme) => config.theme === theme,
    isResolvedTheme: (theme: string) => resolvedTheme === theme,
  };
}

/**
 * Theme selector hook
 * 
 * Returns a value based on the current theme
 * Useful for theme-specific values without full theme state
 */
export function useThemeValue<T>(values: {
  light: T;
  dark: T;
  'light-high-contrast'?: T;
  'dark-high-contrast'?: T;
}): T {
  const { resolvedTheme } = useTheme();
  
  // Use high contrast values if available, otherwise fall back to base themes
  if (resolvedTheme === 'light-high-contrast' && values['light-high-contrast']) {
    return values['light-high-contrast'];
  }
  
  if (resolvedTheme === 'dark-high-contrast' && values['dark-high-contrast']) {
    return values['dark-high-contrast'];
  }
  
  // Fall back to base themes
  return resolvedTheme.includes('dark') ? values.dark : values.light;
}

/**
 * Media query hook for theme-aware responsive design
 * 
 * Combines theme state with media queries
 */
export function useThemeMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);
  
  return matches;
}

/**
 * System preference hook
 * 
 * Tracks system dark mode preference independently
 */
export function useSystemPreference(): {
  systemPreference: 'light' | 'dark';
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
} {
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Color scheme preference
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(colorSchemeQuery.matches ? 'dark' : 'light');
    
    // Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    // High contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(contrastQuery.matches);
    
    // Set up listeners
    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);
    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);
    
    return () => {
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);
  
  return {
    systemPreference,
    prefersReducedMotion,
    prefersHighContrast,
  };
}

/**
 * Color scheme class hook
 * 
 * Returns CSS classes for theme-aware styling
 * Useful for components that need theme-specific classes
 */
export function useThemeClasses(): {
  themeClass: string;
  colorSchemeClass: string;
  contrastClass: string;
  isDarkClass: string;
} {
  const { resolvedTheme, isDarkMode, isHighContrast } = useTheme();
  
  return {
    themeClass: `theme-${resolvedTheme}`,
    colorSchemeClass: isDarkMode ? 'dark' : 'light',
    contrastClass: isHighContrast ? 'high-contrast' : 'normal-contrast',
    isDarkClass: isDarkMode ? 'is-dark' : 'is-light',
  };
}