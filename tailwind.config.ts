import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // No need to explicitly include css files here if they don't use Tailwind classes directly
    // "./src/**/*.css", 
    // "./src/styles/App.css",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
        
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-soft': 'var(--accent-soft)',
        
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',

        // Added for completeness from design-system.css, though not all might be used directly in Tailwind classes
        'input-bg': 'var(--input-bg)',
        'input-placeholder': 'var(--input-placeholder)',
        'input-focus-ring': 'var(--input-focus-ring)',

        // Semantic aliases (optional, but can be useful)
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
        background: 'var(--bg-primary)', 
        surface: 'var(--bg-surface)',
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
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'], // Added fallback fonts
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'], // Added fallback fonts
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
      ringColor: { // Ensure ring colors also use CSS variables
        DEFAULT: 'var(--accent-primary)', // Default ring color
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        'input-focus-ring': 'var(--input-focus-ring)',
      },
      ringOffsetColor: { // Ensure ring offset colors also use CSS variables
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'surface': 'var(--bg-surface)',
      }
    },
  },
  plugins: [],
};

export default config;