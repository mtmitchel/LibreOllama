// Design System Configuration
export const designSystem = {
  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE', 
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Main primary
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A'
    },
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A'
    },
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D'
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',
      600: '#D97706'
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C'
    },
    stickyNote: {
      yellow: '#FFEB3B',
      yellowBorder: '#FBC02D',
      green: '#C8E6C9',
      greenBorder: '#4CAF50',
      blue: '#BBDEFB',
      blueBorder: '#2196F3',
      purple: '#E1BEE7',
      purpleBorder: '#9C27B0',
      orange: '#FFE0B2',
      orangeBorder: '#FF9800'
    }
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    stickyNote: '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999
  },
  
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
    }
  },
  
  canvasStyles: {
    background: '#FFFFFF',
    border: '#E5E7EB',
    gridColor: '#F3F4F6',
    selectionColor: '#3B82F6',
    selectionBorder: '#1D4ED8'
  },
  
  toolbar: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonBackground: 'rgba(255, 255, 255, 0.1)',
    buttonBackgroundHover: 'rgba(255, 255, 255, 0.2)',
    buttonBackgroundActive: 'rgba(255, 255, 255, 0.3)',
    buttonBorder: 'rgba(255, 255, 255, 0.2)',
    buttonText: '#FFFFFF'
  }
};

// Utility functions for design system
export const getStickyNoteColors = (variant: 'yellow' | 'green' | 'blue' | 'purple' | 'orange' = 'yellow') => ({
  fill: designSystem.colors.stickyNote[variant],
  stroke: designSystem.colors.stickyNote[`${variant}Border` as keyof typeof designSystem.colors.stickyNote]
});

export const getElementStyle = (elementType: string, isSelected: boolean = false) => {
  const baseStyle = {
    fill: designSystem.colors.primary[500],
    stroke: designSystem.colors.primary[700],
    strokeWidth: 2
  };
  
  if (isSelected) {
    return {
      ...baseStyle,
      stroke: designSystem.colors.error[500],
      strokeWidth: 3
    };
  }
  
  // Customize styles based on element type
  switch (elementType) {
    case 'sticky-note':
      return {
        ...baseStyle,
        fill: designSystem.colors.stickyNote.yellow,
        stroke: designSystem.colors.stickyNote.yellowBorder
      };
    default:
      return baseStyle;
  }
};
