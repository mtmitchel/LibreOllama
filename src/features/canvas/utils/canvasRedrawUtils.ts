// src/utils/canvasRedrawUtils.ts
/**
 * Reliable canvas layer redraw utilities
 * Replaces setTimeout-based workarounds with immediate, synchronous updates
 */

export interface CanvasRedrawOptions {
  immediate?: boolean;
  forceUpdate?: boolean;
  debug?: boolean; // Kept for potential future use, even if not currently read
}

/**
 * Trigger immediate layer redraw for a Konva stage
 * @param stageRef - React ref to the Konva stage
 * @param options - Redraw options
 */
export const triggerLayerRedraw = (
  stageRef: React.RefObject<any> | null, 
  options: CanvasRedrawOptions = {}
): boolean => {
  const { immediate = true, forceUpdate = false } = options; // Removed debug from destructuring
  
  try {
    if (!stageRef?.current) {
      // if (options.debug) console.warn('[CANVAS REDRAW] No stage reference available');
      return false;
    }

    const stage = stageRef.current;
    
    if (!stage.getLayers) {
      // if (options.debug) console.warn('[CANVAS REDRAW] Stage missing getLayers method');
      return false;
    }

    const layers = stage.getLayers();
    
    if (!layers || layers.length === 0) {
      // if (options.debug) console.warn('[CANVAS REDRAW] No layers found on stage');
      return false;
    }

    if (immediate) {
      // Immediate synchronous redraw
      layers.forEach((layer: any) => { // Removed unused index
        if (layer && typeof layer.batchDraw === 'function') {
          layer.batchDraw();
          // if (options.debug) console.log(`[CANVAS REDRAW] Layer redrawn immediately`);
        }
      });
    } else {
      // Use requestAnimationFrame for next frame
      requestAnimationFrame(() => {
        layers.forEach((layer: any) => { // Removed unused index
          if (layer && typeof layer.batchDraw === 'function') {
            layer.batchDraw();
            // if (options.debug) console.log(`[CANVAS REDRAW] Layer redrawn on next frame`);
          }
        });
      });
    }

    if (forceUpdate && stage.draw) {
      stage.draw();
      // if (options.debug) console.log('[CANVAS REDRAW] Stage force-redrawn');
    }

    return true;
  } catch (error) {
    // if (options.debug) console.error('[CANVAS REDRAW] Error during redraw:', error);
    return false;
  }
};

/**
 * Get stage reference from various sources
 * @param sources - Array of potential stage sources
 */
export const getStageRef = (...sources: (React.RefObject<any> | null | undefined)[]): React.RefObject<any> | null => {
  for (const source of sources) {
    if (source?.current) {
      return source;
    }
  }
  
  // Fallback: try to find stage from DOM
  try {
    const canvasContainer = document.querySelector('.konva-canvas-container canvas');
    if (canvasContainer) {
      const konvaStage = (canvasContainer as any).__konvaStage;
      if (konvaStage) {
        return { current: konvaStage };
      }
    }
  } catch (error) {
    console.warn('[CANVAS REDRAW] Failed to find stage from DOM:', error);
  }
  
  return null;
};

/**
 * Create a debounced redraw function to prevent excessive redraws
 * @param stageRef - Stage reference
 * @param delay - Debounce delay in milliseconds
 */
export const createDebouncedRedraw = (
  stageRef: React.RefObject<any> | null,
  delay: number = 16
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (options: CanvasRedrawOptions = {}) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      triggerLayerRedraw(stageRef, options);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Validate that a stage reference is ready for redraw operations
 * @param stageRef - Stage reference to validate
 */
export const validateStageRef = (stageRef: React.RefObject<any> | null): boolean => {
  return !!(
    stageRef?.current &&
    typeof stageRef.current.getLayers === 'function' &&
    stageRef.current.getLayers().length > 0
  );
};