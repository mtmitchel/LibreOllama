/**
 * Unified Canvas Store - Phase 4: Store Architecture Cleanup
 * 
 * This replaces the complex multi-slice architecture with a single,
 * unified store that eliminates state duplication and type casting issues.
 * 
 * Key improvements:
 * - Single source of truth for all canvas state
 * - Integrated EventHandlerManager for centralized business logic
 * - Eliminated cross-store dependencies
 * - Type-safe operations without 'as any' casts
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { Draft } from 'immer';
import { nanoid } from 'nanoid';

import { logger } from '../../../lib/logger';
import { createEventHandlerManager, EventHandlerManager } from './EventHandlerManager';
import { 
  CanvasElement, 
  ElementId, 
  SectionId, 
  GroupId,
  TextElement,
  RectangleElement,
  CircleElement,
  SectionElement,
  isTextElement,
  isRectangleElement,
  isCircleElement,
  isSectionElement,
  isConnectorElement
} from '../types/enhanced.types';

// Enable Immer Map/Set support
enableMapSet();

// History entry for undo/redo
interface HistoryEntry {
  id: string;
  timestamp: number;
  operation: string;
  elementsSnapshot: Map<string, CanvasElement>;
  selectionSnapshot: Set<ElementId>;
}

// Unified store state - consolidates all previous slices
export interface UnifiedCanvasState {
  // === ELEMENT STATE (from canvasElementsStore) ===
  elements: Map<string, CanvasElement>;
  elementOrder: string[]; // For z-index management
  
  // === SELECTION STATE (from selectionStore) ===
  selectedElementIds: Set<ElementId>;
  lastSelectedElementId: ElementId | null;
  selectionRectangle: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isActive: boolean;
  } | null;
  
  // === VIEWPORT STATE (from viewportStore) ===
  viewport: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
  
  // === TEXT EDITING STATE (from textEditingStore) ===
  textEditingElementId: ElementId | null;
  
  // === DRAWING STATE ===
  isDrawing: boolean;
  currentPath?: number[];
  drawingTool: 'pen' | 'pencil' | 'section' | null;
  
  // === UI STATE (from canvasUIStore) ===
  selectedTool: string;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // === HISTORY STATE (from canvasHistoryStore) ===
  history: HistoryEntry[];
  currentHistoryIndex: number;
  maxHistorySize: number;
  
  // === SECTION STATE (from sectionStore) ===
  sections: Map<SectionId, SectionElement>;
  sectionElementMap: Map<SectionId, Set<ElementId>>; // Which elements are in which sections
  
  // === EVENT HANDLER ===
  eventHandler: EventHandlerManager;
}

// Store actions - all business logic centralized here
export interface UnifiedCanvasActions {
  // === ELEMENT OPERATIONS ===
  addElement: (element: CanvasElement) => void;
  updateElement: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: ElementId | SectionId) => void;
  getElementById: (id: ElementId | SectionId) => CanvasElement | undefined;
  
  // === SELECTION OPERATIONS ===
  selectElement: (id: ElementId, multiSelect?: boolean) => void;
  clearSelection: () => void;
  selectElementsInRectangle: (rect: { x: number; y: number; width: number; height: number }) => void;
  getSelectedElements: () => CanvasElement[];
  
  // === VIEWPORT OPERATIONS ===
  setViewport: (viewport: Partial<UnifiedCanvasState['viewport']>) => void;
  panViewport: (deltaX: number, deltaY: number) => void;
  zoomViewport: (scale: number, centerX?: number, centerY?: number) => void;
  
  // === TEXT EDITING OPERATIONS ===
  setTextEditingElement: (id: ElementId | null) => void;
  
  // === DRAWING OPERATIONS ===
  startDrawing: (tool: 'pen' | 'pencil' | 'section', startPoint?: number[]) => void;
  updateDrawing: (point: number[]) => void;
  endDrawing: () => void;
  
  // === UI OPERATIONS ===
  setSelectedTool: (tool: string) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  
  // === HISTORY OPERATIONS ===
  addToHistory: (operation: string) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // === SECTION OPERATIONS ===
  createSection: (x: number, y: number, width: number, height: number) => SectionId;
  updateSection: (id: SectionId, updates: Partial<SectionElement>) => void;
  addElementToSection: (elementId: ElementId, sectionId: SectionId) => void;
  removeElementFromSection: (elementId: ElementId, sectionId: SectionId) => void;
  getSectionElements: (sectionId: SectionId) => CanvasElement[];
}

// Create the unified store
export const useUnifiedCanvasStore = create<UnifiedCanvasState & UnifiedCanvasActions>()(
  subscribeWithSelector(
    immer((set, get) => {
      // Helper function to create a history snapshot
      const createHistorySnapshot = (): Pick<HistoryEntry, 'elementsSnapshot' | 'selectionSnapshot'> => {
        const state = get();
        return {
          elementsSnapshot: new Map(state.elements),
          selectionSnapshot: new Set(state.selectedElementIds)
        };
      };
      
      // Store API for EventHandlerManager
      const storeAPI = {
        getState: get,
        setState: set,
        updateElement: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => {
          set((draft) => {
            const element = draft.elements.get(id);
            if (element) {
              // Type-safe updates without 'as any'
              Object.assign(element, updates);
              logger.debug(`[UnifiedStore] Updated element ${id}:`, updates);
            }
          });
        },
        selectElement: (id: ElementId, multiSelect = false) => {
          set((draft) => {
            if (multiSelect) {
              if (draft.selectedElementIds.has(id)) {
                draft.selectedElementIds.delete(id);
              } else {
                draft.selectedElementIds.add(id);
              }
            } else {
              draft.selectedElementIds.clear();
              draft.selectedElementIds.add(id);
            }
            draft.lastSelectedElementId = id;
          });
        },
        clearSelection: () => {
          set((draft) => {
            draft.selectedElementIds.clear();
            draft.lastSelectedElementId = null;
          });
        },
        setTextEditingElement: (id: ElementId | null) => {
          set((draft) => {
            draft.textEditingElementId = id;
          });
        },
        addToHistory: (operation: string) => {
          set((draft) => {
            const snapshot = createHistorySnapshot();
            const entry: HistoryEntry = {
              id: nanoid(),
              timestamp: Date.now(),
              operation,
              ...snapshot
            };
            
            // Remove any entries after current position
            draft.history = draft.history.slice(0, draft.currentHistoryIndex + 1);
            
            // Add new entry
            draft.history.push(entry);
            
            // Limit history size
            if (draft.history.length > draft.maxHistorySize) {
              draft.history = draft.history.slice(-draft.maxHistorySize);
            }
            
            draft.currentHistoryIndex = draft.history.length - 1;
          });
        }
      };
      
      return {
        // === INITIAL STATE ===
        elements: new Map(),
        elementOrder: [],
        selectedElementIds: new Set(),
        lastSelectedElementId: null,
        selectionRectangle: null,
        viewport: {
          x: 0,
          y: 0,
          scale: 1,
          width: 1920,
          height: 1080
        },
        textEditingElementId: null,
        isDrawing: false,
        currentPath: undefined,
        drawingTool: null,
        selectedTool: 'select',
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
        history: [],
        currentHistoryIndex: -1,
        maxHistorySize: 50,
        sections: new Map(),
        sectionElementMap: new Map(),
        
        // === EVENT HANDLER ===
        eventHandler: createEventHandlerManager(storeAPI),
        
        // === ELEMENT OPERATIONS ===
        addElement: (element: CanvasElement) => {
          set((draft) => {
            draft.elements.set(element.id, element);
            draft.elementOrder.push(element.id);
            logger.debug(`[UnifiedStore] Added element: ${element.id} (${element.type})`);
          });
        },
        
        updateElement: (id: ElementId | SectionId, updates: Partial<CanvasElement>) => {
          set((draft) => {
            const element = draft.elements.get(id);
            if (element) {
              // Type-safe merge without 'as any'
              Object.assign(element, updates);
              logger.debug(`[UnifiedStore] Updated element ${id}:`, updates);
            }
          });
        },
        
        deleteElement: (id: ElementId | SectionId) => {
          set((draft) => {
            draft.elements.delete(id);
            draft.elementOrder = draft.elementOrder.filter(elemId => elemId !== id);
            draft.selectedElementIds.delete(id as ElementId);
            if (draft.lastSelectedElementId === id) {
              draft.lastSelectedElementId = null;
            }
            logger.debug(`[UnifiedStore] Deleted element: ${id}`);
          });
        },
        
        getElementById: (id: ElementId | SectionId) => {
          return get().elements.get(id);
        },
        
        // === SELECTION OPERATIONS ===
        selectElement: (id: ElementId, multiSelect = false) => {
          set((draft) => {
            if (multiSelect) {
              if (draft.selectedElementIds.has(id)) {
                draft.selectedElementIds.delete(id);
              } else {
                draft.selectedElementIds.add(id);
              }
            } else {
              draft.selectedElementIds.clear();
              draft.selectedElementIds.add(id);
            }
            draft.lastSelectedElementId = id;
            logger.debug(`[UnifiedStore] Selected element: ${id} (multi: ${multiSelect})`);
          });
        },
        
        clearSelection: () => {
          set((draft) => {
            draft.selectedElementIds.clear();
            draft.lastSelectedElementId = null;
            logger.debug('[UnifiedStore] Cleared selection');
          });
        },
        
        selectElementsInRectangle: (rect) => {
          set((draft) => {
            const elementsInRect = Array.from(draft.elements.values()).filter(element => {
              return element.x >= rect.x && 
                     element.y >= rect.y && 
                     element.x + (element.width || 0) <= rect.x + rect.width &&
                     element.y + (element.height || 0) <= rect.y + rect.height;
            });
            
            draft.selectedElementIds.clear();
            elementsInRect.forEach(element => {
              draft.selectedElementIds.add(element.id as ElementId);
            });
            
            if (elementsInRect.length > 0) {
              draft.lastSelectedElementId = elementsInRect[elementsInRect.length - 1].id as ElementId;
            }
          });
        },
        
        getSelectedElements: () => {
          const state = get();
          return Array.from(state.selectedElementIds)
            .map(id => state.elements.get(id))
            .filter(Boolean) as CanvasElement[];
        },
        
        // === VIEWPORT OPERATIONS ===
        setViewport: (viewport) => {
          set((draft) => {
            Object.assign(draft.viewport, viewport);
          });
        },
        
        panViewport: (deltaX: number, deltaY: number) => {
          set((draft) => {
            draft.viewport.x += deltaX;
            draft.viewport.y += deltaY;
          });
        },
        
        zoomViewport: (scale: number, centerX?: number, centerY?: number) => {
          set((draft) => {
            const oldScale = draft.viewport.scale;
            draft.viewport.scale = Math.max(0.1, Math.min(5, scale));
            
            // Zoom towards center point if provided
            if (centerX !== undefined && centerY !== undefined) {
              const scaleRatio = draft.viewport.scale / oldScale;
              draft.viewport.x = centerX - (centerX - draft.viewport.x) * scaleRatio;
              draft.viewport.y = centerY - (centerY - draft.viewport.y) * scaleRatio;
            }
          });
        },
        
        // === TEXT EDITING OPERATIONS ===
        setTextEditingElement: (id: ElementId | null) => {
          set((draft) => {
            draft.textEditingElementId = id;
          });
        },
        
        // === DRAWING OPERATIONS ===
        startDrawing: (tool, startPoint) => {
          set((draft) => {
            draft.isDrawing = true;
            draft.drawingTool = tool;
            draft.currentPath = startPoint || [];
          });
        },
        
        updateDrawing: (point) => {
          set((draft) => {
            if (draft.isDrawing && draft.currentPath) {
              draft.currentPath.push(...point);
            }
          });
        },
        
        endDrawing: () => {
          set((draft) => {
            draft.isDrawing = false;
            draft.drawingTool = null;
            draft.currentPath = undefined;
          });
        },
        
        // === UI OPERATIONS ===
        setSelectedTool: (tool: string) => {
          set((draft) => {
            draft.selectedTool = tool;
          });
        },
        
        setShowGrid: (show: boolean) => {
          set((draft) => {
            draft.showGrid = show;
          });
        },
        
        setSnapToGrid: (snap: boolean) => {
          set((draft) => {
            draft.snapToGrid = snap;
          });
        },
        
        // === HISTORY OPERATIONS ===
        addToHistory: (operation: string) => {
          const snapshot = createHistorySnapshot();
          set((draft) => {
            const entry: HistoryEntry = {
              id: nanoid(),
              timestamp: Date.now(),
              operation,
              ...snapshot
            };
            
            // Remove any entries after current position
            draft.history = draft.history.slice(0, draft.currentHistoryIndex + 1);
            
            // Add new entry
            draft.history.push(entry);
            
            // Limit history size
            if (draft.history.length > draft.maxHistorySize) {
              draft.history = draft.history.slice(-draft.maxHistorySize);
            }
            
            draft.currentHistoryIndex = draft.history.length - 1;
          });
        },
        
        undo: () => {
          set((draft) => {
            if (draft.currentHistoryIndex > 0) {
              draft.currentHistoryIndex--;
              const entry = draft.history[draft.currentHistoryIndex];
              if (entry) {
                draft.elements = new Map(entry.elementsSnapshot);
                draft.selectedElementIds = new Set(entry.selectionSnapshot);
                logger.debug(`[UnifiedStore] Undo: ${entry.operation}`);
              }
            }
          });
        },
        
        redo: () => {
          set((draft) => {
            if (draft.currentHistoryIndex < draft.history.length - 1) {
              draft.currentHistoryIndex++;
              const entry = draft.history[draft.currentHistoryIndex];
              if (entry) {
                draft.elements = new Map(entry.elementsSnapshot);
                draft.selectedElementIds = new Set(entry.selectionSnapshot);
                logger.debug(`[UnifiedStore] Redo: ${entry.operation}`);
              }
            }
          });
        },
        
        clearHistory: () => {
          set((draft) => {
            draft.history = [];
            draft.currentHistoryIndex = -1;
          });
        },
        
        // === SECTION OPERATIONS ===
        createSection: (x: number, y: number, width: number, height: number) => {
          const sectionId = `section-${nanoid()}` as SectionId;
          const section: SectionElement = {
            id: sectionId,
            type: 'section',
            x,
            y,
            width,
            height,
            title: 'New Section',
            backgroundColor: '#f8f9fa',
            borderColor: '#dee2e6'
          };
          
          set((draft) => {
            draft.elements.set(sectionId, section);
            draft.sections.set(sectionId, section);
            draft.sectionElementMap.set(sectionId, new Set());
            draft.elementOrder.push(sectionId);
          });
          
          return sectionId;
        },
        
        updateSection: (id: SectionId, updates: Partial<SectionElement>) => {
          set((draft) => {
            const section = draft.sections.get(id);
            if (section) {
              Object.assign(section, updates);
              draft.elements.set(id, { ...section, ...updates });
            }
          });
        },
        
        addElementToSection: (elementId: ElementId, sectionId: SectionId) => {
          set((draft) => {
            const sectionElements = draft.sectionElementMap.get(sectionId);
            if (sectionElements) {
              sectionElements.add(elementId);
            }
          });
        },
        
        removeElementFromSection: (elementId: ElementId, sectionId: SectionId) => {
          set((draft) => {
            const sectionElements = draft.sectionElementMap.get(sectionId);
            if (sectionElements) {
              sectionElements.delete(elementId);
            }
          });
        },
        
        getSectionElements: (sectionId: SectionId) => {
          const state = get();
          const elementIds = state.sectionElementMap.get(sectionId);
          if (!elementIds) return [];
          
          return Array.from(elementIds)
            .map(id => state.elements.get(id))
            .filter(Boolean) as CanvasElement[];
        }
      };
    })
  )
);

// Export type-safe selectors for components
export const canvasSelectors = {
  // Elements
  elements: (state: UnifiedCanvasState) => state.elements,
  elementById: (id: ElementId) => (state: UnifiedCanvasState) => state.elements.get(id),
  elementOrder: (state: UnifiedCanvasState) => state.elementOrder,
  
  // Selection
  selectedElementIds: (state: UnifiedCanvasState) => state.selectedElementIds,
  selectedElements: (state: UnifiedCanvasState) => 
    Array.from(state.selectedElementIds)
      .map(id => state.elements.get(id))
      .filter(Boolean) as CanvasElement[],
  lastSelectedElement: (state: UnifiedCanvasState) => 
    state.lastSelectedElementId ? state.elements.get(state.lastSelectedElementId) : null,
  
  // UI
  selectedTool: (state: UnifiedCanvasState) => state.selectedTool,
  isDrawing: (state: UnifiedCanvasState) => state.isDrawing,
  textEditingElementId: (state: UnifiedCanvasState) => state.textEditingElementId,
  
  // Viewport
  viewport: (state: UnifiedCanvasState) => state.viewport,
  
  // History
  canUndo: (state: UnifiedCanvasState) => state.currentHistoryIndex > 0,
  canRedo: (state: UnifiedCanvasState) => state.currentHistoryIndex < state.history.length - 1
};

logger.info('[UnifiedCanvasStore] Store architecture initialized - Phase 4 complete');