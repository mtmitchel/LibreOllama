/**
 * Color utilities for canvas elements
 */

/**
 * Resolve CSS variables to actual color values
 * This is needed because Konva doesn't understand CSS variables
 */
export function resolveCSSVariable(cssVar: string): string {
  // If it's not a CSS variable, return as-is
  if (!cssVar.startsWith('var(')) {
    return cssVar;
  }

  // Create a temporary element to resolve the CSS variable
  const tempElement = document.createElement('div');
  tempElement.style.color = cssVar;
  document.body.appendChild(tempElement);
  
  const computedColor = window.getComputedStyle(tempElement).color;
  document.body.removeChild(tempElement);
  
  // Convert RGB to hex if needed
  if (computedColor.startsWith('rgb')) {
    return rgbToHex(computedColor);
  }
  
  return computedColor;
}

/**
 * Convert RGB color to hex
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Get sticky note color mappings
 * Maps CSS variables to their resolved hex values
 */
export function getStickyNoteColorMap(): Record<string, string> {
  const cssVariables = [
    'var(--stickynote-yellow)',
    'var(--stickynote-green)',
    'var(--stickynote-teal)',
    'var(--stickynote-blue)',
    'var(--stickynote-violet)',
    'var(--stickynote-pink)',
    'var(--stickynote-coral)',
    'var(--stickynote-peach)',
    'var(--stickynote-white)',
    'var(--stickynote-gray)'
  ];
  
  const colorMap: Record<string, string> = {};
  
  cssVariables.forEach(cssVar => {
    colorMap[cssVar] = resolveCSSVariable(cssVar);
  });
  
  return colorMap;
}

/**
 * Calculate a border color that's slightly darker than the background
 */
export function calculateBorderColor(backgroundColor: string): string {
  // Resolve CSS variable if needed
  const resolvedColor = resolveCSSVariable(backgroundColor);
  
  // Convert hex to RGB
  const hex = resolvedColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Darken by 15%
  const darkenFactor = 0.85;
  const newR = Math.round(r * darkenFactor);
  const newG = Math.round(g * darkenFactor);
  const newB = Math.round(b * darkenFactor);
  
  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
} 