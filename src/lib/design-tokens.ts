/**
 * LibreOllama Design System Tokens - V2 Enhanced
 *
 * Centralized design tokens for the modern UI/UX transformation.
 * These tokens define the visual foundation of the application with
 * enhanced dark theme support, ADHD-optimized cognitive load indicators,
 * and feature flag support for gradual v2 rollout.
 */

// Feature flags for gradual v2 rollout
export const designSystemFlags = {
  useV2Colors: true,
  useV2Typography: true,
  useV2Components: true,
  useV2Spacing: true,
  enableCognitiveLoadOptimization: true,
} as const;

export const designTokens = {
  // V2 Enhanced Color System - Target Design Implementation
  colors: {
    // V2 Background Colors - Differentiated for Light and Dark Themes
    background: {
      light: {
        primary: '#FFFFFF',    // Main background - White
        secondary: '#F8F9FA',  // Secondary surfaces - Very light gray
        tertiary: '#F1F3F5',   // Elevated surfaces - Slightly darker light gray
        quaternary: '#EFF1F3', // Interactive surfaces - Even darker light gray
      },
      dark: {
        primary: '#0F172A',    // Main background - slate-900
        secondary: '#1E293B',  // Secondary surfaces - slate-800
        tertiary: '#334155',   // Elevated surfaces - slate-700
        quaternary: '#475569', // Interactive surfaces - slate-600
      },
    },
    
    // V2 Accent Colors - Modern professional palette
    accent: {
      primary: '#2563EB',    // Muted, professional blue (e.g., #2563EB or #4F46E5 from Roo's plan)
      // secondary: '#3B82F6', // Blue-500 - Secondary actions (Consider if still needed or if primary is sufficient)
      success: '#10B981',    // Emerald-500 - Success states
      warning: '#F59E0B',    // Amber-500 - Warning states
      error: '#EF4444',      // Red-500 - Error states
    },
    iconography: {
      light: '#6B7280',
      dark: '#E2E8F0',  // Brighter for better visibility in dark mode
      // Hover/active states for icons will typically use the accent.primary color
    },
    
    // Icon colors for consistent theming
    iconPrimary: 'var(--v2-icon-primary)',
    
    // Text Colors - Differentiated for Light and Dark Themes
    text: {
      light: {
        primary: '#1F2937',    // Dark gray for main text
        secondary: '#4B5563',  // Medium gray for secondary text
        tertiary: '#6B7280',   // Light gray for subtle text
        placeholder: '#9CA3AF',// Placeholder text
        onAccent: '#FFFFFF',   // Text on accent colors
      },
      dark: {
        primary: '#F9FAFB',    // Light gray for main text
        secondary: '#D1D5DB',  // Medium light gray for secondary text
        tertiary: '#9CA3AF',   // Gray for subtle text
        placeholder: '#6B7280',// Placeholder text
        onAccent: '#FFFFFF',   // Text on accent colors
      },
    },

    // Legacy color system (maintained for backward compatibility)
    primary: {
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
    
    // Professional neutral grays - Enhanced for dark theme
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
    
    // Enhanced semantic colors with better contrast
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
    
    // ADHD-optimized cognitive load indicators
    cognitive: {
      low: '#10B981',      // Green - Low cognitive load
      medium: '#F59E0B',   // Amber - Medium cognitive load
      high: '#EF4444',     // Red - High cognitive load
      focus: '#4F46E5',    // Indigo - Focus state
    }
  },
  
  // V2 Enhanced Typography System - ADHD-optimized
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace']
    },
    
    // Enhanced font sizes with improved line heights for readability
    fontSize: {
      xs: { size: '0.75rem', lineHeight: '1.125rem' },    // Improved line height
      sm: { size: '0.875rem', lineHeight: '1.375rem' },   // Better readability
      base: { size: '1rem', lineHeight: '1.625rem' },     // ADHD-optimized spacing
      lg: { size: '1.125rem', lineHeight: '1.875rem' },   // Enhanced readability
      xl: { size: '1.25rem', lineHeight: '2rem' },        // Better contrast
      '2xl': { size: '1.5rem', lineHeight: '2.25rem' },   // Improved hierarchy
      '3xl': { size: '1.875rem', lineHeight: '2.5rem' },  // Better spacing
      '4xl': { size: '2.25rem', lineHeight: '2.75rem' },  // Enhanced readability
      '5xl': { size: '3rem', lineHeight: '3.25rem' }      // Improved line height
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    
    // Enhanced letter spacing for better readability
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em'     // For ADHD-optimized text
    },
    
    // V2 Typography hierarchy with cognitive load considerations
    hierarchy: {
      display: {
        fontSize: '3rem',
        lineHeight: '3.25rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        cognitiveLoad: 'medium'
      },
      h1: {
        fontSize: '2.25rem',
        lineHeight: '2.75rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        cognitiveLoad: 'low'
      },
      h2: {
        fontSize: '1.875rem',
        lineHeight: '2.5rem',
        fontWeight: 600,
        letterSpacing: 'normal',
        cognitiveLoad: 'low'
      },
      h3: {
        fontSize: '1.5rem',
        lineHeight: '2.25rem',
        fontWeight: 600,
        letterSpacing: 'normal',
        cognitiveLoad: 'low'
      },
      body: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        fontWeight: 400,
        letterSpacing: 'normal',
        cognitiveLoad: 'low'
      },
      caption: {
        fontSize: '0.875rem',
        lineHeight: '1.375rem',
        fontWeight: 400,
        letterSpacing: 'wide',
        cognitiveLoad: 'low'
      }
    }
  },
  
  // V2 Border Colors
  borders: {
    light: {
      default: '#E5E7EB', // Gray-200
      strong: '#D1D5DB',  // Gray-300
      accent: '#2563EB',  // Accent blue
    },
    dark: {
      default: '#374151', // Gray-700
      strong: '#4B5563',  // Gray-600
      accent: '#60A5FA',  // Accent blue for dark mode
    },
  },



  // Spacing System (8px base unit)
  spacing: {
    0: '0px',
    0.5: '2px',   // 0.25 * 8px
    1: '4px',     // 0.5 * 8px
    1.5: '6px',   // 0.75 * 8px
    2: '8px',     // 1 * 8px
    2.5: '10px',  // 1.25 * 8px
    3: '12px',    // 1.5 * 8px
    3.5: '14px',  // 1.75 * 8px
    4: '16px',    // 2 * 8px
    5: '20px',    // 2.5 * 8px
    6: '24px',    // 3 * 8px
    7: '28px',    // 3.5 * 8px
    8: '32px',    // 4 * 8px
    9: '36px',    // 4.5 * 8px
    10: '40px',   // 5 * 8px
    11: '44px',   // 5.5 * 8px (minimum touch target)
    12: '48px',   // 6 * 8px
    14: '56px',   // 7 * 8px
    16: '64px',   // 8 * 8px
    20: '80px',   // 10 * 8px
    24: '96px',   // 12 * 8px
    28: '112px',  // 14 * 8px
    32: '128px',  // 16 * 8px
    36: '144px',  // 18 * 8px
    40: '160px',  // 20 * 8px
    44: '176px',  // 22 * 8px
    48: '192px',  // 24 * 8px
    52: '208px',  // 26 * 8px
    56: '224px',  // 28 * 8px
    60: '240px',  // 30 * 8px
    64: '256px',  // 32 * 8px
    72: '288px',  // 36 * 8px
    80: '320px',  // 40 * 8px
    96: '384px'   // 48 * 8px
  },
  
  // Sizing System
  sizing: {
    topBarHeight: '56px',     // Standard top bar height
    sidebarWidth: '240px',    // Standard sidebar width
    sidebarCollapsed: '64px', // Collapsed sidebar width
    minTouchTarget: '44px',   // Minimum touch target size
  },
  
  // Border Radius System
  borderRadius: {
    none: '0px',
    xs: '2px',
    sm: '4px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px'
  },
  
  // Animation System
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms'
    },
    
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  },
  
  // Breakpoints for Responsive Design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
} as const;

