import { nanoid } from 'nanoid';
import { CanvasElement, ElementId } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';
import { SimpleEraserIndex, BoundingBox } from '../../utils/spatial/SimpleEraserIndex';

/**
 * Simplified Eraser module state - MVP version for maintainability
 */
export interface EraserState {
  spatialIndex: SimpleEraserIndex | null;
  spatialIndexDirty: boolean;
}

/**
 * Simplified Eraser module actions - core functionality only
 */
export interface EraserActions {
  // Core erasing methods
  eraseAtPoint: (x: number, y: number, eraserSize: number) => ElementId[];
  eraseInPath: (eraserPath: number[], eraserSize: number) => ElementId[];
  eraseInBounds: (bounds: BoundingBox) => ElementId[];
  
  // Spatial indexing
  updateSpatialIndex: () => void;
  clearSpatialIndex: () => void;
  
  // Helper methods
  getPathBounds: (path: number[]) => BoundingBox;
  isElementErasable: (element: CanvasElement) => boolean;
}

/**
 * Creates the simplified eraser module
 */
export const createEraserModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<EraserState, EraserActions> => {
  return {
    state: {
      spatialIndex: null,
      spatialIndexDirty: true,
    },
    
    actions: {
      /**
       * Check if element can be erased
       */
      isElementErasable: (element: CanvasElement) => {
        return element.type === 'pen' || element.type === 'marker' || element.type === 'highlighter';
      },

      /**
       * Get bounding box of a path
       */
      getPathBounds: (path: number[]) => {
        if (path.length < 2) return { x: 0, y: 0, width: 0, height: 0 };
        
        let minX = path[0];
        let minY = path[1];
        let maxX = path[0];
        let maxY = path[1];
        
        for (let i = 2; i < path.length; i += 2) {
          minX = Math.min(minX, path[i]);
          maxX = Math.max(maxX, path[i]);
          minY = Math.min(minY, path[i + 1]);
          maxY = Math.max(maxY, path[i + 1]);
        }
        
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      },

      /**
       * Update spatial index with current elements
       */
      updateSpatialIndex: () => {
        set(state => {
          if (!state.spatialIndex) {
            state.spatialIndex = new SimpleEraserIndex();
          }
          
          // Rebuild index with erasable elements only
          const erasableElements: CanvasElement[] = [];
          
          state.elements.forEach((element: CanvasElement) => {
            if (get().isElementErasable(element)) {
              erasableElements.push(element);
            }
          });
          

          
          state.spatialIndex.rebuild(erasableElements);
          state.spatialIndexDirty = false;
        });
      },

      /**
       * Clear spatial index
       */
      clearSpatialIndex: () => {
        set(state => {
          if (state.spatialIndex) {
            state.spatialIndex.clear();
          }
          state.spatialIndexDirty = true;
        });
      },

      /**
       * Erase elements at a single point
       */
      eraseAtPoint: (x: number, y: number, eraserSize: number) => {
        const { spatialIndex, spatialIndexDirty } = get();
        
        // Update spatial index if needed
        if (spatialIndexDirty || !spatialIndex) {
          get().updateSpatialIndex();
        }
        
        const halfSize = eraserSize / 2;
        const eraserBounds = {
          x: x - halfSize,
          y: y - halfSize,
          width: eraserSize,
          height: eraserSize
        };
        
        // Find candidate elements using spatial index
        const candidateIds = get().spatialIndex!.findIntersections(eraserBounds);
        const deletedIds: ElementId[] = [];
        
        set(state => {
          candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
            const element = state.elements.get(id);
            
            if (!element || !get().isElementErasable(element)) return;
            
            // Check if any point is within eraser radius
            const points = (element as any).points;
            if (points && Array.isArray(points)) {
              for (let i = 0; i < points.length; i += 2) {
                const px = points[i];
                const py = points[i + 1];
                const dist = Math.hypot(px - x, py - y);
                
                if (dist <= halfSize) {

                  deletedIds.push(id as ElementId);
                  state.elements.delete(id);
                  state.elementOrder = state.elementOrder.filter((elId: any) => elId !== id);
                  state.spatialIndexDirty = true;
                  break;
                }
              }
            }
          });
        });
        
        if (deletedIds.length > 0) {
          get().addToHistory('Erase strokes');
        }
        
        return deletedIds;
      },

      /**
       * Erase elements along a path
       */
      eraseInPath: (eraserPath: number[], eraserSize: number) => {
        if (eraserPath.length < 2) return [];
        
        const { spatialIndex, spatialIndexDirty } = get();
        
        // Update spatial index if needed
        if (spatialIndexDirty || !spatialIndex) {
          get().updateSpatialIndex();
        }
        
        // Get path bounds and find candidates
        const candidateIds = get().spatialIndex!.findPathIntersections(eraserPath, eraserSize);
        const deletedIds: ElementId[] = [];
        const halfSize = eraserSize / 2;
        
        set(state => {
          candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
            const element = state.elements.get(id);
            if (!element || !get().isElementErasable(element)) return;
            
            // Check if any point intersects with eraser path
            const points = (element as any).points;
            if (points && Array.isArray(points)) {
              let shouldDelete = false;
              
              for (let i = 0; i < points.length && !shouldDelete; i += 2) {
                const px = points[i];
                const py = points[i + 1];
                
                // Check against each point in eraser path
                for (let j = 0; j < eraserPath.length && !shouldDelete; j += 2) {
                  const ex = eraserPath[j];
                  const ey = eraserPath[j + 1];
                  const dist = Math.hypot(px - ex, py - ey);
                  
                  if (dist <= halfSize) {
                    shouldDelete = true;
                  }
                }
              }
              
              if (shouldDelete) {
                deletedIds.push(id as ElementId);
                state.elements.delete(id);
                state.elementOrder = state.elementOrder.filter((elId: any) => elId !== id);
                state.spatialIndexDirty = true;
              }
            }
          });
        });
        
        if (deletedIds.length > 0) {
          get().addToHistory('Erase strokes');
        }
        
        return deletedIds;
      },

      /**
       * Erase elements within bounds
       */
      eraseInBounds: (bounds: BoundingBox) => {
        const { spatialIndex, spatialIndexDirty } = get();
        
        // Update spatial index if needed
        if (spatialIndexDirty || !spatialIndex) {
          get().updateSpatialIndex();
        }
        
        const candidateIds = get().spatialIndex!.findIntersections(bounds);
        const deletedIds: ElementId[] = [];
        
        set(state => {
          candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
            const element = state.elements.get(id);
            if (!element || !get().isElementErasable(element)) return;
            
            // Simple bounds check - element center within bounds
            const elementX = element.x || 0;
            const elementY = element.y || 0;
            
            if (elementX >= bounds.x && 
                elementX <= bounds.x + bounds.width &&
                elementY >= bounds.y && 
                elementY <= bounds.y + bounds.height) {
              deletedIds.push(id as ElementId);
              state.elements.delete(id);
              state.elementOrder = state.elementOrder.filter((elId: any) => elId !== id);
              state.spatialIndexDirty = true;
            }
          });
        });
        
        if (deletedIds.length > 0) {
          get().addToHistory('Erase elements');
        }
        
        return deletedIds;
      },
    }
  };
};
