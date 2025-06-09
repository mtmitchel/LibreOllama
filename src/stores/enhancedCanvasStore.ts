/**
 * Enhanced Canvas Store with Performance Optimizations
 * Extends the existing store with batch operations, layer management, and performance features
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { BatchManager } from '@/lib/canvas-performance';
import { Layer, createLayerManager } from '@/lib/canvas-layers';
import { CanvasElement } from './canvasStore';

// Enhanced canvas state with performance features
interface EnhancedCanvasState {
  // Existing state from original store
  elements: Record<string, CanvasElement>;
  selectedElementIds: string[];
  isEditingText: string | null;
  activeTool: string;
  isDragging: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragStartElementPositions: Record<string, { x: number; y: number }> | null;
  history: CanvasElement[][];
  historyIndex: number;
  zoom: number;
  pan: { x: number; y: number };
  isDrawing: boolean;
  previewElement: CanvasElement | null;
  showTextFormatting: boolean;
  textFormattingPosition: any;
  selectedTextElement: string | null;
  pendingDoubleClick: string | null;

  // New performance and layer features
  layers: Layer[];
  activeLayerId: string | null;
  viewportBounds: { x: number; y: number; width: number; height: number } | null;
  culledElementIds: Set<string>;
  performanceMode: 'normal' | 'performance' | 'quality';
  batchingEnabled: boolean;

  // Enhanced actions
  addElement: (element: CanvasElement, layerId?: string) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteMultipleElements: (ids: string[]) => void;
  updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => void;
  batchUpdateElements: (updates: Record<string, Partial<CanvasElement>>) => void;
  
  // Selection management
  selectElement: (id: string, addToSelection?: boolean) => void;
  selectMultipleElements: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Layer management
  createLayer: (name: string) => Layer;
  deleteLayer: (layerId: string) => void;
  moveElementToLayer: (elementId: string, layerId: string) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerLocked: (layerId: string, locked: boolean) => void;
  setActiveLayer: (layerId: string) => void;
  
  // Performance features
  setViewportBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
  updateCulledElements: (elementIds: string[]) => void;
  setPerformanceMode: (mode: 'normal' | 'performance' | 'quality') => void;
  setBatchingEnabled: (enabled: boolean) => void;
  
  // Utility functions
  getVisibleElements: () => CanvasElement[];
  getLayerElements: (layerId: string) => CanvasElement[];
  getElementLayer: (elementId: string) => Layer | null;
  isElementVisible: (elementId: string) => boolean;
  isElementLocked: (elementId: string) => boolean;

  // Original actions (maintained for compatibility)
  setIsEditingText: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setDragState: (isDragging: boolean, dragStartPos: { x: number; y: number } | null, dragStartElementPositions: Record<string, { x: number; y: number }> | null) => void;
  addToHistory: (elementsState: Record<string, CanvasElement>) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setPreviewState: (isActive: boolean, element: CanvasElement | null) => void;
  setResizeState: (isResizing: boolean, elementId: string | null, startPos: {x: number, y: number}, startSize: {width: number, height: number}) => void;
  setTextFormattingState: (show: boolean) => void;
  setTextSelectionState: (elementId: string | null, position: any, selectedElement: string | null) => void;
  setActiveTool: (tool: string) => void;
  setPendingDoubleClick: (elementId: string | null) => void;
  clearPendingDoubleClick: () => void;
}

let batchManager: BatchManager | null = null;
let layerManager: any = null;

export const useEnhancedCanvasStore = create<EnhancedCanvasState>()(
  immer((set, get) => {
    // Initialize layer manager
    const initializeLayerManager = () => {
      if (!layerManager) {
        layerManager = createLayerManager(
          [{ 
            id: 'default', 
            name: 'Default Layer', 
            visible: true, 
            locked: false, 
            opacity: 1, 
            zIndex: 0, 
            elementIds: [] 
          }],
          (layers) => {
            set((state) => {
              state.layers = layers;
            });
          }
        );
      }
      return layerManager;
    };

    // Initialize batch manager
    const initializeBatchManager = () => {
      if (!batchManager) {
        batchManager = new BatchManager(
          (updates) => {
            set((state) => {
              for (const id in updates) {
                if (state.elements[id]) {
                  Object.assign(state.elements[id], updates[id]);
                }
              }
            });
          },
          (ids) => {
            set((state) => {
              ids.forEach(id => {
                delete state.elements[id];
                state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
                
                // Update layer element lists
                state.layers.forEach(layer => {
                  layer.elementIds = layer.elementIds.filter(elementId => elementId !== id);
                });
              });
            });
          }
        );
      }
      return batchManager;
    };

    const store: EnhancedCanvasState = {
      // Initialize state
      elements: {},
      selectedElementIds: [],
      isEditingText: null,
      activeTool: 'select',
      isDragging: false,
      dragStartPos: null,
      dragStartElementPositions: null,
      history: [],
      historyIndex: -1,
      zoom: 1,
      pan: { x: 0, y: 0 },
      isDrawing: false,
      previewElement: null,
      showTextFormatting: false,
      textFormattingPosition: null,
      selectedTextElement: null,
      pendingDoubleClick: null,

      // Enhanced state
      layers: [{ 
        id: 'default', 
        name: 'Default Layer', 
        visible: true, 
        locked: false, 
        opacity: 1, 
        zIndex: 0, 
        elementIds: [] 
      }],
      activeLayerId: 'default',
      viewportBounds: null,
      culledElementIds: new Set(),
      performanceMode: 'normal',
      batchingEnabled: true,

      // Enhanced element operations
      addElement: (element: CanvasElement, layerId?: string) => {
        set((state) => {
          state.elements[element.id] = element;
          
          // Add to specified layer or active layer
          const targetLayerId = layerId || state.activeLayerId || 'default';
          const targetLayer = state.layers.find(l => l.id === targetLayerId);
          if (targetLayer) {
            targetLayer.elementIds.push(element.id);
          }
        });
      },

      updateElement: (id: string, updates: Partial<CanvasElement>) => {
        const state = get();
        if (state.batchingEnabled) {
          initializeBatchManager().scheduleUpdate(id, updates);
        } else {
          set((state) => {
            if (state.elements[id]) {
              Object.assign(state.elements[id], updates);
            }
          });
        }
      },

      deleteElement: (id: string) => {
        const state = get();
        if (state.batchingEnabled) {
          initializeBatchManager().scheduleDelete(id);
        } else {
          set((state) => {
            delete state.elements[id];
            state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
            
            // Remove from layers
            state.layers.forEach(layer => {
              layer.elementIds = layer.elementIds.filter(elementId => elementId !== id);
            });
            
            if (state.isEditingText === id) {
              state.isEditingText = null;
            }
          });
        }
      },

      deleteMultipleElements: (ids: string[]) => {
        const state = get();
        if (state.batchingEnabled) {
          ids.forEach(id => initializeBatchManager().scheduleDelete(id));
        } else {
          set((state) => {
            ids.forEach(id => {
              delete state.elements[id];
              state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
              
              // Remove from layers
              state.layers.forEach(layer => {
                layer.elementIds = layer.elementIds.filter(elementId => elementId !== id);
              });
            });
          });
        }
      },

      updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => {
        const state = get();
        if (state.batchingEnabled) {
          Object.entries(updates).forEach(([id, elementUpdates]) => {
            initializeBatchManager().scheduleUpdate(id, elementUpdates);
          });
        } else {
          set((state) => {
            for (const id in updates) {
              if (state.elements[id]) {
                Object.assign(state.elements[id], updates[id]);
              }
            }
          });
        }
      },

      batchUpdateElements: (updates: Record<string, Partial<CanvasElement>>) => {
        initializeBatchManager().flush(); // Ensure previous batches are processed
        Object.entries(updates).forEach(([id, elementUpdates]) => {
          initializeBatchManager().scheduleUpdate(id, elementUpdates);
        });
      },

      // Enhanced selection
      selectElement: (id: string, addToSelection = false) => {
        set((state) => {
          if (addToSelection) {
            if (state.selectedElementIds.includes(id)) {
              state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
            } else {
              state.selectedElementIds = [...state.selectedElementIds, id];
            }
          } else {
            state.selectedElementIds = [id];
          }
        });
      },

      selectMultipleElements: (ids: string[]) => {
        set((state) => {
          state.selectedElementIds = ids;
        });
      },

      clearSelection: () => {
        set((state) => {
          if (!state.pendingDoubleClick) {
            state.selectedElementIds = [];
            state.isEditingText = null;
          }
          state.selectedTextElement = null;
          state.showTextFormatting = false;
        });
      },

      // Layer management
      createLayer: (name: string) => {
        const layer = initializeLayerManager().createLayer(name);
        return layer;
      },

      deleteLayer: (layerId: string) => {
        initializeLayerManager().deleteLayer(layerId);
      },

      moveElementToLayer: (elementId: string, layerId: string) => {
        initializeLayerManager().moveElementToLayer(elementId, layerId);
      },

      setLayerVisibility: (layerId: string, visible: boolean) => {
        initializeLayerManager().setLayerVisibility(layerId, visible);
      },

      setLayerLocked: (layerId: string, locked: boolean) => {
        initializeLayerManager().setLayerLocked(layerId, locked);
      },

      setActiveLayer: (layerId: string) => {
        set((state) => {
          state.activeLayerId = layerId;
        });
      },

      // Performance features
      setViewportBounds: (bounds) => {
        set((state) => {
          state.viewportBounds = bounds;
        });
      },

      updateCulledElements: (elementIds: string[]) => {
        set((state) => {
          state.culledElementIds = new Set(elementIds);
        });
      },

      setPerformanceMode: (mode) => {
        set((state) => {
          state.performanceMode = mode;
          // Adjust batching based on performance mode
          state.batchingEnabled = mode === 'performance';
        });
      },

      setBatchingEnabled: (enabled) => {
        set((state) => {
          state.batchingEnabled = enabled;
        });
      },

      // Utility functions
      getVisibleElements: () => {
        const state = get();
        const visibleElements: CanvasElement[] = [];
        
        state.layers
          .filter(layer => layer.visible)
          .forEach(layer => {
            layer.elementIds.forEach(elementId => {
              const element = state.elements[elementId];
              if (element && !state.culledElementIds.has(elementId)) {
                visibleElements.push(element);
              }
            });
          });
        
        return visibleElements;
      },

      getLayerElements: (layerId: string) => {
        const state = get();
        return initializeLayerManager().getLayerElements(layerId, state.elements);
      },

      getElementLayer: (elementId: string) => {
        return initializeLayerManager().getElementLayer(elementId);
      },

      isElementVisible: (elementId: string) => {
        const state = get();
        const layer = initializeLayerManager().getElementLayer(elementId);
        return layer ? layer.visible && !state.culledElementIds.has(elementId) : false;
      },

      isElementLocked: (elementId: string) => {
        const layer = initializeLayerManager().getElementLayer(elementId);
        return layer ? layer.locked : false;
      },

      // Original actions for compatibility
      setIsEditingText: (id) => {
        set((state) => {
          state.isEditingText = id;
        });
      },

      setSelectedElementIds: (ids) => {
        set((state) => {
          state.selectedElementIds = ids;
        });
      },

      setDragState: (isDragging, dragStartPos, dragStartElementPositions) => {
        set((state) => {
          state.isDragging = isDragging;
          state.dragStartPos = dragStartPos;
          state.dragStartElementPositions = dragStartElementPositions;
        });
      },

      addToHistory: (elementsState) => {
        set((state) => {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(Object.values(elementsState));
          state.history = newHistory;
          state.historyIndex = newHistory.length - 1;
        });
      },

      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            state.historyIndex--;
            const previousElementsArray = state.history[state.historyIndex];
            const newElementsState: Record<string, CanvasElement> = {};
            previousElementsArray.forEach(el => newElementsState[el.id] = el);
            state.elements = newElementsState;
          } else if (state.historyIndex === 0) {
            state.historyIndex = -1;
            state.elements = {};
          }
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            const nextElementsArray = state.history[state.historyIndex];
            const newElementsState: Record<string, CanvasElement> = {};
            nextElementsArray.forEach(el => newElementsState[el.id] = el);
            state.elements = newElementsState;
          }
        });
      },

      setZoom: (zoom) => set({ zoom }),
      setPan: (pan) => set({ pan }),
      setIsDrawing: (isDrawing) => set({ isDrawing }),
      
      setPreviewState: (isActive, element) => {
        set((state) => {
          state.isDrawing = isActive;
          state.previewElement = element;
        });
      },

      setResizeState: (isResizing, elementId, startPos, startSize) => {
        set((state) => {
          state.isDragging = isResizing;
        });
      },

      setTextFormattingState: (show) => {
        set((state) => {
          state.showTextFormatting = show;
        });
      },

      setTextSelectionState: (elementId, position, selectedElement) => {
        set((state) => {
          state.selectedTextElement = selectedElement;
          state.textFormattingPosition = position;
          if (selectedElement) {
            state.showTextFormatting = true;
          }
        });
      },

      setActiveTool: (tool) => set({ activeTool: tool }),

      setPendingDoubleClick: (elementId) => {
        set((state) => {
          state.pendingDoubleClick = elementId;
        });
      },

      clearPendingDoubleClick: () => {
        set((state) => {
          state.pendingDoubleClick = null;
        });
      },
    };

    // Initialize managers
    initializeLayerManager();
    initializeBatchManager();

    return store;
  })
);