// V2 CSS Custom Properties for runtime theme switching
export const cssCustomProperties = {
  // V2 Dark Theme Variables
  ':root': {
    '--v2-bg-primary': designTokens.colors.background.primary,
    '--v2-bg-secondary': designTokens.colors.background.secondary,
    '--v2-bg-tertiary': designTokens.colors.background.tertiary,
    '--v2-bg-quaternary': designTokens.colors.background.quaternary,
    
    '--v2-accent-primary': designTokens.colors.accent.primary,
    '--v2-accent-secondary': designTokens.colors.accent.secondary,
    '--v2-accent-success': designTokens.colors.accent.success,
    '--v2-accent-warning': designTokens.colors.accent.warning,
    '--v2-accent-error': designTokens.colors.accent.error,
    
    '--v2-cognitive-low': designTokens.colors.cognitive.low,
    '--v2-cognitive-medium': designTokens.colors.cognitive.medium,
    '--v2-cognitive-high': designTokens.colors.cognitive.high,
    '--v2-cognitive-focus': designTokens.colors.cognitive.focus,
    
    // Typography variables
    '--v2-font-sans': designTokens.typography.fontFamily.sans.join(', '),
    '--v2-font-mono': designTokens.typography.fontFamily.mono.join(', '),
  }
};

// Type definitions for design tokens
export type ColorScale = typeof designTokens.colors.primary;
export type SpacingValue = keyof typeof designTokens.spacing;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type FontWeight = keyof typeof designTokens.typography.fontWeight;
export type BorderRadius = keyof typeof designTokens.borderRadius;
// export type Shadow = keyof typeof designTokens.shadows;
export type Breakpoint = keyof typeof designTokens.breakpoints;
export type CognitiveLoad = 'low' | 'medium' | 'high';

