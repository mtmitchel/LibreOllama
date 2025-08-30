import { nanoid } from 'nanoid';
import { 
  MarkerConfig, 
  HighlighterConfig, 
  EraserConfig 
} from '../../types/drawing.types';
import { createElementId, ElementId, CanvasElement } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';
import { SimpleEraserIndex, BoundingBox } from '../../utils/spatial/SimpleEraserIndex';

/**
 * Drawing module state (includes eraser functionality)
 */
export interface DrawingState {
  isDrawing: boolean;
  currentPath?: number[];
  drawingTool: 'pen' | 'pencil' | 'marker' | 'highlighter' | 'eraser' | null;
  drawingStartPoint: { x: number; y: number } | null;
  drawingCurrentPoint: { x: number; y: number } | null;
  
  // Draft section for live preview
  draftSection: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  
  // Drawing tool configurations
  strokeConfig: {
    marker: MarkerConfig;
    highlighter: HighlighterConfig;
    eraser: EraserConfig;
  };

  // Eraser functionality (merged from eraserModule)
  spatialIndex: SimpleEraserIndex | null;
  spatialIndexDirty: boolean;
}

/**
 * Drawing module actions (includes eraser functionality)
 */
export interface DrawingActions {
  // Drawing operations
  startDrawing: (tool: 'pen' | 'pencil' | 'marker' | 'highlighter' | 'eraser', point: { x: number; y: number }) => void;
  updateDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  
  // Draft sections
  startDraftSection: (point: { x: number; y: number }) => void;
  updateDraftSection: (point: { x: number; y: number }) => void;
  commitDraftSection: () => string | null;
  cancelDraftSection: () => void;
  
  // Stroke Configuration
  updateStrokeConfig: (tool: 'marker' | 'highlighter' | 'eraser', config: Partial<MarkerConfig | HighlighterConfig | EraserConfig>) => void;

  // Eraser operations (merged from eraserModule)
  eraseAtPoint: (x: number, y: number, eraserSize: number) => ElementId[];
  eraseInPath: (eraserPath: number[], eraserSize: number) => ElementId[];
  eraseInBounds: (bounds: BoundingBox) => ElementId[];
  updateSpatialIndex: () => void;
  clearSpatialIndex: () => void;
  getPathBounds: (path: number[]) => BoundingBox;
  isElementErasable: (element: CanvasElement) => boolean;
}

/**
 * Creates the drawing module
 */
