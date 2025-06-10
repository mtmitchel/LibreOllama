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
 * Get default theme colors for canvas elements
 */
export function getThemeColors() {
  return {
    primary: '#4F46E5',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    text: '#1F2937',
    background: '#FFFFFF',
    border: '#E5E7EB'
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
      return { color: colors.primary, backgroundColor: colors.primary };
    case 'circle':
      return { color: colors.secondary, backgroundColor: colors.secondary };
    case 'triangle':
      return { color: colors.accent, backgroundColor: colors.accent };
    case 'line':
    case 'arrow':
      return { color: colors.danger, strokeColor: colors.danger };
    case 'sticky-note':
      return { color: colors.text, backgroundColor: '#FFFFE0' };
    default:
      return { color: colors.text, backgroundColor: colors.background };
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