// Utility functions for working with design tokens
export const getSpacing = (value: SpacingValue): string => designTokens.spacing[value];
export const getFontSize = (size: FontSize) => designTokens.typography.fontSize[size];
// export const getShadow = (shadow: Shadow): string => designTokens.shadows[shadow];
export const getBorderRadius = (radius: BorderRadius): string => designTokens.borderRadius[radius];

// V2 Enhanced component-specific token collections
export const componentTokens = {
  button: {
    height: {
      sm: designTokens.spacing[8],
      md: designTokens.spacing[10],
      lg: designTokens.spacing[11]
    },
    padding: {
      sm: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`, 
      md: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`, 
      lg: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`
    },
    fontSize: {
      sm: designTokens.typography.fontSize.sm,
      md: designTokens.typography.fontSize.sm,
      lg: designTokens.typography.fontSize.base
    },
    // V2 enhancements
    v2: {
      primary: {
        background: designTokens.colors.accent.primary,
        hover: '#4338CA', // Indigo-700
        active: '#3730A3', // Indigo-800
        cognitiveLoad: 'low' as CognitiveLoad
      },
      secondary: {
        background: designTokens.colors.background.tertiary,
        hover: designTokens.colors.background.quaternary,
        active: '#64748B', // Slate-500
        cognitiveLoad: 'low' as CognitiveLoad
      }
    }
  },
  
  input: {
    height: designTokens.spacing[10],
    padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`, 
    fontSize: designTokens.typography.fontSize.sm,
    borderRadius: designTokens.borderRadius.md,
    // V2 enhancements
    v2: {
      background: designTokens.colors.background.secondary,
      border: designTokens.colors.background.quaternary,
      focus: designTokens.colors.accent.primary,
      cognitiveLoad: 'low' as CognitiveLoad
    }
  },
  
  card: {
    padding: designTokens.spacing[6],
    borderRadius: designTokens.borderRadius.lg,
    // shadow: designTokens.shadows.sm,
    // V2 enhancements
    v2: {
      background: designTokens.colors.background.secondary,
      border: designTokens.colors.background.tertiary,
      hover: designTokens.colors.background.tertiary,
      cognitiveLoad: 'low' as CognitiveLoad
    }
  },
  
  sidebar: {
    width: {
      collapsed: designTokens.spacing[16],
      expanded: designTokens.spacing[64]
    },
    padding: designTokens.spacing[4],
    // V2 enhancements
    v2: {
      background: designTokens.colors.background.primary,
      border: designTokens.colors.background.tertiary,
      cognitiveLoad: 'low' as CognitiveLoad
    }
  }
};

// Feature flag utilities
export const useV2Token = <T>(v1Value: T, v2Value: T, flag: keyof typeof designSystemFlags): T => {
  return designSystemFlags[flag] ? v2Value : v1Value;
};

export const getCognitiveLoadColor = (load: CognitiveLoad): string => {
  return designTokens.colors.cognitive[load];
};

export default designTokens;