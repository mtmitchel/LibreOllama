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
  setZoom: (scale: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (padding?: number) => void;
  resetZoom: () => void;
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
          // Validate scale if provided
          if (viewport.scale !== undefined) {
            viewport.scale = Math.max(0.1, Math.min(10, viewport.scale));
          }
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

      setZoom: (scale) => {
        get().zoomViewport(scale);
      },

      setPan: (x, y) => {
        set(state => {
          state.viewport.x = x;
          state.viewport.y = y;
        });
      },

      zoomIn: () => {
        const currentScale = get().viewport.scale;
        get().zoomViewport(currentScale * 1.2);
      },

      zoomOut: () => {
        const currentScale = get().viewport.scale;
        get().zoomViewport(currentScale / 1.2);
      },

      zoomToFit: (padding = 40) => {
        const { elements, viewport } = get() as any;
        const values = Array.from(elements?.values?.() || []);
        if (values.length === 0) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        values.forEach((el: any) => {
          if (el.type === 'circle') {
            const left = el.x - el.radius;
            const right = el.x + el.radius;
            const top = el.y - el.radius;
            const bottom = el.y + el.radius;
            minX = Math.min(minX, left);
            minY = Math.min(minY, top);
            maxX = Math.max(maxX, right);
            maxY = Math.max(maxY, bottom);
          } else {
            const w = el.width ?? 0; const h = el.height ?? 0;
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + w);
            maxY = Math.max(maxY, el.y + h);
          }
        });
        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return;
        const boundsW = Math.max(1, maxX - minX);
        const boundsH = Math.max(1, maxY - minY);
        const scaleX = (viewport.width - padding * 2) / boundsW;
        const scaleY = (viewport.height - padding * 2) / boundsH;
        const newScale = Math.max(0.1, Math.min(10, Math.min(scaleX, scaleY)));
        const centerX = minX + boundsW / 2;
        const centerY = minY + boundsH / 2;
        // position so that center maps to viewport center
        const posX = viewport.width / 2 - centerX * newScale;
        const posY = viewport.height / 2 - centerY * newScale;
        set(state => {
          state.viewport.scale = newScale;
          state.viewport.x = posX;
          state.viewport.y = posY;
        });
      },

      resetZoom: () => {
        set(state => {
          state.viewport.scale = 1;
          state.viewport.x = 0;
          state.viewport.y = 0;
        });
      },
    },
  };
};