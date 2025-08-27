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
  zoomTo: (x: number, y: number, scale?: number) => void;
  
  // Legacy compatibility
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (scale: number, centerX?: number, centerY?: number) => void;
  setZoom: (scale: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

/**
 * Creates the viewport module
 */
export const createViewportModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<ViewportState, ViewportActions> => {
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get as any;

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
        setState((state: any) => {
          // Validate scale if provided
          if (viewport.scale !== undefined) {
            viewport.scale = Math.max(0.1, Math.min(10, viewport.scale));
          }
          Object.assign(state.viewport, viewport);
        });
      },
      
      panViewport: (deltaX, deltaY) => {
        setState((state: any) => {
          state.viewport.x += deltaX;
          state.viewport.y += deltaY;
        });
      },
      
      zoomViewport: (scale, centerX, centerY) => {
        setState((state: any) => {
          const oldScale = state.viewport.scale;
          const newScale = Math.max(0.1, Math.min(10, scale));
          
          // If center point is provided, adjust pan to zoom around that point
          if (centerX !== undefined && centerY !== undefined) {
            const dx = centerX - state.viewport.width / 2;
            const dy = centerY - state.viewport.height / 2;
            
            // Calculate the difference in position due to scaling
            const scaleFactor = newScale / oldScale;
            state.viewport.x = centerX - (centerX - state.viewport.x) * scaleFactor;
            state.viewport.y = centerY - (centerY - state.viewport.y) * scaleFactor;
          }
          
          state.viewport.scale = newScale;
        });
      },

      zoomTo: (x, y, scale) => {
        setState((state: any) => {
          const targetScale = scale || state.viewport.scale * 1.2;
          const clampedScale = Math.max(0.1, Math.min(10, targetScale));
          
          // Calculate current viewport center
          const viewportCenterX = state.viewport.width / 2;
          const viewportCenterY = state.viewport.height / 2;
          
          // Transform target point to viewport coordinates
          const currentX = (x - state.viewport.x) / state.viewport.scale;
          const currentY = (y - state.viewport.y) / state.viewport.scale;
          
          // Calculate new viewport position to center the target point
          const newX = x - currentX * clampedScale;
          const newY = y - currentY * clampedScale;
          
          // Update viewport
          state.viewport.x = newX;
          state.viewport.y = newY;
          state.viewport.scale = clampedScale;
        });
      },

      // Legacy compatibility
      pan: (deltaX, deltaY) => {
        getState().panViewport(deltaX, deltaY);
      },

      zoom: (scale, centerX, centerY) => {
        getState().zoomViewport(scale, centerX, centerY);
      },

      setZoom: (scale) => {
        getState().zoomViewport(scale);
      },

      setPan: (x, y) => {
        setState((state: any) => {
          state.viewport.x = x;
          state.viewport.y = y;
        });
      },

      zoomIn: () => {
        const currentScale = getState().viewport.scale;
        getState().zoomViewport(currentScale * 1.2);
      },

      zoomOut: () => {
        const currentScale = getState().viewport.scale;
        getState().zoomViewport(currentScale / 1.2);
      },
    },
  };
};