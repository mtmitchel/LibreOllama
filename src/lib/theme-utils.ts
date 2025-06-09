import { CanvasElement } from '../stores/canvasStore';

/**
 * Theme utilities for canvas components
 * Provides functions to convert CSS variables to Pixi.js compatible values
 */

/**
 * Gets the computed style value of a CSS variable
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

/**
 * Converts a CSS color value to a Pixi.js hex number
 */
export function cssColorToHex(cssColor: string): number {
  if (!cssColor) return 0x000000;
  
  // Handle CSS variables
  if (cssColor.startsWith('var(')) {
    const varName = cssColor.slice(4, -1);
    cssColor = getCSSVariable(varName);
  }
  
  // Handle hex colors
  if (cssColor.startsWith('#')) {
    const hex = cssColor.slice(1);
    return parseInt(hex, 16);
  }
  
  // Handle rgb/rgba colors
  if (cssColor.startsWith('rgb')) {
    const match = cssColor.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);
      return (r << 16) | (g << 8) | b;
    }
  }
  
  // Fallback for any other format
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = cssColor;
      const computedColor = ctx.fillStyle;
      if (computedColor.startsWith('#')) {
        return parseInt(computedColor.slice(1), 16);
      }
    }
  } catch (e) {
    console.warn('Failed to parse color:', cssColor);
  }
  
  return 0x000000;
}

/**
 * Theme-aware color values for canvas elements
 */
export const getThemeColors = () => ({
  // Background colors
  canvasBackground: cssColorToHex(getCSSVariable('--canvas-bg')),
  surfaceBackground: cssColorToHex(getCSSVariable('--bg-surface')),
  
  // Grid colors
  gridDot: cssColorToHex(getCSSVariable('--canvas-grid-dot')),
  
  // Selection and interaction colors
  selectionBlue: cssColorToHex(getCSSVariable('--canvas-selection')),
  selectionBlueTint: cssColorToHex(getCSSVariable('--canvas-selection-bg')),
  
  // Text colors
  textPrimary: cssColorToHex(getCSSVariable('--text-primary')),
  textSecondary: cssColorToHex(getCSSVariable('--text-secondary')),
  
  // Default element colors (theme-aware)
  defaultShapeColor: cssColorToHex(getCSSVariable('--canvas-element-fill')),
  defaultStrokeColor: cssColorToHex(getCSSVariable('--canvas-element-stroke')),
  defaultTextColor: cssColorToHex(getCSSVariable('--canvas-text-color')),
  
  // Sticky note colors
  stickyNoteDefault: cssColorToHex(getCSSVariable('--canvas-sticky-bg')),
  stickyNoteBorder: cssColorToHex(getCSSVariable('--canvas-sticky-border')),
});

/**
 * Gets default colors for different element types
 */
export const getDefaultElementColors = (elementType: string) => {
  const colors = getThemeColors();
  
  switch (elementType) {
    case 'rectangle':
      return {
        fill: colors.defaultShapeColor,
        stroke: colors.defaultStrokeColor
      };
    case 'circle':
      return {
        fill: colors.defaultShapeColor,
        stroke: colors.defaultStrokeColor
      };
    case 'triangle':
      return {
        fill: colors.defaultShapeColor,
        stroke: colors.defaultStrokeColor
      };
    case 'star':
      return {
        fill: colors.defaultShapeColor,
        stroke: colors.defaultStrokeColor
      };
    case 'hexagon':
      return {
        fill: colors.defaultShapeColor,
        stroke: colors.defaultStrokeColor
      };
    case 'line':
    case 'arrow':
      return {
        stroke: colors.defaultStrokeColor
      };
    case 'text':
      return {
        fill: colors.defaultTextColor
      };
    case 'sticky-note':
      return {
        background: colors.stickyNoteDefault,
        border: colors.stickyNoteBorder,
        text: colors.textPrimary
      };
    default:
      return {
        fill: colors.defaultShapeColor,
        stroke: colors.defaultStrokeColor
      };
  }
};

/**
 * Converts a hex string to Pixi.js number format
 */
export const hexStringToNumber = (hex?: string): number => {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) { // Basic validation
    // console.warn(\`Invalid hex string: ${hex}, defaulting to black.\`);
    return 0x000000; // Default to black
  }
  return parseInt(hex.replace(/^#/, ''), 16);
}

/**
 * Validates that a canvas element has all required properties for rendering
 */
export const validateCanvasElement = (element: Partial<CanvasElement>): element is CanvasElement => {
  if (!element) return false;
  // const { id, type, x, y, width, height } = element; // Only checks these basic props
  // return !!(id && type && typeof x === 'number' && typeof y === 'number' && typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0);
  const { id, type, x, y, width, height, points, x2, y2 } = element;

  if (!id || !type || typeof x !== 'number' || typeof y !== 'number') {
    return false;
  }

  // Type-specific validation for dimensions or critical properties
  switch (type) {
    case 'line':
    case 'arrow':
      return typeof x2 === 'number' && typeof y2 === 'number'; // Lines/arrows need end points
    case 'drawing':
      return Array.isArray(points) && points.length > 0; // Drawings need points
    default:
      // For other shapes, width and height are generally expected, but allow 0 for initial creation.
      // The renderer component should handle default/minimum sizes.
      return typeof width === 'number' && typeof height === 'number';
  }
};

/**
 * Safely gets element dimensions with fallbacks
 */
export const getSafeElementDimensions = (element: any): { width: number; height: number } => {
  const width = Math.max(element.width || 100, 1);
  const height = Math.max(element.height || 100, 1);
  return { width, height };
};