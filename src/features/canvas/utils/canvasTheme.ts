// src/features/canvas/utils/canvasTheme.ts

// These values are canvas-specific and are managed here because Konva
// requires direct hex codes rather than CSS variables. They should be
// kept in sync with the main design system in `src/core/design-system/globals.css`.

export const canvasTheme = {
  colors: {
    // Corresponds to CSS variable --accent-primary
    primary: '#6366f1',
    // Corresponds to CSS variable --accent-secondary
    primaryDark: '#4f46e5',
    // Corresponds to a lighter shade of primary for effects like shadows
    primaryLight: '#a5b4fc',
    // Corresponds to CSS variable --error
    error: '#ef4444',
    // Corresponds to CSS variable --text-primary (in light theme) or --bg-secondary (in dark)
    dark: '#18181b',
    // Corresponds to various shades of secondary/gray
    secondary: {
      '50': '#fafafa',
      '100': '#f4f4f5',
      '300': '#d4d4d8',
      '400': '#a1a1aa',
      '500': '#71717a',
      '600': '#52525b',
      '800': '#27272a'
    },
    success: '#10b981',
    warning: '#f59e0b',
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
    background: '#f8f9fa', // Theme-independent light neutral - matches --bg-canvas
    backgroundDark: '#f8f9fa', // Theme-independent - same in both themes
    border: '#e4e4e7',
    borderDark: '#d1d5db', // Slightly darker for visibility on light canvas
    gridColor: '#f4f4f5',
    gridColorDark: '#e5e7eb', // Visible on light canvas background
    selectionColor: '#6366f1',
    selectionBorder: '#4f46e5'
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