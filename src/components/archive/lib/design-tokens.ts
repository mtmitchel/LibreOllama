// Design tokens for LibreOllama
// This file exports design system tokens for use in Tailwind config

export const designTokens = {
  colors: {
    // Primary brand colors
    brand: {
      primary: "#2563eb", // Blue
      secondary: "#10b981", // Green
      accent: "#f59e0b", // Amber
    },
    
    // Semantic colors
    semantic: {
      success: "#10b981",
      warning: "#f59e0b", 
      error: "#ef4444",
      info: "#3b82f6",
    },
    
    // Neutral colors
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  
  spacing: {
    xs: "0.25rem",  // 4px
    sm: "0.5rem",   // 8px
    md: "1rem",     // 16px
    lg: "1.5rem",   // 24px
    xl: "2rem",     // 32px
    xxl: "3rem",    // 48px
  },
  
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    md: "0.375rem", 
    lg: "0.5rem",
    full: "9999px",
  },
  
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem", 
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
} as const;

export type DesignTokens = typeof designTokens;
