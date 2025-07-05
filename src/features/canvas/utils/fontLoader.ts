// src/features/canvas/utils/fontLoader.ts
import { canvasTheme } from './canvasTheme';

/**
 * Ensures fonts are loaded before using them in Konva
 * This prevents fallback to default fonts during initial render
 */
export const ensureFontsLoaded = async (): Promise<boolean> => {
  if (typeof document === 'undefined') return false;

  try {
    // Check if document.fonts is available (modern browsers)
    if ('fonts' in document) {
      // Wait for Inter font to load
      await document.fonts.load(`16px ${canvasTheme.typography.fontFamily.sans}`);
      await document.fonts.load(`14px ${canvasTheme.typography.fontFamily.sans}`);
      await document.fonts.load(`12px ${canvasTheme.typography.fontFamily.sans}`);
    } else {
      // Fallback for older browsers - just wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return true;
  } catch (error) {
    console.warn('Font loading failed, continuing with fallback fonts:', error);
    return false;
  }
};

/**
 * Get the best available font family for Konva text rendering
 */
export const getAvailableFontFamily = (): string => {
  // Return the design system font family - browser will handle fallbacks
  return canvasTheme.typography.fontFamily.sans;
};

