/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-overlay': 'var(--bg-overlay)',
        'bg-glass': 'var(--bg-glass)',
        
        // Content areas (theme-independent)
        'bg-content': 'var(--bg-content)',
        'bg-canvas': 'var(--bg-canvas)',
        'bg-notes': 'var(--bg-notes)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-inverted': 'var(--text-inverted)',
        
        // Borders
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'border-focus': 'var(--border-focus)',
        
        // Interactive states
        'hover-bg': 'var(--hover-bg)',
        'active-bg': 'var(--active-bg)',
        'selected-bg': 'var(--selected-bg)',
        'selected-border': 'var(--selected-border)',
        'selected-text': 'var(--selected-text)',
        
        // Accent colors
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'accent-bg': 'var(--accent-bg)',
        'accent-soft': 'var(--accent-soft)',
        'accent-ghost': 'var(--accent-ghost)',
        'accent-text': 'var(--accent-text)',
        
        // Component colors
        'chat-bubble-bg': 'var(--chat-bubble-bg)',
        'chat-bubble-border': 'var(--chat-bubble-border)',
        'chat-bubble-text': 'var(--chat-bubble-text)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        'card-bg': 'var(--card-bg)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'header-bg': 'var(--header-bg)',
        
        // Design system semantic colors - comprehensive status system
        'warning': 'var(--amber-500)',
        'warning-fg': 'var(--amber-600)',
        'warning-bg': 'var(--amber-50)',
        'warning-border': 'var(--amber-200)',
        
        'success': 'var(--green-500)',
        'success-fg': 'var(--green-600)',
        'success-bg': 'var(--green-50)',
        'success-border': 'var(--green-200)',
        
        'error': 'var(--red-500)',
        'error-fg': 'var(--red-600)',
        'error-bg': 'var(--red-50)',
        'error-border': 'var(--red-200)',
        
        'info': 'var(--indigo-500)',
        'info-fg': 'var(--indigo-600)',
        'info-bg': 'var(--indigo-50)',
        'info-border': 'var(--indigo-200)',
        
        // Context-specific semantic colors
        'destructive': 'var(--red-600)',
        'destructive-fg': 'white',
        'destructive-bg': 'var(--red-50)',
        'destructive-border': 'var(--red-300)',
        
        'muted': 'var(--gray-500)',
        'muted-fg': 'var(--gray-600)',
        'muted-bg': 'var(--gray-50)',
        'muted-border': 'var(--gray-200)',
        
        // Gray scale
        'gray-50': 'var(--gray-50)',
        'gray-100': 'var(--gray-100)',
        'gray-200': 'var(--gray-200)',
        'gray-300': 'var(--gray-300)',
        'gray-400': 'var(--gray-400)',
        'gray-500': 'var(--gray-500)',
        'gray-600': 'var(--gray-600)',
        'gray-700': 'var(--gray-700)',
        'gray-800': 'var(--gray-800)',
        'gray-850': 'var(--gray-850)',
        'gray-900': 'var(--gray-900)',
        'gray-950': 'var(--gray-950)',
        
        // Indigo scale
        'indigo-50': 'var(--indigo-50)',
        'indigo-100': 'var(--indigo-100)',
        'indigo-200': 'var(--indigo-200)',
        'indigo-300': 'var(--indigo-300)',
        'indigo-400': 'var(--indigo-400)',
        'indigo-500': 'var(--indigo-500)',
        'indigo-600': 'var(--indigo-600)',
        'indigo-700': 'var(--indigo-700)',
        'indigo-800': 'var(--indigo-800)',
        'indigo-900': 'var(--indigo-900)',
        'indigo-950': 'var(--indigo-950)',
        
        // Semantic color primitives - complete scales
        'green-50': '#f0fdf4',
        'green-200': '#bbf7d0',
        'green-500': 'var(--green-500)',
        'green-600': 'var(--green-600)',
        
        'emerald-500': 'var(--emerald-500)',
        
        'amber-50': '#fffbeb',
        'amber-200': '#fde68a',
        'amber-500': 'var(--amber-500)',
        'amber-600': 'var(--amber-600)',
        
        'red-50': '#fef2f2',
        'red-200': '#fecaca',
        'red-300': '#fca5a5',
        'red-500': 'var(--red-500)',
        'red-600': 'var(--red-600)',
      },
      fontFamily: {
        'sans': 'var(--font-sans)',
        'mono': 'var(--font-mono)',
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
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'base': 'var(--transition-base)',
        'slow': 'var(--transition-slow)',
        'slower': 'var(--transition-slower)',
      },
      transitionTimingFunction: {
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
      },
      zIndex: {
        '0': 'var(--z-0)',
        '10': 'var(--z-10)',
        '20': 'var(--z-20)',
        '30': 'var(--z-30)',
        '40': 'var(--z-40)',
        '50': 'var(--z-50)',
      },
      screens: {
        'sm': 'var(--breakpoint-sm)',
        'md': 'var(--breakpoint-md)',
        'lg': 'var(--breakpoint-lg)',
        'xl': 'var(--breakpoint-xl)',
        '2xl': 'var(--breakpoint-2xl)',
      },
      backdropBlur: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      maxWidth: {
        'container': '1440px',
      },
    },
  },
  plugins: [
    // Custom plugin to add component classes
    function({ addComponents }) {
      addComponents({
        '.btn-primary': {
          'background': 'var(--accent-primary)',
          'color': 'white',
          'padding': 'var(--space-2) var(--space-4)',
          'border-radius': 'var(--radius-xl)',
          'font-weight': 'var(--font-medium)',
          'font-size': 'var(--text-sm)',
          'transition': 'var(--transition-all)',
          'box-shadow': 'var(--shadow-sm)',
          'border': 'none',
          'cursor': 'pointer',
          '&:hover': {
            'background': 'var(--accent-secondary)',
            'box-shadow': 'var(--shadow-md)',
          },
        },
        '.btn-ghost': {
          'background': 'transparent',
          'color': 'var(--text-primary)',
          'padding': 'var(--space-2) var(--space-3)',
          'border-radius': 'var(--radius-xl)',
          'transition': 'var(--transition-all)',
          'border': 'none',
          'cursor': 'pointer',
          '&:hover': {
            'background': 'var(--hover-bg)',
          },
        },
        '.btn-icon': {
          'width': 'var(--space-8)',
          'height': 'var(--space-8)',
          'padding': '0',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'border-radius': 'var(--radius-xl)',
          'transition': 'var(--transition-all)',
          'border': 'none',
          'cursor': 'pointer',
          'background': 'transparent',
          '&:hover': {
            'background': 'var(--hover-bg)',
          },
        },
        '.input': {
          'background': 'var(--input-bg)',
          'border': '1px solid var(--input-border)',
          'color': 'var(--text-primary)',
          'padding': 'var(--space-2) var(--space-3)',
          'border-radius': 'var(--radius-xl)',
          'font-size': 'var(--text-sm)',
          'transition': 'var(--transition-colors)',
          'width': '100%',
          '&:focus': {
            'outline': 'none',
            'border-color': 'var(--border-focus)',
            'box-shadow': '0 0 0 3px rgba(99, 102, 241, 0.1)',
          },
          '&::placeholder': {
            'color': 'var(--text-tertiary)',
          },
        },
        '.card': {
          'background': 'var(--card-bg)',
          'border': '1px solid var(--border-primary)',
          'border-radius': 'var(--radius-xl)',
          'padding': 'var(--space-6)',
          'backdrop-filter': 'blur(10px)',
          'transition': 'var(--transition-all)',
          '&:hover': {
            'border-color': 'var(--border-secondary)',
          },
        },
        '.nav-item': {
          'display': 'flex',
          'align-items': 'center',
          'gap': 'var(--space-3)',
          'padding': 'var(--space-2) var(--space-3)',
          'border-radius': 'var(--radius-xl)',
          'font-size': 'var(--text-sm)',
          'font-weight': 'var(--font-medium)',
          'color': 'var(--text-primary)',
          'transition': 'var(--transition-all)',
          'text-decoration': 'none',
          'cursor': 'pointer',
          '&:hover': {
            'background': 'var(--hover-bg)',
          },
          '&.active': {
            'background': 'var(--selected-bg)',
            'color': 'var(--selected-text)',
          },
        },
        '.chat-bubble': {
          'max-width': '80%',
          'padding': 'var(--space-2-5) var(--space-4)',
          'border-radius': 'var(--radius-2xl)',
          'font-size': 'var(--text-sm)',
          'line-height': 'var(--leading-relaxed)',
          '&.ai': {
            'background': 'var(--chat-bubble-bg)',
            'border': '1px solid var(--chat-bubble-border)',
            'color': 'var(--chat-bubble-text)',
            'box-shadow': 'var(--shadow-sm)',
          },
          '&.user': {
            'background': 'var(--accent-primary)',
            'color': 'white',
            'box-shadow': 'var(--shadow-md)',
          },
        },
        '.sidebar': {
          'width': '224px',
          'background': 'var(--sidebar-bg)',
          'border-right': '1px solid var(--border-primary)',
          'padding': 'var(--space-3)',
          'display': 'flex',
          'flex-direction': 'column',
        },
        '.modal': {
          'background': 'var(--bg-glass)',
          'border': '1px solid var(--border-primary)',
          'border-radius': 'var(--radius-2xl)',
          'box-shadow': 'var(--shadow-xl)',
          'backdrop-filter': 'blur(10px)',
          'max-width': '600px',
        },
        '.overlay': {
          'position': 'fixed',
          'inset': '0',
          'background': 'var(--bg-overlay)',
          'backdrop-filter': 'blur(4px)',
          'z-index': 'var(--z-50)',
        },
      });
    },
  ],
};

