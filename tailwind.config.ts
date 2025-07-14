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
      backgroundColor: {
        // ===== UNIFIED UI ROLE BACKGROUNDS =====
        'page': 'var(--bg-page)',
        'content': 'var(--bg-content)',
        'sidebar': 'var(--bg-sidebar)',
        'card': 'var(--bg-card)',
        'header': 'var(--bg-header)',
        'canvas': 'var(--bg-canvas)',
        'notes': 'var(--bg-notes)',

        // System backgrounds
        'primary': 'var(--bg-primary)',
        'secondary': 'var(--bg-secondary)',
        'tertiary': 'var(--bg-tertiary)',
        'surface': 'var(--bg-surface)',
        'elevated': 'var(--bg-elevated)',
        'overlay': 'var(--bg-overlay)',
        'glass': 'var(--bg-glass)',

        // Interactive states
        'hover': 'var(--state-hover)',
        'active': 'var(--state-active)',
        'selected': 'var(--state-selected)',
        'focus': 'var(--state-focus)',
        'pressed': 'var(--state-pressed)',

        // Accent colors
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'accent-bg': 'var(--accent-bg)',

        // Status colors
        'status-success': 'var(--status-success)',
        'status-warning': 'var(--status-warning)',
        'status-error': 'var(--status-error)',
        'status-info': 'var(--status-info)',
        'status-success-bg': 'var(--status-success-bg)',
        'status-warning-bg': 'var(--status-warning-bg)',
        'status-error-bg': 'var(--status-error-bg)',
        'status-info-bg': 'var(--status-info-bg)',

        // Component backgrounds
        'input': 'var(--input-bg)',
        'chat-bubble': 'var(--chat-bubble-bg)',

        // Legacy support
        'success': 'var(--status-success)',
        'success-ghost': 'var(--status-success-bg)',
        'warning': 'var(--status-warning)',
        'warning-ghost': 'var(--status-warning-bg)',
        'error': 'var(--status-error)',
        'error-ghost': 'var(--status-error-bg)',
        'accent-soft': 'var(--accent-bg)',
        'accent-ghost': 'var(--state-focus)',
      },
      textColor: {
        // ===== UNIFIED TEXT COLORS =====
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'tertiary': 'var(--text-tertiary)',
        'muted': 'var(--text-muted)',
        'inverted': 'var(--text-inverted)',
        'on-accent': 'var(--text-on-accent)',

        // Interactive states
        'selected': 'var(--accent-text)',
        'hover': 'var(--text-primary)',
        'active': 'var(--text-primary)',

        // Accent colors
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'accent-text': 'var(--accent-text)',

        // Status colors
        'status-success': 'var(--status-success)',
        'status-warning': 'var(--status-warning)',
        'status-error': 'var(--status-error)',
        'status-info': 'var(--status-info)',

        // Legacy support
        'success': 'var(--status-success)',
        'success-fg': 'var(--status-success)',
        'warning': 'var(--status-warning)',
        'warning-fg': 'var(--status-warning)',
        'error': 'var(--status-error)',
        'error-fg': 'var(--status-error)',
      },
      borderColor: {
        // ===== UNIFIED BORDER COLORS =====
        'primary': 'var(--border-primary)',
        'secondary': 'var(--border-secondary)',
        'subtle': 'var(--border-subtle)',
        'focus': 'var(--border-focus)',
        'error': 'var(--border-error)',
        'success': 'var(--border-success)',
        'warning': 'var(--border-warning)',

        // Component borders
        'input': 'var(--input-border)',
        'chat-bubble': 'var(--chat-bubble-border)',

        // Interactive states
        'selected': 'var(--border-focus)',
        'hover': 'var(--border-primary)',
        'active': 'var(--border-focus)',

        // Accent colors
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',

        // Legacy support
        'default': 'var(--border-primary)',
      },
      spacing: {
        '0': 'var(--space-0)',
        '0.5': 'var(--space-0-5)',
        '1': 'var(--space-1)',
        '1.5': 'var(--space-1-5)',
        '2': 'var(--space-2)',
        '2.5': 'var(--space-2-5)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        '32': 'var(--space-32)',
        'layout-gutter': 'var(--space-layout-gutter)',
        'content-internal': 'var(--space-content-internal)',
      },
      borderRadius: {
        'none': 'var(--radius-none)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        'full': 'var(--radius-full)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      fontWeight: {
        'normal': 'var(--font-normal)',
        'medium': 'var(--font-medium)',
        'semibold': 'var(--font-semibold)',
        'bold': 'var(--font-bold)',
      },
      lineHeight: {
        'none': 'var(--leading-none)',
        'tight': 'var(--leading-tight)',
        'normal': 'var(--leading-normal)',
        'relaxed': 'var(--leading-relaxed)',
      },
      letterSpacing: {
        'tighter': 'var(--tracking-tighter)',
        'tight': 'var(--tracking-tight)',
        'normal': 'var(--tracking-normal)',
        'wide': 'var(--tracking-wide)',
        'wider': 'var(--tracking-wider)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'inner': 'var(--shadow-inner)',
      },
      transitionDuration: {
        '150': 'var(--duration-150)',
        '200': 'var(--duration-200)',
        '300': 'var(--duration-300)',
        '500': 'var(--duration-500)',
      },
      ringColor: {
        'DEFAULT': 'var(--accent-primary)',
        'primary': 'var(--accent-primary)',
        'secondary': 'var(--accent-secondary)',
        'success': 'var(--status-success)',
        'warning': 'var(--status-warning)',
        'error': 'var(--status-error)',
        'input-focus': 'var(--input-focus-ring)',
      },
      ringOffsetColor: {
        'page': 'var(--bg-page)',
        'content': 'var(--bg-content)',
        'primary': 'var(--bg-primary)',
        'secondary': 'var(--bg-secondary)',
        'surface': 'var(--bg-surface)',
      }
    },
  },
  plugins: [],
};

export default config;