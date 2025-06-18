// src/features/canvas/stores/canvasStore.modular.ts
/**
 * Modular Canvas Store - Combines all canvas store slices
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 * 
 * This store provides a phased approach to replace the monolithic konvaCanvasStore.ts
 * Starting with a simplified combined interface and gradually integrating full slice pattern.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { CanvasElement } from '../stores/types';

// Phase 1: Define core interfaces that match existing usage
export interface ModularCanvasState {
  // Core element management
  elements: Record<string, CanvasElement>;
  sections: Record<string, any>;
  
  // Selection state
  selectedElementIds: string[];
  selectedElementId: string | null;
  
  // Tool state
  selectedTool: string;
  activeTool: string;
  
  // Text editing state
  editingTextId: string | null;
  isEditingText: string | null; // Alias for backward compatibility
  
  // Viewport state
  zoom: number;
  pan: { x: number; y: number };
  canvasSize: { width: number; height: number };
  
  // UI state
  isDragging: boolean;
  isDrawing: boolean;
  dragStartPos: { x: number; y: number } | null;
  
  // Multi-canvas support
  canvases: Record<string, any>;
  currentCanvasId: string | null;
  
  // Core actions - simplified interface
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  setSelectedTool: (tool: string) => void;
  startTextEdit: (elementId: string) => void;
  stopTextEdit: () => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  
  // Canvas management
  resetCanvas: () => void;
  initializeCanvas: (canvasId: string) => void;
}

/**
 * Create the modular canvas store with simplified implementation
 * This provides immediate improvement while allowing gradual migration to full slice pattern
 */
export const useModularCanvasStore = create<ModularCanvasState>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        // Initial state
        elements: {},
        sections: {},
        selectedElementIds: [],
        selectedElementId: null,
        selectedTool: 'select',
        activeTool: 'select',
        editingTextId: null,
        isEditingText: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        canvasSize: { width: 800, height: 600 },
        isDragging: false,
        isDrawing: false,
        dragStartPos: null,
        canvases: {},
        currentCanvasId: null,
        
        // Actions
        addElement: (element: CanvasElement) => {
          set((state) => {
            state.elements[element.id] = element;
          });
        },
        
        updateElement: (id: string, updates: Partial<CanvasElement>) => {
          set((state) => {
            if (state.elements[id]) {
              Object.assign(state.elements[id], updates);
            }
          });
        },
        
        deleteElement: (id: string) => {
          set((state) => {
            delete state.elements[id];
            state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
            if (state.selectedElementId === id) {
              state.selectedElementId = null;
            }
          });
        },
        
        selectElement: (id: string) => {
          set((state) => {
            state.selectedElementId = id;
            state.selectedElementIds = [id];
          });
        },
        
        clearSelection: () => {
          set((state) => {
            state.selectedElementIds = [];
            state.selectedElementId = null;
          });
        },
        
        setSelectedTool: (tool: string) => {
          set((state) => {
            state.selectedTool = tool;
            state.activeTool = tool;
          });
        },
        
        startTextEdit: (elementId: string) => {
          set((state) => {
            state.editingTextId = elementId;
            state.isEditingText = elementId;
          });
        },
        
        stopTextEdit: () => {
          set((state) => {
            state.editingTextId = null;
            state.isEditingText = null;
          });
        },
        
        setZoom: (zoom: number) => {
          set((state) => {
            state.zoom = Math.max(0.1, Math.min(5, zoom));
          });
        },
        
        setPan: (pan: { x: number; y: number }) => {
          set((state) => {
            state.pan = pan;
          });
        },
        
        resetCanvas: () => {
          set((state) => {
            state.elements = {};
            state.sections = {};
            state.selectedElementIds = [];
            state.selectedElementId = null;
            state.editingTextId = null;
            state.isEditingText = null;
          });
        },
        
        initializeCanvas: (canvasId: string) => {
          set((state) => {
            state.currentCanvasId = canvasId;
            if (!state.canvases[canvasId]) {
              state.canvases[canvasId] = {
                elements: {},
                sections: {},
                createdAt: Date.now(),
              };
            }
          });
        },
      }))
    ),
    {
      name: 'modular-canvas-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Export specific selector hooks for performance
export const useCanvasElements = () => useModularCanvasStore(state => ({
  elements: state.elements,
  addElement: state.addElement,
  updateElement: state.updateElement,
  deleteElement: state.deleteElement,
}));

export const useCanvasSelection = () => useModularCanvasStore(state => ({
  selectedElementIds: state.selectedElementIds,
  selectedElementId: state.selectedElementId,
  selectElement: state.selectElement,
  clearSelection: state.clearSelection,
}));

export const useCanvasViewport = () => useModularCanvasStore(state => ({
  zoom: state.zoom,
  pan: state.pan,
  setZoom: state.setZoom,
  setPan: state.setPan,
}));

export const useCanvasTextEditing = () => useModularCanvasStore(state => ({
  editingTextId: state.editingTextId,
  isEditingText: state.isEditingText,
  startTextEdit: state.startTextEdit,
  stopTextEdit: state.stopTextEdit,
}));

export const useCanvasTools = () => useModularCanvasStore(state => ({
  selectedTool: state.selectedTool,
  activeTool: state.activeTool,
  setSelectedTool: state.setSelectedTool,
}));

// Re-export the main store as default for easier migration
export default useModularCanvasStore;
