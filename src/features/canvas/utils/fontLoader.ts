// src/features/canvas/utils/fontLoader.ts
import { designSystem } from '../../../styles/designSystem';

/**
 * Ensures fonts are loaded before using them in Konva
 * This prevents fallback to default fonts during initial render
 */
export const ensureFontsLoaded = async (): Promise<void> => {
  if (typeof document === 'undefined') return;

  try {
    // Check if document.fonts is available (modern browsers)
    if ('fonts' in document) {
      // Wait for Inter font to load
      await document.fonts.load(`16px ${designSystem.typography.fontFamily.sans}`);
      await document.fonts.load(`14px ${designSystem.typography.fontFamily.sans}`);
      await document.fonts.load(`12px ${designSystem.typography.fontFamily.sans}`);
    } else {
      // Fallback for older browsers - just wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.warn('Font loading failed, continuing with fallback fonts:', error);
  }
};

/**
 * Get the best available font family for Konva text rendering
 */
export const getAvailableFontFamily = (): string => {
  // Return the design system font family - browser will handle fallbacks
  return designSystem.typography.fontFamily.sans;
};
