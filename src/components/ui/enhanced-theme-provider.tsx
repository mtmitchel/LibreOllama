import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ThemeMode = 'dark' | 'light';

interface ThemeCustomization {
  primaryColor?: string;
  accentColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg';
  fontScale?: 'sm' | 'base' | 'lg';
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableCustomization?: boolean;
  customization?: ThemeCustomization;
}

interface ThemeProviderState {
  theme: Theme;
  resolvedTheme: ThemeMode;
  customization: ThemeCustomization;
  setTheme: (theme: Theme) => void;
  setCustomization: (customization: Partial<ThemeCustomization>) => void;
  resetCustomization: () => void;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  customization: {},
  setTheme: () => null,
  setCustomization: () => null,
  resetCustomization: () => null,
};

const EnhancedThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function EnhancedThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'libre-ollama-theme',
  enableCustomization = true,
  customization: initialCustomization = {},
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [customization, setCustomizationState] = useState<ThemeCustomization>(() => {
    if (typeof window === 'undefined') return initialCustomization;
    const stored = localStorage.getItem(`${storageKey}-customization`);
    return stored ? { ...initialCustomization, ...JSON.parse(stored) } : initialCustomization;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ThemeMode>('light');

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
        applyTheme(systemTheme);
      }
    };

    // Set initial resolved theme
    if (theme === 'system') {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
      applyTheme(systemTheme);
    } else {
      setResolvedTheme(theme as ThemeMode);
      applyTheme(theme as ThemeMode);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to document
  const applyTheme = (themeMode: ThemeMode) => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(themeMode);
    
    // Apply customizations as CSS variables
    if (enableCustomization) {
      applyCustomizations();
    }
  };

  // Apply theme customizations
  const applyCustomizations = () => {
    const root = window.document.documentElement;
    
    if (customization.primaryColor) {
      root.style.setProperty('--theme-primary', customization.primaryColor);
    }
    
    if (customization.accentColor) {
      root.style.setProperty('--theme-accent', customization.accentColor);
    }
    
    if (customization.borderRadius) {
      const radiusMap = {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px'
      };
      root.style.setProperty('--theme-radius', radiusMap[customization.borderRadius]);
    }
    
    if (customization.fontScale) {
      const scaleMap = {
        sm: '0.875',
        base: '1',
        lg: '1.125'
      };
      root.style.setProperty('--theme-font-scale', scaleMap[customization.fontScale]);
    }
  };

  // Handle theme change
  const handleSetTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
    
    if (newTheme !== 'system') {
      setResolvedTheme(newTheme as ThemeMode);
      applyTheme(newTheme as ThemeMode);
    }
  };

  // Handle customization change
  const handleSetCustomization = (newCustomization: Partial<ThemeCustomization>) => {
    const updatedCustomization = { ...customization, ...newCustomization };
    setCustomizationState(updatedCustomization);
    
    if (enableCustomization) {
      localStorage.setItem(`${storageKey}-customization`, JSON.stringify(updatedCustomization));
    }
  };

  // Reset customization
  const resetCustomization = () => {
    setCustomizationState({});
    localStorage.removeItem(`${storageKey}-customization`);
    
    // Remove custom CSS variables
    const root = window.document.documentElement;
    root.style.removeProperty('--theme-primary');
    root.style.removeProperty('--theme-accent');
    root.style.removeProperty('--theme-radius');
    root.style.removeProperty('--theme-font-scale');
  };

  const value = {
    theme,
    resolvedTheme,
    customization,
    setTheme: handleSetTheme,
    setCustomization: handleSetCustomization,
    resetCustomization,
  };

  return (
    <EnhancedThemeProviderContext.Provider {...props} value={value}>
      {children}
    </EnhancedThemeProviderContext.Provider>
  );
}

export const useEnhancedTheme = () => {
  const context = useContext(EnhancedThemeProviderContext);

  if (context === undefined) {
    throw new Error('useEnhancedTheme must be used within an EnhancedThemeProvider');
  }

  return context;
};

// Theme customization hook
export const useThemeCustomization = () => {
  const { customization, setCustomization, resetCustomization } = useEnhancedTheme();
  
  return {
    customization,
    setCustomization,
    resetCustomization,
    presets: {
      default: {},
      minimal: {
        borderRadius: 'none' as const,
        fontScale: 'sm' as const
      },
      rounded: {
        borderRadius: 'lg' as const
      },
      large: {
        fontScale: 'lg' as const
      }
    }
  };
};