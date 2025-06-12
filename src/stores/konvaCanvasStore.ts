// src/stores/konvaCanvasStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Helper function to compare the styles of two rich text segments.
const areStylesEqual = (seg1: Omit<RichTextSegment, 'text'>, seg2: Omit<RichTextSegment, 'text'>): boolean => {
  return seg1.fontSize === seg2.fontSize &&
         seg1.fontFamily === seg2.fontFamily &&
         seg1.fontStyle === seg2.fontStyle &&
         seg1.textDecoration === seg2.textDecoration &&
         seg1.fill === seg2.fill &&
         seg1.url === seg2.url;
};

// Helper function to merge adjacent rich text segments that have identical styles.
const mergeSegments = (segments: RichTextSegment[]): RichTextSegment[] => {
  if (segments.length < 2) {
    return segments;
  }

  const merged: RichTextSegment[] = [];
  let currentSegment = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const nextSegment = segments[i];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { text: currentText, ...currentStyle } = currentSegment;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { text: nextText, ...nextStyle } = nextSegment;

    if (areStylesEqual(currentStyle, nextStyle)) {
      currentSegment.text += nextSegment.text;
    } else {
      merged.push(currentSegment);
      currentSegment = { ...nextSegment };
    }
  }
  merged.push(currentSegment);

  return merged.filter(s => s.text); // Ensure no empty segments are returned
};

// Interface for individual styled segments within a rich text element
export interface RichTextSegment {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // e.g., 'normal', 'bold', 'italic', 'bold italic'
  textDecoration?: string; // e.g., 'underline', 'line-through', or ''
  fill?: string; // Text color for this segment
  url?: string; // Optional URL for clickable links
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'pen' | 'triangle' | 'star' | 'sticky-note' | 'rich-text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  innerRadius?: number;
  numPoints?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  sides?: number; // for star
  backgroundColor?: string; // for sticky notes
  textColor?: string; // for sticky notes
  fontSize?: number; // Default font size for text-based elements
  fontFamily?: string; // Default font family for text-based elements
  segments?: RichTextSegment[]; // For 'rich-text' elements
  imageUrl?: string; // For image elements
  arrowStart?: boolean; // For lines/arrows
  arrowEnd?: boolean; // For lines/arrows
  color?: string; // General color property for shapes
}

interface HistoryState {
  elements: Record<string, CanvasElement>;
  timestamp: number;
  action: string;
}

interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedTool: string;
  selectedElementId: string | null;
  editingTextId: string | null; // ID of the text element currently being edited
  canvasSize: { width: number; height: number };
  
  // History management
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Actions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  setSelectedTool: (tool: string) => void;
  setSelectedElement: (id: string | null) => void;
  clearCanvas: () => void;
  exportCanvas: () => CanvasElement[];
  importCanvas: (elements: CanvasElement[]) => void;
  
  // History actions
  addToHistory: (action: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Rich text formatting
  applyTextFormat: (elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => void;

  // Inline text editing
  setEditingTextId: (id: string | null) => void;
  updateElementText: (elementId: string, newText: string) => void;
}

export const useKonvaCanvasStore = create<CanvasState>()(
  immer((set, get) => ({
    elements: {},
    selectedTool: 'select',
    selectedElementId: null,
    editingTextId: null,
    canvasSize: { width: 800, height: 600 },
    
    // History state
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,

    addToHistory: (action: string) => {
      set((state) => {
        const newHistoryState: HistoryState = {
          elements: JSON.parse(JSON.stringify(state.elements)),
          timestamp: Date.now(),
          action
        };

        // Remove any history after current index (when undoing then making new changes)
        state.history = state.history.slice(0, state.historyIndex + 1);
        
        // Add new state
        state.history.push(newHistoryState);
        
        // Limit history size
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
        }
        
        state.historyIndex = state.history.length - 1;
      });
    },

    addElement: (element) => {
      console.log('🏪 Store: Adding element', element);
      set((state) => {
        state.elements[element.id] = element;
        state.selectedElementId = element.id;
      });
      console.log('✅ Element added to store:', element.id, element);
      console.log('📊 Total elements in store:', Object.keys(get().elements).length);
      get().addToHistory(`Add ${element.type}`);
    },

    updateElement: (id, updates) => {
      set((state) => {
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
        }
      });
      get().addToHistory(`Update element`);
    },

    deleteElement: (id) => {
      const element = get().elements[id];
      set((state) => {
        delete state.elements[id];
        if (state.selectedElementId === id) {
          state.selectedElementId = null;
        }
      });
      get().addToHistory(`Delete ${element?.type || 'element'}`);
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
      get().addToHistory('Clear canvas');
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
      get().addToHistory('Import canvas');
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        set((state) => {
          state.historyIndex--;
          // Use the 'history' from the destructured 'get()' directly
          const previousState = history[state.historyIndex]; 
          state.elements = JSON.parse(JSON.stringify(previousState.elements));
          state.selectedElementId = null;
        });
      }
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex < history.length - 1) {
        set((state) => {
          state.historyIndex++;
          // Use the 'history' from the destructured 'get()' directly
          const nextState = history[state.historyIndex]; 
          state.elements = JSON.parse(JSON.stringify(nextState.elements));
          state.selectedElementId = null;
        });
      }
    },

    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },

    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },

    clearHistory: () => {
      set((state) => {
        state.history = [];
        state.historyIndex = -1;
      });
    },

    applyTextFormat: (elementId, format, selection) => {
      set((state) => {
        const element = state.elements[elementId];
        if (!element) return;

        // If it's a simple 'text' element, convert it to 'rich-text' first.
        if (element.type === 'text') {
          const text = element.text || '';
          state.elements[elementId] = {
            ...element,
            type: 'rich-text',
            text: undefined,
            segments: [{ text }],
          };
        }

        const richTextElement = state.elements[elementId];
        if (richTextElement.type !== 'rich-text' || !richTextElement.segments) return;

        const newSegments: RichTextSegment[] = [];
        let currentIndex = 0;

        richTextElement.segments.forEach(segment => {
          const segmentStart = currentIndex;
          const segmentEnd = segmentStart + segment.text.length;
          const { text, ...style } = segment;

          // Dissect the segment into three parts: before, during, and after the selection.
          const beforeText = text.substring(0, Math.max(0, selection.start - segmentStart));
          const duringText = text.substring(
            Math.max(0, selection.start - segmentStart),
            Math.min(text.length, selection.end - segmentStart)
          );
          const afterText = text.substring(Math.min(text.length, selection.end - segmentStart));

          if (beforeText) {
            newSegments.push({ ...style, text: beforeText });
          }
          if (duringText) {
            newSegments.push({ ...style, ...format, text: duringText });
          }
          if (afterText) {
            newSegments.push({ ...style, text: afterText });
          }
          
          currentIndex = segmentEnd;
        });

        richTextElement.segments = mergeSegments(newSegments);
      });
      get().addToHistory('Apply text format');
    },

    setEditingTextId: (id) => {
      set((state) => {
        state.editingTextId = id;
        if (id !== null) {
          // Optionally, ensure the element being edited is also the selected element
          state.selectedElementId = id;
        }
      });
    },

    updateElementText: (elementId, newText) => {
      set((state) => {
        const element = state.elements[elementId];
        if (element) {
          if (element.type === 'text') {
            element.text = newText;
          } else if (element.type === 'rich-text' && element.segments) {
            // When updating rich text, preserve the style of the first segment.
            // A more advanced implementation could involve diffing, but this is a good baseline.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { text, ...firstSegmentStyle } = element.segments[0];

            element.segments = [{ ...firstSegmentStyle, text: newText }];
            element.text = undefined; // Ensure plain text is not used for rich-text
          }
        }
      });
      get().addToHistory(`Edit text for element ${elementId}`);
    }
  }))
);
