// Granular Selectors for Canvas State Management
// Optimized selectors to prevent unnecessary re-renders

import type { CanvasElement } from '../types';

// These will be implemented once we have the actual store interface
export interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedElementIds: string[];
  currentTool: string;
  isDrawing: boolean;
  pan: { x: number; y: number };
  zoom: number;
  history: any[];
  redoStack: any[];
}

// Store hook placeholder - will be imported from actual store
type StoreSelector<T> = (state: CanvasState) => T;
declare const useKonvaCanvasStore: <T>(selector: StoreSelector<T>) => T;

// Selector utilities for fine-grained subscriptions
export const useElementProperty = <T>(
  elementId: string, 
  property: keyof CanvasElement
): T | undefined => {
  return useKonvaCanvasStore(
    (state: CanvasState) => state.elements[elementId]?.[property] as T
  );
};

// Optimized position selectors
export const useElementPosition = (elementId: string) => {
  return useKonvaCanvasStore(
    (state: CanvasState) => {
      const element = state.elements[elementId];
      return element ? { x: element.x, y: element.y } : null;
    }
  );
};

// Optimized dimension selectors
export const useElementDimensions = (elementId: string) => {
  return useKonvaCanvasStore(
    (state: CanvasState) => {
      const element = state.elements[elementId];
      return element ? { 
        width: element.width || 0, 
        height: element.height || 0 
      } : null;
    }
  );
};

// Style-specific selectors
export const useElementStyle = (elementId: string) => {
  return useKonvaCanvasStore(
    (state: CanvasState) => {
      const element = state.elements[elementId];
      return element ? {
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth
      } : null;
    }
  );
};

// Selection state selectors
export const useIsElementSelected = (elementId: string): boolean => {
  return useKonvaCanvasStore(
    (state: CanvasState) => state.selectedElementIds.includes(elementId)
  );
};

// Multiple element selectors with memoization
export const useSelectedElements = () => {
  return useKonvaCanvasStore(
    (state: CanvasState) => state.selectedElementIds
      .map((id: string) => state.elements[id])
      .filter(Boolean)
  );
};

// Viewport-specific selectors
export const useViewportElements = (bounds: { x: number; y: number; width: number; height: number }) => {
  return useKonvaCanvasStore(
    (state: CanvasState) => Object.values(state.elements).filter((element: CanvasElement) => {
      // Simple bounding box intersection
      return element.x + (element.width || 0) >= bounds.x &&
             element.x <= bounds.x + bounds.width &&
             element.y + (element.height || 0) >= bounds.y &&
             element.y <= bounds.y + bounds.height;
    })
  );
};

// Performance metrics selectors
export const useElementCount = () => {
  return useKonvaCanvasStore((state: CanvasState) => Object.keys(state.elements).length);
};

export const useSelectedElementCount = () => {
  return useKonvaCanvasStore((state: CanvasState) => state.selectedElementIds.length);
};

// Type-specific element selectors
export const useElementsByType = (type: string) => {
  return useKonvaCanvasStore(
    (state: CanvasState) => Object.values(state.elements).filter((element: CanvasElement) => element.type === type)
  );
};

// History and undo/redo selectors
export const useCanUndoRedo = () => {
  return useKonvaCanvasStore(
    (state: CanvasState) => ({
      canUndo: state.history.length > 0,
      canRedo: state.redoStack.length > 0
    })
  );
};

// Tool and interaction state selectors
export const useCurrentTool = () => {
  return useKonvaCanvasStore((state: CanvasState) => state.currentTool);
};

export const useIsDrawing = () => {
  return useKonvaCanvasStore((state: CanvasState) => state.isDrawing);
};

// Zoom and pan state selectors
export const useViewportTransform = () => {
  return useKonvaCanvasStore(
    (state: CanvasState) => ({
      x: state.pan.x,
      y: state.pan.y,
      scaleX: state.zoom,
      scaleY: state.zoom
    })
  );
};

// Batch selectors for performance
export const useElementsInRegion = (region: { x: number; y: number; width: number; height: number }) => {
  return useKonvaCanvasStore(
    (state: CanvasState) => {
      const elementsInRegion: CanvasElement[] = [];
      for (const element of Object.values(state.elements)) {
        if (isElementInRegion(element, region)) {
          elementsInRegion.push(element);
        }
      }
      return elementsInRegion;
    }
  );
};

// Helper function for region checking
const isElementInRegion = (
  element: CanvasElement, 
  region: { x: number; y: number; width: number; height: number }
): boolean => {
  const elementRight = element.x + (element.width || 0);
  const elementBottom = element.y + (element.height || 0);
  const regionRight = region.x + region.width;
  const regionBottom = region.y + region.height;

  return element.x < regionRight &&
         elementRight > region.x &&
         element.y < regionBottom &&
         elementBottom > region.y;
};
