import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Viewport module state
 */
export interface ViewportState {
  viewport: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
  viewportBounds: { 
    left: number; 
    top: number; 
    right: number; 
    bottom: number 
  } | null;
}

/**
 * Viewport module actions
 */
export interface ViewportActions {
  setViewport: (viewport: Partial<ViewportState['viewport']>) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  zoomViewport: (scale: number, centerX?: number, centerY?: number) => void;
  
  // Legacy compatibility
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (scale: number, centerX?: number, centerY?: number) => void;
}

/**
 * Creates the viewport module
 */
export const createViewportModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<ViewportState, ViewportActions> => {
  return {
    state: {
      viewport: { 
        x: 0, 
        y: 0, 
        scale: 1, 
        width: 1920, 
        height: 1080 
      },
      viewportBounds: null,
    },
    
    actions: {
      setViewport: (viewport) => {
        set(state => {
          Object.assign(state.viewport, viewport);
        });
      },
      
      panViewport: (deltaX, deltaY) => {
        set(state => {
          state.viewport.x += deltaX;
          state.viewport.y += deltaY;
        });
      },
      
      zoomViewport: (scale, centerX, centerY) => {
        set(state => {
          state.viewport.scale = Math.max(0.1, Math.min(10, scale));
        });
      },

      // Legacy compatibility
      pan: (deltaX, deltaY) => {
        get().panViewport(deltaX, deltaY);
      },

      zoom: (scale, centerX, centerY) => {
        get().zoomViewport(scale, centerX, centerY);
      },
    },
  };
};