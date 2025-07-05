// src/features/canvas/utils/canvasTheme.ts

// These values are canvas-specific and are managed here because Konva
// requires direct hex codes rather than CSS variables. They should be
// kept in sync with the main design system in `src/core/design-system/globals.css`.

export const canvasTheme = {
  colors: {
    // Corresponds to CSS variable --accent-primary
    primary: '#3B82F6',
    // Corresponds to CSS variable --accent-secondary
    primaryDark: '#1D4ED8',
    // Corresponds to a lighter shade of primary for effects like shadows
    primaryLight: '#93C5FD',
    // Corresponds to CSS variable --error
    error: '#EF4444',
    // Corresponds to CSS variable --text-primary (in light theme) or --bg-secondary (in dark)
    dark: '#1E293B',
    // Corresponds to various shades of secondary/gray
    secondary: {
      '50': '#F8FAFC',
      '100': '#F1F5F9',
      '300': '#CBD5E1',
      '400': '#94A3B8',
      '500': '#64748B',
      '600': '#475569',
      '800': '#1E293B'
    },
    success: '#22C55E',
    warning: '#F59E0B',
    stickyNote: {
      yellow: '#FFE299',
      yellowBorder: '#E6C975',
      blue: '#A8DAFF',
      blueBorder: '#85C1FF',
      pink: '#FFB3BA',
      pinkBorder: '#FF8A94',
      green: '#BAFFC9',
      greenBorder: '#94E6A7',
      orange: '#FFDFBA',
      orangeBorder: '#FFCC99',
      purple: '#E6BAFF',
      purpleBorder: '#D194FF'
    }
  },
  canvasStyles: {
    background: '#FFFFFF',
    border: '#E5E7EB',
    gridColor: '#F3F4F6',
    selectionColor: '#3B82F6',
    selectionBorder: '#1D4ED8'
  },
  typography: {
    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    }
  }
};

// Utility functions for canvas elements

export const getStickyNoteColors = (variant: 'yellow' | 'green' | 'blue' | 'purple' | 'orange' = 'yellow') => ({
  fill: canvasTheme.colors.stickyNote[variant],
  stroke: canvasTheme.colors.stickyNote[`${variant}Border` as keyof typeof canvasTheme.colors.stickyNote]
});

export const getElementStyle = (elementType: string, isSelected: boolean = false) => {
  const baseStyle = {
    fill: canvasTheme.colors.primary,
    stroke: canvasTheme.colors.primaryDark,
    strokeWidth: 2
  };

  if (isSelected) {
    return {
      ...baseStyle,
      stroke: canvasTheme.colors.error,
      strokeWidth: 3
    };
  }

  // Customize styles based on element type
  switch (elementType) {
    case 'sticky-note':
      return {
        ...baseStyle,
        fill: canvasTheme.colors.stickyNote.yellow,
        stroke: canvasTheme.colors.stickyNote.yellowBorder
      };
    default:
      return baseStyle;
  }
}; 