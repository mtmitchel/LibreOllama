/**
 * Fabric.js Theme Utilities
 * Simplified version for Fabric.js compatibility
 */

/**
 * Convert hex string to RGB object for Fabric.js
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert hex string to number (legacy compatibility)
 */
export function hexStringToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Get CSS custom property value
 */
function getCSSCustomProperty(propertyName: string, fallback: string = ''): string {
  if (typeof window !== 'undefined') {
    const rootStyles = getComputedStyle(document.documentElement);
    const value = rootStyles.getPropertyValue(propertyName).trim();
    return value || fallback;
  }
  return fallback;
}

/**
 * Get theme-aware canvas colors from CSS custom properties
 */
export function getCanvasThemeColors() {
  return {
    background: getCSSCustomProperty('--canvas-bg', '#ffffff'),
    textColor: getCSSCustomProperty('--canvas-text-color', '#000000'),
    elementFill: getCSSCustomProperty('--canvas-element-fill', '#3b82f6'),
    elementStroke: getCSSCustomProperty('--canvas-element-stroke', '#1e40af'),
    stickyBackground: getCSSCustomProperty('--canvas-sticky-bg', '#FFFEF8'),
    selectionColor: getCSSCustomProperty('--canvas-selection', '#3b82f6'),
    accentPrimary: getCSSCustomProperty('--accent-primary', '#3b82f6'),
    success: getCSSCustomProperty('--success', '#10b981'),
    warning: getCSSCustomProperty('--warning', '#f59e0b'),
    error: getCSSCustomProperty('--error', '#ef4444'),
  };
}

/**
 * Get default theme colors for canvas elements
 */
export function getThemeColors() {
  // Use theme-aware colors
  const themeColors = getCanvasThemeColors();
  return {
    primary: themeColors.accentPrimary,
    secondary: themeColors.success,
    accent: themeColors.warning,
    danger: themeColors.error,
    text: themeColors.textColor,
    background: themeColors.background,
    border: themeColors.elementStroke
  };
}

/**
 * Get default colors for different element types
 */
export function getDefaultElementColors(type: string) {
  const colors = getThemeColors();
  
  switch (type) {
    case 'text':
      return { color: colors.text, backgroundColor: 'transparent' };
    case 'rectangle':
    case 'square':
      return { color: colors.primary, backgroundColor: colors.primary, strokeColor: colors.border };
    case 'circle':
      return { color: colors.secondary, backgroundColor: colors.secondary, strokeColor: colors.border };
    case 'triangle':
      return { color: colors.accent, backgroundColor: colors.accent, strokeColor: colors.border };
    case 'line':
    case 'drawing':
      return { color: colors.danger, strokeColor: colors.danger };
    case 'arrow':
      return { color: colors.danger, backgroundColor: colors.danger, strokeColor: colors.border };
    case 'star':
      return { color: colors.accent, backgroundColor: colors.accent, strokeColor: colors.border };
    case 'hexagon':
      return { color: colors.primary, backgroundColor: colors.primary, strokeColor: colors.border };
    case 'sticky-note':
      return { color: colors.text, backgroundColor: '#FFFFE0' };
    default:
      return { color: colors.text, backgroundColor: colors.background, strokeColor: colors.border };
  }
}

/**
 * Validate canvas element (simplified)
 */
export function validateCanvasElement(element: any): boolean {
  return element && 
         typeof element.id === 'string' && 
         typeof element.type === 'string' &&
         typeof element.x === 'number' &&
         typeof element.y === 'number';
}
