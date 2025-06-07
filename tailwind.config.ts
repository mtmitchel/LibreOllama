import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.css", // Ensure CSS files are scanned
    "./src/styles/App.css", // Explicitly include App.css
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
        
        // Background colors
        'background': 'var(--bg-primary)', // Renamed from bg-primary to background
        'bg-primary': 'var(--bg-primary)', // Kept for compatibility if used elsewhere
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'surface': 'var(--bg-surface)', // Renamed from bg-surface to surface
        'bg-surface': 'var(--bg-surface)', // Kept for compatibility
        'bg-elevated': 'var(--bg-elevated)',
        
        // Border colors
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        
        // Input colors
        'input-bg': 'var(--input-bg)',
        'input-placeholder': 'var(--input-placeholder)',
        'input-focus-ring': 'var(--input-focus-ring)',
        
        // Accent variations
        'accent-soft': 'var(--accent-soft)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        'layout-gutter': 'var(--space-layout-gutter)',
        'content-internal': 'var(--space-content-internal)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      ringColor: {
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      ringOffsetColor: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
      }
    },
  },
  plugins: [],
};

export default config;