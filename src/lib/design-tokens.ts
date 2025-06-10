// Design tokens for LibreOllama
// This file exports design system tokens that map to CSS variables
// NOTE: This file is deprecated in favor of CSS variables in design-system.css
// Keep for backward compatibility but prefer using CSS variables directly

export const designTokens = {
  colors: {
    // Primary brand colors - now map to CSS variables
    brand: {
      primary: "var(--accent-primary)", // #3b82f6
      secondary: "var(--accent-secondary)", // #1d4ed8  
      accent: "var(--warning)", // #f59e0b
    },
    
    // Semantic colors - map to CSS variables
    semantic: {
      success: "var(--success)", // #10b981
      warning: "var(--warning)", // #f59e0b
      error: "var(--error)", // #ef4444
      info: "var(--accent-primary)", // #3b82f6
    },
    
    // Background colors
    background: {
      primary: "var(--bg-primary)",
      secondary: "var(--bg-secondary)",
      tertiary: "var(--bg-tertiary)",
      surface: "var(--bg-surface)",
      elevated: "var(--bg-elevated)",
    },
    
    // Text colors
    text: {
      primary: "var(--text-primary)",
      secondary: "var(--text-secondary)",
      tertiary: "var(--text-tertiary)",
      muted: "var(--text-muted)",
    },
    
    // Border colors
    border: {
      subtle: "var(--border-subtle)",
      default: "var(--border-default)",
    },
  },
  
  spacing: {
    1: "var(--space-1)", // 4px
    2: "var(--space-2)", // 8px
    3: "var(--space-3)", // 12px
    4: "var(--space-4)", // 16px
    5: "var(--space-5)", // 20px
    6: "var(--space-6)", // 24px
    8: "var(--space-8)", // 32px
  },
  
  borderRadius: {
    sm: "var(--radius-sm)", // 6px
    md: "var(--radius-md)", // 8px
    lg: "var(--radius-lg)", // 12px
    xl: "var(--radius-xl)", // 16px
  },
  
  fontSize: {
    xs: "var(--font-size-xs)", // 11px
    sm: "var(--font-size-sm)", // 12px
    base: "var(--font-size-base)", // 14px
    lg: "var(--font-size-lg)", // 16px
    xl: "var(--font-size-xl)", // 18px
    "2xl": "var(--font-size-2xl)", // 20px
  },
  
  fontWeight: {
    normal: "var(--font-weight-normal)", // 400
    medium: "var(--font-weight-medium)", // 500
    semibold: "var(--font-weight-semibold)", // 600
    bold: "var(--font-weight-bold)", // 700
  },
  
  shadows: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
  },
} as const;

export type DesignTokens = typeof designTokens;

// Helper function to get CSS variable value
export function getCSSVar(varName: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  return '';
}

// Helper to check if dark theme is active
export function isDarkTheme(): boolean {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}