export const createDrawingModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<DrawingState, DrawingActions> => {
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get as any;

  return {
    state: {
      isDrawing: false,
      drawingTool: null,
      drawingStartPoint: null,
      draftSection: null,
      drawingCurrentPoint: null,
      
      strokeConfig: {
        marker: {
          color: '#000000',
          minWidth: 2,
          maxWidth: 20,
          opacity: 1,
          smoothness: 0.5,
          widthVariation: true,
          pressureSensitive: true
        },
        highlighter: {
          color: '#FFFF00',
          width: 16,
          opacity: 0.4,
          blendMode: 'multiply',
          lockToElements: false
        },
        eraser: {
          size: 30,
          mode: 'stroke',
          strength: 1
        }
      },

      // Eraser state (merged from eraserModule)
      spatialIndex: null,
      spatialIndexDirty: true,
    },
    
    actions: {
      startDrawing: (tool, point) => {
        setState((state: any) => {
          state.isDrawing = true;
          state.drawingTool = tool;
          state.drawingStartPoint = point;
          // Avoid populating currentPath in store to prevent per-move re-renders
          state.currentPath = undefined;
          state.drawingCurrentPoint = point;
        });
      },
      
      updateDrawing: (point) => {
        const state = getState() as any;
        if (!state.isDrawing || !state.currentPath) {
          // Skip store updates during high-frequency drawing when using direct Konva preview
          return;
        }
        setState((draft: any) => {
          draft.currentPath.push(point.x, point.y);
          draft.drawingCurrentPoint = point;
        });
      },
      
      finishDrawing: () => {
        const state = getState() as any;
        if (state.isDrawing && state.currentPath && state.currentPath.length >= 4) {
          // Create pen element with fallback color
          const penColor = (getState() as any).penColor || '#000000';
          
          const penElement = {
            id: createElementId(nanoid()),
            type: 'pen' as const,
            x: 0,
            y: 0,
            points: [...state.currentPath],
            stroke: penColor,
            strokeWidth: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isLocked: false,
            isHidden: false
          };
          
          // Add to store
          (getState() as any).addElement(penElement);
          
          // Check if the stroke was created within a sticky note container
          const startPoint = { x: state.currentPath[0], y: state.currentPath[1] };
          // Checking for sticky note at start point
          const stickyNoteId = (getState() as any).findStickyNoteAtPoint?.(startPoint);
          
          if (stickyNoteId) {
            // Adding pen stroke to sticky note container
            (getState() as any).addElementToStickyNote?.(penElement.id, stickyNoteId);
          } else {
            // No sticky note container found at start point
          }
        }
        
        // Reset drawing state
        setState((state: any) => {
          state.isDrawing = false;
          state.drawingTool = null;
          state.drawingStartPoint = null;
          state.currentPath = undefined;
          state.drawingCurrentPoint = null;
        });
      },
      
      cancelDrawing: () => {
        setState((state: any) => {
          state.isDrawing = false;
          state.drawingTool = null;
          state.drawingStartPoint = null;
          state.currentPath = undefined;
          state.drawingCurrentPoint = null;
        });
      },

      // Section draft operations  
      startDraftSection: (point) => {
        setState((state: any) => {
          state.draftSection = {
            id: nanoid(),
            x: point.x,
            y: point.y,
            width: 0,
            height: 0
          };
        });
      },
      
      updateDraftSection: (point) => {
        setState((state: any) => {
          if (state.draftSection) {
            const startX = state.draftSection.x;
            const startY = state.draftSection.y;
            
            // Calculate normalized bounds (handle drag in any direction)
            const x = Math.min(point.x, startX);
            const y = Math.min(point.y, startY);
            const width = Math.abs(point.x - startX);
            const height = Math.abs(point.y - startY);
            
            state.draftSection.x = x;
            state.draftSection.y = y;
            state.draftSection.width = width;
            state.draftSection.height = height;
          }
        });
      },
      
      commitDraftSection: () => {
        const state = getState() as any;
        if (state.draftSection && state.draftSection.width > 10 && state.draftSection.height > 10) {
          const sectionId = (getState() as any).createSection?.(
            state.draftSection.x,
            state.draftSection.y,
            state.draftSection.width,
            state.draftSection.height
          );
          
          // Clear draft
          setState((state: any) => {
            state.draftSection = null;
          });
          
          return sectionId;
        }
        
        // Clear draft even if too small
        setState((state: any) => {
          state.draftSection = null;
        });
        
        return null;
      },
      
      cancelDraftSection: () => {
        setState((state: any) => {
          state.draftSection = null;
        });
      },

      // Stroke Configuration
      updateStrokeConfig: (tool, config) => {
        setState((state: any) => {
          Object.assign(state.strokeConfig[tool], config);
        });
      },

      // Eraser operations (merged from eraserModule)
      isElementErasable: (element: CanvasElement) => {
        return element.type === 'pen' || element.type === 'marker' || element.type === 'highlighter';
      },

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

      updateSpatialIndex: () => {
        setState((state: any) => {
          if (!state.spatialIndex) {
            state.spatialIndex = new SimpleEraserIndex();
          }
          
          // Rebuild index with erasable elements only
          const erasableElements: CanvasElement[] = [];
          
          state.elements.forEach((element: CanvasElement) => {
            if (getState().isElementErasable(element)) {
              erasableElements.push(element);
            }
          });
          
          state.spatialIndex.rebuild(erasableElements);
          state.spatialIndexDirty = false;
        });
      },

      clearSpatialIndex: () => {
        setState((state: any) => {
          if (state.spatialIndex) {
            state.spatialIndex.clear();
          }
          state.spatialIndexDirty = true;
        });
      },

      eraseAtPoint: (x: number, y: number, eraserSize: number) => {
        const { spatialIndex, spatialIndexDirty } = getState();
        
        // Update spatial index if needed
        if (spatialIndexDirty || !spatialIndex) {
          getState().updateSpatialIndex();
        }
        
        const halfSize = eraserSize / 2;
        const eraserBounds = {
          x: x - halfSize,
          y: y - halfSize,
          width: eraserSize,
          height: eraserSize
        };
        
        // Find candidate elements using spatial index
        const candidateIds = getState().spatialIndex!.findIntersections(eraserBounds);
        const deletedIds: ElementId[] = [];
        
        setState((state: any) => {
          candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
            const element = state.elements.get(id);
            
            if (!element || !getState().isElementErasable(element)) return;
            
            // Check if any point is within eraser radius
            const points = (element as { points?: number[] }).points;
            if (points && Array.isArray(points)) {
              for (let i = 0; i < points.length; i += 2) {
                const px = points[i];
                const py = points[i + 1];
                const dist = Math.hypot(px - x, py - y);
                
                if (dist <= halfSize) {
                  deletedIds.push(id as ElementId);
                  state.elements.delete(id);
                  state.elementOrder = state.elementOrder.filter((elId: ElementId) => elId !== id);
                  state.spatialIndexDirty = true;
                  break;
                }
              }
            }
          });
        });
        
        if (deletedIds.length > 0) {
          getState().addToHistory('Erase strokes');
        }
        
        return deletedIds;
      },

      eraseInPath: (eraserPath: number[], eraserSize: number) => {
        if (eraserPath.length < 2) return [];
        
        const { spatialIndex, spatialIndexDirty } = getState();
        
        // Update spatial index if needed
        if (spatialIndexDirty || !spatialIndex) {
          getState().updateSpatialIndex();
        }
        
        // Get path bounds and find candidates
        const candidateIds = getState().spatialIndex!.findPathIntersections(eraserPath, eraserSize);
        const deletedIds: ElementId[] = [];
        const halfSize = eraserSize / 2;
        
        setState((state: any) => {
          candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
            const element = state.elements.get(id);
            if (!element || !getState().isElementErasable(element)) return;
            
            // Check if any point intersects with eraser path
            const points = (element as { points?: number[] }).points;
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
                state.elementOrder = state.elementOrder.filter((elId: ElementId) => elId !== id);
                state.spatialIndexDirty = true;
              }
            }
          });
        });
        
        if (deletedIds.length > 0) {
          getState().addToHistory('Erase strokes');
        }
        
        return deletedIds;
      },

      eraseInBounds: (bounds: BoundingBox) => {
        const { spatialIndex, spatialIndexDirty } = getState();
        
        // Update spatial index if needed
        if (spatialIndexDirty || !spatialIndex) {
          getState().updateSpatialIndex();
        }
        
        const candidateIds = getState().spatialIndex!.findIntersections(bounds);
        const deletedIds: ElementId[] = [];
        
        setState((state: any) => {
          candidateIds.forEach((id: ElementId | import('../../types/enhanced.types').SectionId) => {
            const element = state.elements.get(id);
            if (!element || !getState().isElementErasable(element)) return;
            
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
          getState().addToHistory('Erase elements');
        }
        
        return deletedIds;
      },
    },
  };
};