import type { Config } from "tailwindcss";
import { designTokens } from "./src/lib/design-tokens";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // V2 Enhanced color system from design tokens
      colors: {
        // V2 Background colors for target design
        // These are defined as base colors, Tailwind will generate bg-v2-primary, text-v2-primary etc.
        'v2-primary': 'rgb(var(--v2-bg-primary-rgb) / <alpha-value>)',
        'v2-secondary': 'rgb(var(--v2-bg-secondary-rgb) / <alpha-value>)',
        'v2-tertiary': 'rgb(var(--v2-bg-tertiary-rgb) / <alpha-value>)',
        'v2-quaternary': 'rgb(var(--v2-bg-quaternary-rgb) / <alpha-value>)',
        
        // V2 Accent colors
        'accent-primary': designTokens.colors.accent.primary,
        'accent-secondary': designTokens.colors.accent.secondary,
        'accent-success': designTokens.colors.accent.success,
        'accent-warning': designTokens.colors.accent.warning,
        'accent-error': designTokens.colors.accent.error,
        
        // Cognitive load indicators
        'cognitive-low': designTokens.colors.cognitive.low,
        'cognitive-medium': designTokens.colors.cognitive.medium,
        'cognitive-high': designTokens.colors.cognitive.high,
        'cognitive-focus': designTokens.colors.cognitive.focus,
        
        // V2 text and background colors using CSS variables for proper theme switching
        background: 'var(--v2-bg-primary)',
        foreground: 'var(--v2-text-primary)',
        
        // Text colors using CSS variables for proper light/dark mode adaptation
        text: {
          primary: 'var(--v2-text-primary)',
          secondary: 'var(--v2-text-secondary)',
          tertiary: 'var(--v2-text-muted)',
          muted: 'var(--v2-text-muted)',
        },
        
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // Extended primary scale for modern design
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // Professional neutral grays for modern design
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        
        // Override slate colors for better dark mode visibility
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8', // Light mode: keep original
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        
        // Override gray colors for better dark mode visibility
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af', // Light mode: keep original
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        
        // Enhanced semantic colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      
      // V2 Enhanced typography system from design tokens
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono
      },
      fontSize: {
        xs: [designTokens.typography.fontSize.xs.size, { lineHeight: designTokens.typography.fontSize.xs.lineHeight }],
        sm: [designTokens.typography.fontSize.sm.size, { lineHeight: designTokens.typography.fontSize.sm.lineHeight }],
        base: [designTokens.typography.fontSize.base.size, { lineHeight: designTokens.typography.fontSize.base.lineHeight }],
        lg: [designTokens.typography.fontSize.lg.size, { lineHeight: designTokens.typography.fontSize.lg.lineHeight }],
        xl: [designTokens.typography.fontSize.xl.size, { lineHeight: designTokens.typography.fontSize.xl.lineHeight }],
        '2xl': [designTokens.typography.fontSize['2xl'].size, { lineHeight: designTokens.typography.fontSize['2xl'].lineHeight }],
        '3xl': [designTokens.typography.fontSize['3xl'].size, { lineHeight: designTokens.typography.fontSize['3xl'].lineHeight }],
        '4xl': [designTokens.typography.fontSize['4xl'].size, { lineHeight: designTokens.typography.fontSize['4xl'].lineHeight }],
        '5xl': [designTokens.typography.fontSize['5xl'].size, { lineHeight: designTokens.typography.fontSize['5xl'].lineHeight }]
      },
      fontWeight: {
        normal: designTokens.typography.fontWeight.normal,
        medium: designTokens.typography.fontWeight.medium,
        semibold: designTokens.typography.fontWeight.semibold,
        bold: designTokens.typography.fontWeight.bold
      },
      letterSpacing: {
        tight: designTokens.typography.letterSpacing.tight,
        normal: designTokens.typography.letterSpacing.normal,
        wide: designTokens.typography.letterSpacing.wide,
        wider: designTokens.typography.letterSpacing.wider
      },
      
      // V2 Enhanced spacing system from design tokens
      spacing: designTokens.spacing,
      
      // V2 Enhanced border radius system from design tokens
      borderRadius: {
        ...designTokens.borderRadius,
        // Keep CSS variable compatibility
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      

      
      // V2 Animation system from design tokens
      transitionDuration: {
        fast: designTokens.animation.duration.fast,
        normal: designTokens.animation.duration.normal,
        slow: designTokens.animation.duration.slow,
        slower: designTokens.animation.duration.slower,
      },
      
      transitionTimingFunction: {
        spring: designTokens.animation.easing.spring,
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;