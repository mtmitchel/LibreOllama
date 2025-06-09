// src/stores/canvasStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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
  // Define other actions if they were in your previous State definition
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

    setIsEditingText: (id) => set({ isEditingText: id }),
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
  }))
);

// Note: The original src/hooks/canvas/useCanvasState.ts will need to be refactored or removed
// as its primary state management responsibilities are now handled by this Zustand store.
// Any utility functions or complex logic from useCanvasState.ts not directly related to
// simple state setters/getters might need to be migrated elsewhere or adapted.