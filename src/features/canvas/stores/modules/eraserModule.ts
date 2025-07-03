import { nanoid } from 'nanoid';
import { CanvasElement, ElementId } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';
import { QuadTree } from '../../utils/spatial/Quadtree';
import { getStrokeBoundingBox } from '../../utils/spatial/getStrokeBoundingBox';

/**
 * Spatial index type
 */
interface SpatialIndex {
  insert: (item: any) => void;
  query: (bounds: any) => any[];
  clear: () => void;
}

/**
 * Eraser module state
 */
export interface EraserState {
  spatialIndex: SpatialIndex | null;
  spatialIndexDirty: boolean;
  eraserBatch: {
    isActive: boolean;
    deletedIds: Set<ElementId>;
    modifiedElements: Map<ElementId, CanvasElement>;
    lastBatchTime: number;
    batchTimeout: any;
  };
}

/**
 * Eraser module actions
 */
export interface EraserActions {
  // Optimized eraser methods
  eraseStrokesInPath: (eraserPath: number[], eraserSize: number) => ElementId[];
  eraseElementsInBounds: (bounds: { x: number; y: number; width: number; height: number }) => ElementId[];
  getStrokesInViewport: () => CanvasElement[];
  updateSpatialIndex: () => void;
  eraseWithSpatialIndex: (eraserX: number, eraserY: number, eraserSize: number) => ElementId[];
  eraseStrokeSegments: (eraserPath: number[], eraserSize: number) => void;
  
  // Eraser batching methods
  startEraserBatch: () => void;
  addToEraserBatch: (elementIds: ElementId[], modifiedElements?: Map<ElementId, CanvasElement>) => void;
  commitEraserBatch: () => void;
  
  // Helper methods
  getPathBounds: (path: number[]) => { x: number; y: number; width: number; height: number };
  boundsIntersect: (element: CanvasElement, bounds: { x: number; y: number; width: number; height: number }) => boolean;
}

/**
 * Creates the eraser module
 */
