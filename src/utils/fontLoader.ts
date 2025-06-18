// src/utils/fontLoader.ts
/**
 * Font loading utility to ensure fonts are available for canvas rendering
 */

export class FontLoader {
  private static loadedFonts = new Set<string>();
  private static loadPromises = new Map<string, Promise<void>>();

  /**
   * Load a font and ensure it's available for canvas rendering
   */
  static async loadFont(fontFamily: string, fontWeight = '400'): Promise<void> {
    const fontKey = `${fontFamily}-${fontWeight}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return Promise.resolve();
    }

    if (this.loadPromises.has(fontKey)) {
      return this.loadPromises.get(fontKey)!;
    }

    const loadPromise = this.loadFontInternal(fontFamily, fontWeight);
    this.loadPromises.set(fontKey, loadPromise);
    
    try {
      await loadPromise;
      this.loadedFonts.add(fontKey);
    } catch (error) {
      console.warn(`Failed to load font: ${fontFamily}`, error);
      this.loadPromises.delete(fontKey);
    }
  }

  private static async loadFontInternal(fontFamily: string, fontWeight: string): Promise<void> {
    // Check if the font is already available
    if (await this.isFontAvailable(fontFamily)) {
      return;
    }

    // Use the Font Loading API if available
    if ('fonts' in document) {
      try {
        const font = new FontFace(fontFamily, `url(https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@${fontWeight})`, {
          weight: fontWeight,
        });
        
        await font.load();
        document.fonts.add(font);
        return;
      } catch (error) {
        console.warn(`Font Loading API failed for ${fontFamily}:`, error);
      }
    }    // Fallback: create a hidden element to trigger font loading
    return new Promise((resolve) => {
      const testElement = document.createElement('div');
      testElement.style.fontFamily = fontFamily;
      testElement.style.fontSize = '12px';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      testElement.textContent = 'Font loading test';
      
      document.body.appendChild(testElement);
      
      // Give the font some time to load
      setTimeout(() => {
        document.body.removeChild(testElement);
        resolve();
      }, 100);
    });
  }  /**
   * Check if a font is available in the browser
   */
  private static async isFontAvailable(fontFamily: string): Promise<boolean> {
    if (typeof document === 'undefined' || typeof window === 'undefined') return false;
    
    if ('fonts' in document) {
      return document.fonts.check(`12px "${fontFamily}"`);
    }
    
    // Fallback detection method
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;
    
    const testText = 'AbCdEfGhIjKlMnOpQrStUvWxYz';
    
    // Measure with fallback font
    context.font = '12px monospace';
    const fallbackWidth = context.measureText(testText).width;
    
    // Measure with target font
    context.font = `12px "${fontFamily}", monospace`;
    const targetWidth = context.measureText(testText).width;
    
    return Math.abs(fallbackWidth - targetWidth) > 1;
  }

  /**
   * Get the best available font from a font stack
   */
  static async getBestAvailableFont(fontStack: string): Promise<string> {
    const fonts = fontStack.split(',').map(font => font.trim().replace(/['"]/g, ''));
    
    for (const font of fonts) {
      if (await this.isFontAvailable(font)) {
        return font;
      }
    }
    
    return 'sans-serif'; // Ultimate fallback
  }
}

/**
 * Initialize font loading for the application
 */
export async function initializeFonts(): Promise<void> {
  try {
    await FontLoader.loadFont('Inter', '400');
    await FontLoader.loadFont('Inter', '500');
    await FontLoader.loadFont('Inter', '600');
    console.log('✅ Fonts loaded successfully');
  } catch (error) {
    console.warn('⚠️ Some fonts failed to load:', error);
  }
}
