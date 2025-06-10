// src/stores/canvasStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Define tool types
export type CanvasTool = 
  | 'select' 
  | 'text' 
  | 'rectangle' 
  | 'circle' 
  | 'triangle' 
  | 'square' 
  | 'hexagon' 
  | 'star' 
  | 'line' 
  | 'arrow' 
  | 'pen' 
  | 'eraser' 
  | 'sticky-note'
  | 'image'
  | 'shapes';

// Define saved canvas interface
export interface SavedCanvas {
  id: string;
  name: string;
  elements: CanvasElement[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

// Define CanvasElement directly in this file or import from a correct central types file if it exists.
// For now, let's define a basic structure for CanvasElement here.
export interface CanvasElement {
  id: string;
  type: string; // e.g., 'text', 'rectangle', 'sticky-note'
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  textAlignment?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;
  // Add other common properties as needed, or make this a union of specific element types
  [key: string]: any; // Allow other properties for different element types
}

// Forward declaration of State to be used in CanvasState
interface State {
  elements: Record<string, CanvasElement>;
  selectedElementIds: string[];
  isEditingText: string | null;
  activeTool: string;
  isDragging: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragStartElementPositions: Record<string, { x: number; y: number }> | null;
  history: CanvasElement[][]; // Add history type
  historyIndex: number; // Add historyIndex type
  zoom: number;
  pan: { x: number; y: number };
  // Missing state properties
  isDrawing: boolean;
  previewElement: CanvasElement | null;
  showTextFormatting: boolean;
  textFormattingPosition: any;
  selectedTextElement: string | null;
  // Double-click protection
  pendingDoubleClick: string | null;
}

export interface CanvasState extends State {
  setIsEditingText: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setDragState: (isDragging: boolean, dragStartPos: { x: number; y: number } | null, dragStartElementPositions: Record<string, { x: number; y: number }> | null) => void;
  updateElements: (updates: Record<string, Partial<CanvasElement>>) => void;
  addToHistory: (elementsState: Record<string, CanvasElement>) => void; // Add addToHistory action
  undo: () => void; // Add undo action
  redo: () => void; // Add redo action
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  // Missing action functions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setPreviewState: (isActive: boolean, element: CanvasElement | null) => void;
  setResizeState: (isResizing: boolean, elementId: string | null, startPos: {x: number, y: number}, startSize: {width: number, height: number}) => void;
  setTextFormattingState: (show: boolean) => void;
  setTextSelectionState: (elementId: string | null, position: any, selectedElement: string | null) => void;
  setActiveTool: (tool: string) => void;
  updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => void;
  // Double-click protection actions
  setPendingDoubleClick: (elementId: string | null) => void;
  clearPendingDoubleClick: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  immer((set) => ({ // Removed unused get parameter
    elements: {},
    selectedElementIds: [],
    isEditingText: null,
    activeTool: 'select',
    isDragging: false,
    dragStartPos: null,
    dragStartElementPositions: null,
    history: [], // Initialize history
    historyIndex: -1, // Initialize historyIndex
    zoom: 1,
    pan: { x: 0, y: 0 },
    // Initialize missing state properties
    isDrawing: false,
    previewElement: null,
    showTextFormatting: false,
    textFormattingPosition: null,
    selectedTextElement: null,
    // Initialize double-click protection
    pendingDoubleClick: null,

    setIsEditingText: (id) =>
      set((state) => {
        console.log(`CanvasStore: setIsEditingText called with id: ${id}`);
        console.log(`CanvasStore: Previous isEditingText: ${state.isEditingText}`);
        console.log(`CanvasStore: Current pendingDoubleClick: ${state.pendingDoubleClick}`);
        state.isEditingText = id;
      }),
    setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
    setDragState: (isDragging, dragStartPos, dragStartElementPositions) =>
      set({ isDragging, dragStartPos, dragStartElementPositions }),
    updateElements: (updates) =>
      set((state) => {
        for (const id in updates) {
          if (state.elements[id]) {
            Object.assign(state.elements[id], updates[id]);
          }
        }
      }),
    addToHistory: (elementsState) => {
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(Object.values(elementsState)); // Store array of elements
        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },
    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          // Restore elements from history, ensuring it's a Record<string, CanvasElement>
          const previousElementsArray = state.history[state.historyIndex];
          const newElementsState: Record<string, CanvasElement> = {};
          previousElementsArray.forEach(el => newElementsState[el.id] = el);
          state.elements = newElementsState;
        } else if (state.historyIndex === 0) { // Handle undoing to initial empty state
          state.historyIndex = -1;
          state.elements = {}; // Reset to initial empty elements
        }
      });
    },
    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          // Restore elements from history
          const nextElementsArray = state.history[state.historyIndex];
          const newElementsState: Record<string, CanvasElement> = {};
          nextElementsArray.forEach(el => newElementsState[el.id] = el);
          state.elements = newElementsState;
        }
      });
    },
    setZoom: (zoom) => set({ zoom }),
    setPan: (pan) => set({ pan }),
    
    // Missing action functions implementation
    addElement: (element) => 
      set((state) => {
        state.elements[element.id] = element;
      }),
    
    updateElement: (id, updates) =>
      set((state) => {
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
        }
      }),
    
    deleteElement: (id) =>
      set((state) => {
        delete state.elements[id];
        state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
        if (state.isEditingText === id) {
          state.isEditingText = null;
        }
        if (state.selectedTextElement === id) {
          state.selectedTextElement = null;
          state.showTextFormatting = false;
        }
      }),
    
    selectElement: (id, addToSelection = false) =>
      set((state) => {
        if (addToSelection) {
          if (state.selectedElementIds.includes(id)) {
            // Remove from selection if already selected
            state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id);
          } else {
            // Add to selection
            state.selectedElementIds = [...state.selectedElementIds, id];
          }
        } else {
          // Replace selection with just this element
          state.selectedElementIds = [id];
        }
      }),
    
    clearSelection: () =>
      set((state) => {
        // Don't clear if we have a pending double-click
        if (state.pendingDoubleClick) {
          // Don't clear isEditingText if it matches the pending double-click
          if (state.isEditingText !== state.pendingDoubleClick) {
            state.isEditingText = null;
          }
          // Don't clear selection if the pending element is selected
          if (!state.selectedElementIds.includes(state.pendingDoubleClick)) {
            state.selectedElementIds = [];
          }
        } else {
          state.selectedElementIds = [];
          state.isEditingText = null;
        }
        state.selectedTextElement = null;
        state.showTextFormatting = false;
      }),
    
    setIsDrawing: (isDrawing) => set({ isDrawing }),
    
    setPreviewState: (isActive, element) =>
      set((state) => {
        state.isDrawing = isActive;
        state.previewElement = element;
      }),
    
    setResizeState: (_isResizing, _elementId, _startPos, _startSize) =>
      set((state) => {
        // For now, this is a placeholder implementation
        // You can expand this based on your resize functionality needs
        state.isDragging = _isResizing;
      }),
    
    setTextFormattingState: (show) =>
      set((state) => {
        state.showTextFormatting = show;
      }),
    
    setTextSelectionState: (_elementId, position, selectedElement) =>
      set((state) => {
        state.selectedTextElement = selectedElement;
        state.textFormattingPosition = position;
        if (selectedElement) {
          state.showTextFormatting = true;
        }
      }),
    
    setActiveTool: (tool) => set({ activeTool: tool }),
    
    updateMultipleElements: (updates) =>
      set((state) => {
        for (const id in updates) {
          if (state.elements[id]) {
            Object.assign(state.elements[id], updates[id]);
          }
        }
      }),
    
    setPendingDoubleClick: (elementId) =>
      set((state) => {
        console.log(`CanvasStore: setPendingDoubleClick called with elementId: ${elementId}`);
        console.log(`CanvasStore: Previous pendingDoubleClick: ${state.pendingDoubleClick}`);
        state.pendingDoubleClick = elementId;
      }),
    
    clearPendingDoubleClick: () =>
      set((state) => {
        console.log(`CanvasStore: clearPendingDoubleClick called`);
        console.log(`CanvasStore: Clearing pendingDoubleClick from: ${state.pendingDoubleClick}`);
        state.pendingDoubleClick = null;
      }),
  }))
);

// Note: The original src/hooks/canvas/useCanvasState.ts will need to be refactored or removed
// as its primary state management responsibilities are now handled by this Zustand store.
// Any utility functions or complex logic from useCanvasState.ts not directly related to
// simple state setters/getters might need to be migrated elsewhere or adapted.