export const createEraserModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<EraserState, EraserActions> => {
  return {
    state: {
      spatialIndex: null,
      spatialIndexDirty: true,
      eraserBatch: {
        isActive: false,
        deletedIds: new Set<ElementId>(),
        modifiedElements: new Map<ElementId, CanvasElement>(),
        lastBatchTime: 0,
        batchTimeout: null
      },
    },
    
    actions: {
      // Helper function to get path bounds
      getPathBounds: (path: number[]) => {
        if (path.length < 2) return { x: 0, y: 0, width: 0, height: 0 };
        let minX = path[0], minY = path[1], maxX = path[0], maxY = path[1];
        for (let i = 2; i < path.length; i += 2) {
          minX = Math.min(minX, path[i]);
          maxX = Math.max(maxX, path[i]);
          minY = Math.min(minY, path[i + 1]);
          maxY = Math.max(maxY, path[i + 1]);
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      },

      // Helper function to check bounds intersection
      boundsIntersect: (element: CanvasElement, bounds: { x: number; y: number; width: number; height: number }) => {
        const elLeft = element.x || 0;
        const elTop = element.y || 0;
        const elRight = elLeft + (element.width || 0);
        const elBottom = elTop + (element.height || 0);
        
        const boundsRight = bounds.x + bounds.width;
        const boundsBottom = bounds.y + bounds.height;
        
        return !(elRight < bounds.x || elLeft > boundsRight || elBottom < bounds.y || elTop > boundsBottom);
      },

      // Update spatial index for fast lookups
      updateSpatialIndex: () => {
        set(state => {
          if (!state.spatialIndex) {
            state.spatialIndex = new QuadTree({ x: -5000, y: -5000, width: 10000, height: 10000 });
          }
          
          state.spatialIndex.clear();
          
          // Index only erasable elements
          state.elements.forEach((element, id) => {
            if (element.type === 'pen' || element.type === 'marker' || element.type === 'highlighter') {
              if (element.x !== undefined && element.y !== undefined) {
                state.spatialIndex!.insert({
                  id,
                  x: element.x,
                  y: element.y,
                  width: element.width || 1,
                  height: element.height || 1
                });
              }
            }
          });
          
          state.spatialIndexDirty = false;
        });
      },

      // Optimized erase using spatial index
      eraseWithSpatialIndex: (eraserX: number, eraserY: number, eraserSize: number) => {
        const { spatialIndex, spatialIndexDirty } = get();
        
        // Update index if needed
        if (spatialIndexDirty || !spatialIndex) {
          get().updateSpatialIndex();
        }
        
        // Query spatial index
        const candidates = spatialIndex!.query({
          x: eraserX - eraserSize / 2,
          y: eraserY - eraserSize / 2,
          width: eraserSize,
          height: eraserSize
        });
        
        const deletedIds: ElementId[] = [];
        
        set(state => {
          candidates.forEach((id: string) => {
            const element = state.elements.get(id);
            if (!element || !element.points) return;
            
            // Fine-grained check
            const halfSize = eraserSize / 2;
            for (let i = 0; i < element.points.length; i += 2) {
              const dist = Math.hypot(
                element.points[i] - eraserX,
                element.points[i + 1] - eraserY
              );
              
              if (dist <= halfSize) {
                deletedIds.push(id as ElementId);
                state.elements.delete(id);
                state.elementOrder = state.elementOrder.filter(elId => elId !== id);
                break;
              }
            }
          });
          
          if (deletedIds.length > 0) {
            state.spatialIndexDirty = true;
          }
        });
        
        return deletedIds;
      },

      // Erase strokes in path with detailed intersection
      eraseStrokesInPath: (eraserPath: number[], eraserSize: number) => {
        const deletedIds: ElementId[] = [];
        const halfSize = eraserSize / 2;
        
        set(state => {
          // Get eraser bounds for broad phase
          const bounds = get().getPathBounds(eraserPath);
          const expandedBounds = {
            x: bounds.x - halfSize,
            y: bounds.y - halfSize,
            width: bounds.width + eraserSize,
            height: bounds.height + eraserSize
          };
          
          // Check only elements that could intersect
          state.elements.forEach((element, id) => {
            // Skip non-erasable elements
            if (element.type !== 'pen' && element.type !== 'marker' && element.type !== 'highlighter') {
              return;
            }
            
            // Quick bounds check first
            if (!get().boundsIntersect(element, expandedBounds)) {
              return;
            }
            
            // Check if any points are within eraser radius
            if (element.points) {
              for (let i = 0; i < element.points.length; i += 2) {
                const px = element.points[i];
                const py = element.points[i + 1];
                
                // Check against eraser path
                for (let j = 0; j < eraserPath.length; j += 2) {
                  const ex = eraserPath[j];
                  const ey = eraserPath[j + 1];
                  const dist = Math.hypot(px - ex, py - ey);
                  
                  if (dist <= halfSize) {
                    // Mark for deletion
                    deletedIds.push(id as ElementId);
                    state.elements.delete(id);
                    state.elementOrder = state.elementOrder.filter(elId => elId !== id);
                    break;
                  }
                }
                
                if (deletedIds.includes(id as ElementId)) break;
              }
            }
          });
        });
        
        if (deletedIds.length > 0) {
          get().addToHistory('eraseStrokes');
        }
        
        return deletedIds;
      },

      // Get only strokes visible in current viewport for optimization
      getStrokesInViewport: () => {
        const { elements, viewport } = get();
        const viewportBounds = {
          x: -viewport.x / viewport.scale,
          y: -viewport.y / viewport.scale,
          width: viewport.width / viewport.scale,
          height: viewport.height / viewport.scale
        };
        
        return Array.from(elements.values()).filter(el => {
          if (el.type !== 'pen' && el.type !== 'marker' && el.type !== 'highlighter') {
            return false;
          }
          return get().boundsIntersect(el, viewportBounds);
        });
      },

      // Erase elements within bounds
      eraseElementsInBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
        const deletedIds: ElementId[] = [];
        
        set(state => {
          state.elements.forEach((element, id) => {
            if (element.type !== 'pen' && element.type !== 'marker' && element.type !== 'highlighter') {
              return;
            }
            
            if (get().boundsIntersect(element, bounds)) {
              deletedIds.push(id as ElementId);
              state.elements.delete(id);
              state.elementOrder = state.elementOrder.filter(elId => elId !== id);
            }
          });
        });
        
        if (deletedIds.length > 0) {
          get().addToHistory('eraseElements');
        }
        
        return deletedIds;
      },

      // Segment-based erasing for more natural stroke editing
      eraseStrokeSegments: (eraserPath: number[], eraserSize: number) => {
        const modifiedElements: Array<{ id: string; newSegments: number[][] }> = [];
        const halfSize = eraserSize / 2;
        
        set(state => {
          state.elements.forEach((element, id) => {
            if (!element.points || element.points.length < 4) return;
            if (element.type !== 'pen' && element.type !== 'marker' && element.type !== 'highlighter') return;
            
            const segments: number[][] = [];
            let currentSegment: number[] = [];
            
            for (let i = 0; i < element.points.length; i += 2) {
              const px = element.points[i];
              const py = element.points[i + 1];
              let isErased = false;
              
              // Check if point should be erased
              for (let j = 0; j < eraserPath.length; j += 2) {
                const dist = Math.hypot(px - eraserPath[j], py - eraserPath[j + 1]);
                if (dist <= halfSize) {
                  isErased = true;
                  break;
                }
              }
              
              if (!isErased) {
                currentSegment.push(px, py);
              } else if (currentSegment.length >= 4) {
                // Save current segment if it has at least 2 points
                segments.push([...currentSegment]);
                currentSegment = [];
              } else {
                currentSegment = [];
              }
            }
            
            // Add final segment if exists
            if (currentSegment.length >= 4) {
              segments.push(currentSegment);
            }
            
            // Handle the results
            if (segments.length === 0) {
              // Entire stroke erased
              state.elements.delete(id);
              state.elementOrder = state.elementOrder.filter(elId => elId !== id);
            } else if (segments.length === 1 && segments[0].length === element.points.length) {
              // Nothing was erased
              return;
            } else if (segments.length === 1) {
              // Update existing element with remaining segment
              element.points = segments[0];
              const bounds = getStrokeBoundingBox(segments[0]);
              Object.assign(element, bounds);
            } else {
              // Multiple segments - keep first, create new elements for others
              element.points = segments[0];
              const bounds = getStrokeBoundingBox(segments[0]);
              Object.assign(element, bounds);
              
              // Create new elements for other segments
              for (let i = 1; i < segments.length; i++) {
                const newElement = {
                  ...element,
                  id: nanoid() as ElementId,
                  points: segments[i],
                  ...getStrokeBoundingBox(segments[i])
                };
                state.elements.set(newElement.id, newElement);
                state.elementOrder.push(newElement.id);
              }
            }
          });
        });
        
        get().addToHistory('eraseSegments');
      },

      // Start eraser batch
      startEraserBatch: () => {
        set(state => {
          state.eraserBatch.isActive = true;
          state.eraserBatch.deletedIds.clear();
          state.eraserBatch.modifiedElements.clear();
          state.eraserBatch.lastBatchTime = Date.now();
        });
      },

      // Add to eraser batch
      addToEraserBatch: (elementIds: ElementId[], modifiedElements?: Map<ElementId, CanvasElement>) => {
        set(state => {
          elementIds.forEach(id => state.eraserBatch.deletedIds.add(id));
          
          if (modifiedElements) {
            modifiedElements.forEach((element, id) => {
              state.eraserBatch.modifiedElements.set(id, element);
            });
          }
          
          // Clear existing timeout
          if (state.eraserBatch.batchTimeout) {
            clearTimeout(state.eraserBatch.batchTimeout);
          }
          
          // Set new timeout to commit batch
          state.eraserBatch.batchTimeout = setTimeout(() => {
            get().commitEraserBatch();
          }, 50); // Commit after 50ms of inactivity
        });
      },

      // Commit eraser batch
      commitEraserBatch: () => {
        const { eraserBatch } = get();
        
        if (eraserBatch.deletedIds.size === 0 && eraserBatch.modifiedElements.size === 0) {
          set(state => {
            state.eraserBatch.isActive = false;
          });
          return;
        }
        
        set(state => {
          // Apply all batched modifications
          eraserBatch.modifiedElements.forEach((element, id) => {
            state.elements.set(id, element);
          });
          
          // Delete all batched elements at once
          eraserBatch.deletedIds.forEach(id => {
            state.elements.delete(id);
          });
          
          // Update element order once
          state.elementOrder = state.elementOrder.filter(
            id => !eraserBatch.deletedIds.has(id as ElementId)
          );
          
          // Clear selection if needed
          eraserBatch.deletedIds.forEach(id => {
            state.selectedElementIds?.delete(id);
          });
          
          // Reset batch
          state.eraserBatch.isActive = false;
          state.eraserBatch.deletedIds.clear();
          state.eraserBatch.modifiedElements.clear();
          
          if (state.eraserBatch.batchTimeout) {
            clearTimeout(state.eraserBatch.batchTimeout);
            state.eraserBatch.batchTimeout = null;
          }
          
          // Mark spatial index as dirty
          state.spatialIndexDirty = true;
        });
        
        get().addToHistory('eraserBatch');
      },
    },
  };
};