/**
 * Design System Theme Manager
 * 
 * Centralized theme management for the Asana-inspired DLS
 * Handles theme switching, persistence, and system preference detection
 */

export type Theme = 'light' | 'dark' | 'light-high-contrast' | 'dark-high-contrast' | 'system';

export interface ThemeConfig {
  theme: Theme;
  systemPreference: 'light' | 'dark';
  highContrast: boolean;
}

const THEME_STORAGE_KEY = 'dls-theme-preference';

/**
 * Theme Manager Class
 * 
 * Provides all functionality for theme management
 */
export class ThemeManager {
  private currentTheme: Theme = 'system';
  private systemPreference: 'light' | 'dark' = 'light';
  private highContrast: boolean = false;
  private listeners: Set<(config: ThemeConfig) => void> = new Set();
  private mediaQuery: MediaQueryList | null = null;
  private contrastQuery: MediaQueryList | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize theme manager
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Set up system preference detection
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.contrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    this.systemPreference = this.mediaQuery.matches ? 'dark' : 'light';
    this.highContrast = this.contrastQuery.matches;

    // Listen for system preference changes
    this.mediaQuery.addEventListener('change', this.handleSystemChange);
    this.contrastQuery.addEventListener('change', this.handleContrastChange);

    // Load saved theme preference
    this.loadThemePreference();

    // Apply initial theme
    this.applyTheme();
  }

  /**
   * Handle system color scheme changes
   */
  private handleSystemChange = (e: MediaQueryListEvent): void => {
    this.systemPreference = e.matches ? 'dark' : 'light';
    
    // If using system theme, update the applied theme
    if (this.currentTheme === 'system') {
      this.applyTheme();
    }
    
    this.notifyListeners();
  };

  /**
   * Handle system contrast preference changes
   */
  private handleContrastChange = (e: MediaQueryListEvent): void => {
    this.highContrast = e.matches;
    
    // Auto-switch to high contrast variants if system prefers it
    if (e.matches) {
      if (this.currentTheme === 'light' || (this.currentTheme === 'system' && this.systemPreference === 'light')) {
        this.setTheme('light-high-contrast');
      } else if (this.currentTheme === 'dark' || (this.currentTheme === 'system' && this.systemPreference === 'dark')) {
        this.setTheme('dark-high-contrast');
      }
    }
    
    this.notifyListeners();
  };

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): void {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && this.isValidTheme(stored)) {
        this.currentTheme = stored as Theme;
      }
    } catch (error) {
      console.warn('[ThemeManager] Failed to load theme preference:', error);
    }
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, this.currentTheme);
    } catch (error) {
      console.warn('[ThemeManager] Failed to save theme preference:', error);
    }
  }

  /**
   * Validate theme value
   */
  private isValidTheme(theme: string): boolean {
    return ['light', 'dark', 'light-high-contrast', 'dark-high-contrast', 'system'].includes(theme);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    if (typeof document === 'undefined') return;

    const resolvedTheme = this.getResolvedTheme();
    
    // Remove all theme attributes
    document.documentElement.removeAttribute('data-theme');
    
    // Apply new theme if not system default
    if (resolvedTheme !== 'light' || this.currentTheme !== 'system') {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }

    // Set color-scheme for browser chrome
    document.documentElement.style.colorScheme = resolvedTheme.includes('dark') ? 'dark' : 'light';
  }

  /**
   * Get the actual theme being applied (resolves 'system' to light/dark)
   */
  private getResolvedTheme(): string {
    if (this.currentTheme === 'system') {
      return this.systemPreference;
    }
    return this.currentTheme;
  }

  /**
   * Notify all listeners of theme changes
   */
  private notifyListeners(): void {
    const config: ThemeConfig = {
      theme: this.currentTheme,
      systemPreference: this.systemPreference,
      highContrast: this.highContrast,
    };

    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('[ThemeManager] Error in theme listener:', error);
      }
    });
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    if (!this.isValidTheme(theme)) {
      console.warn(`[ThemeManager] Invalid theme: ${theme}`);
      return;
    }

    const previousTheme = this.currentTheme;
    this.currentTheme = theme;

    this.applyTheme();
    this.saveThemePreference();

    if (previousTheme !== theme) {
      this.notifyListeners();
    }
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get resolved theme (what's actually applied)
   */
  getResolvedTheme(): 'light' | 'dark' | 'light-high-contrast' | 'dark-high-contrast' {
    const resolved = this.getResolvedTheme();
    return resolved as 'light' | 'dark' | 'light-high-contrast' | 'dark-high-contrast';
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode(): boolean {
    const resolved = this.getResolvedTheme();
    return resolved.includes('dark');
  }

  /**
   * Check if high contrast is active
   */
  isHighContrast(): boolean {
    const resolved = this.getResolvedTheme();
    return resolved.includes('high-contrast') || this.highContrast;
  }

  /**
   * Get system preference
   */
  getSystemPreference(): 'light' | 'dark' {
    return this.systemPreference;
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const currentResolved = this.getResolvedTheme();
    
    if (currentResolved.includes('dark')) {
      this.setTheme(this.isHighContrast() ? 'light-high-contrast' : 'light');
    } else {
      this.setTheme(this.isHighContrast() ? 'dark-high-contrast' : 'dark');
    }
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(): void {
    const currentResolved = this.getResolvedTheme();
    
    if (currentResolved.includes('high-contrast')) {
      // Switch to normal contrast
      this.setTheme(currentResolved.includes('dark') ? 'dark' : 'light');
    } else {
      // Switch to high contrast
      this.setTheme(currentResolved.includes('dark') ? 'dark-high-contrast' : 'light-high-contrast');
    }
  }

  /**
   * Add theme change listener
   */
  addListener(listener: (config: ThemeConfig) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove theme change listener
   */
  removeListener(listener: (config: ThemeConfig) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Get current theme configuration
   */
  getConfig(): ThemeConfig {
    return {
      theme: this.currentTheme,
      systemPreference: this.systemPreference,
      highContrast: this.highContrast,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemChange);
    }
    if (this.contrastQuery) {
      this.contrastQuery.removeEventListener('change', this.handleContrastChange);
    }
    
    this.listeners.clear();
  }
}

// Create singleton instance
export const themeManager = new ThemeManager();

// Export convenience functions
export const setTheme = (theme: Theme) => themeManager.setTheme(theme);
export const getTheme = () => themeManager.getTheme();
export const getResolvedTheme = () => themeManager.getResolvedTheme();
export const isDarkMode = () => themeManager.isDarkMode();
export const isHighContrast = () => themeManager.isHighContrast();
export const toggleTheme = () => themeManager.toggleTheme();
export const toggleHighContrast = () => themeManager.toggleHighContrast();
export const addThemeListener = (listener: (config: ThemeConfig) => void) => 
  themeManager.addListener(listener);
export const removeThemeListener = (listener: (config: ThemeConfig) => void) => 
  themeManager.removeListener(listener);
export const getThemeConfig = () => themeManager.getConfig();