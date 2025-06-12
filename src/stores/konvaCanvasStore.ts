// src/stores/konvaCanvasStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'pen' | 'triangle' | 'star' | 'sticky-note';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  sides?: number; // for star
  innerRadius?: number; // for star
  backgroundColor?: string; // for sticky notes
  textColor?: string; // for sticky notes
}

interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedTool: string;
  selectedElementId: string | null;
  canvasSize: { width: number; height: number };
  
  // Actions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  setSelectedTool: (tool: string) => void;
  setSelectedElement: (id: string | null) => void;
  clearCanvas: () => void;
  exportCanvas: () => CanvasElement[];
  importCanvas: (elements: CanvasElement[]) => void;
}

export const useKonvaCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    elements: {},
    selectedTool: 'select',
    selectedElementId: null,
    canvasSize: { width: 800, height: 600 },    addElement: (element) => {
      console.log('🏪 Store: Adding element', element);
      set((state) => {
        state.elements[element.id] = element;
        state.selectedElementId = element.id;
      });
      console.log('✅ Element added to store:', element.id, element);
      console.log('📊 Total elements in store:', Object.keys(get().elements).length);
    },

    updateElement: (id, updates) => {
      set((state) => {
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
        }
      });
    },

    deleteElement: (id) => {
      set((state) => {
        delete state.elements[id];
        if (state.selectedElementId === id) {
          state.selectedElementId = null;
        }
      });
    },

    setSelectedTool: (tool) => {
      set((state) => {
        state.selectedTool = tool;
      });
    },

    setSelectedElement: (id) => {
      set((state) => {
        state.selectedElementId = id;
      });
    },

    clearCanvas: () => {
      set((state) => {
        state.elements = {};
        state.selectedElementId = null;
      });
    },

    exportCanvas: () => {
      const { elements } = get();
      return Object.values(elements);
    },

    importCanvas: (elements) => {
      set((state) => {
        state.elements = {};
        elements.forEach(element => {
          state.elements[element.id] = element;
        });
        state.selectedElementId = null;
      });
    }
  }))
);
