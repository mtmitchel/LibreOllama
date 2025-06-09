import { create } from 'zustand';

// TODO: Consider moving these to a dedicated types file (e.g., src/types/canvas.ts)
export interface CanvasElement {
  id: string;
  type: 'sticky-note' | 'rectangle' | 'circle' | 'text' | 'triangle' | 'square' | 'hexagon' | 'star' | 'drawing' | 'line' | 'arrow' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string; // For Pixi, hex numbers are often preferred e.g., 0xff0000
  backgroundColor?: string; // Similarly, hex for Pixi
  url?: string;
  path?: string; // For drawings
  x2?: number; // For lines/arrows
  y2?: number; // For lines/arrows
  imageUrl?: string;
  imageName?: string;
  fontSize?: 'small' | 'medium' | 'large'; // Consider numeric font sizes for Pixi
  isBold?: boolean;
  isItalic?: boolean;
  isBulletList?: boolean; // May need custom rendering logic in Pixi
  textAlignment?: 'left' | 'center' | 'right';
  points?: { x: number; y: number }[]; // For 'line' and 'drawing' types
  strokeColor?: string; // For shapes that have a stroke
  strokeWidth?: number; // For shapes that have a stroke
  isLocked?: boolean; // To prevent accidental modification
  // Future Pixi-specific properties might include: alpha, rotation, scale, zIndex, etc.
}

export interface SavedCanvas {
  id: string;
  name: string;
  elements: CanvasElement[]; // Or Record<string, CanvasElement> if elements are stored as an object
  createdAt: string; // Consider Date type
  updatedAt: string; // Consider Date type
  thumbnail?: string; // Base64 encoded image or URL
}

export type CanvasTool =
  | 'select'
  | 'text'
  | 'sticky-note'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'shapes' // This might imply a sub-selection mechanism or a dropdown
  | 'undo'   // These will be handled by a Command Pattern later
  | 'redo'   // These will be handled by a Command Pattern later
  | 'zoom-in'
  | 'zoom-out'
  | 'image'
  | 'eraser'
  | 'highlighter';

export interface CanvasState {
  elements: Record<string, CanvasElement>;
  selectedElementIds: string[];
  activeTool: CanvasTool;
  zoom: number;
  pan: { x: number; y: number };
  isDrawing: boolean;
  isPreviewing: boolean;
  previewElement: CanvasElement | null;
  isResizing: boolean;
  resizeHandle: string | null;
  resizeStartPos: { x: number; y: number };
  resizeStartSize: { width: number; height: number };
  isEditingText: string | null;
  showTextFormatting: boolean;
  textFormattingPosition: { left: number; top: number } | null;
  selectedTextElement: string | null; // Element ID that has selected text
  selectedTextRange: { start: number; end: number } | null; // Text selection range
  history: Record<string, CanvasElement>[];
  historyIndex: number;
  isDragging: boolean;
  dragStartPos: { x: number; y: number };
  dragStartElementPos: Record<string, { x: number; y: number; }> | null;
  // Other potential state properties based on future needs:
  // isSaving: boolean;
  // lastSaved: Date | null;
  // currentCanvasId: string | null; // If managing multiple canvases

  // Actions
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string, shiftKey?: boolean) => void; // Added shiftKey for multi-select behavior
  setSelectedElementIds: (ids: string[]) => void; // Action to directly set selected IDs
  deselectElement: (id: string) => void;
  clearSelection: () => void;
  setActiveTool: (tool: CanvasTool) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setPreviewState: (isPreviewing: boolean, previewElement?: CanvasElement | null) => void;
  setResizeState: (isResizing: boolean, handle?: string | null, startPos?: { x: number; y: number }, startSize?: { width: number; height: number }) => void;
  setIsEditingText: (elementId: string | null) => void;
  setTextFormattingState: (show: boolean, position?: { left: number; top: number } | null) => void;
  setTextSelectionState: (elementId: string | null, range?: { start: number; end: number } | null, position?: { left: number; top: number } | null) => void;
  addToHistory: (currentElementsState: Record<string, CanvasElement>) => void;
  undo: () => void;
  redo: () => void;
  setDragState: (isDragging: boolean, startPos?: { x: number; y: number }, startElementPos?: Record<string, { x: number; y: number; }> | null) => void;
  // Placeholder for future actions from the roadmap (e.g., related to backend persistence)
}

export const useCanvasStore = create<CanvasState>((set) => ({
  elements: {},
  selectedElementIds: [],
  activeTool: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },
  isDrawing: false,
  isPreviewing: false,
  previewElement: null,
  isResizing: false,
  resizeHandle: null,
  resizeStartPos: { x: 0, y: 0 },
  resizeStartSize: { width: 0, height: 0 },
  isEditingText: null,
  showTextFormatting: false,
  textFormattingPosition: null,
  selectedTextElement: null,
  selectedTextRange: null,
  history: [],
  historyIndex: -1,
  isDragging: false,
  dragStartPos: { x: 0, y: 0 },
  dragStartElementPos: null,

  addElement: (element) => set((state) => ({
    elements: {
      ...state.elements,
      [element.id]: element
    }
  })),

  updateElement: (id, updates) => set((state) => {
    if (!state.elements[id]) return state; // Element might have been deleted
    return {
      elements: {
        ...state.elements,
        [id]: { ...state.elements[id], ...updates }
      }
    };
  }),

  updateMultipleElements: (updates) => set((state) => {
    const newElements = { ...state.elements };
    for (const id in updates) {
      if (newElements[id]) {
        newElements[id] = { ...newElements[id], ...updates[id] };
      }
    }
    return { elements: newElements };
  }),

  deleteElement: (id) => set((state) => {
    const { [id]: _, ...remainingElements } = state.elements; // Destructure to remove element
    return {
      elements: remainingElements,
      selectedElementIds: state.selectedElementIds.filter(selectedId => selectedId !== id)
    };
  }),

  selectElement: (id, shiftKey = false) => set((state) => {
    const currentSelection = state.selectedElementIds;
    if (shiftKey) {
      // Toggle selection for this ID if shift is pressed
      if (currentSelection.includes(id)) {
        return { selectedElementIds: currentSelection.filter(selId => selId !== id) };
      }
      return { selectedElementIds: [...currentSelection, id] };
    }
    // If not shift key, select only this element (if not already sole selection)
    if (currentSelection.length === 1 && currentSelection[0] === id) {
        return {}; // No change if already selected and is the only one
    }
    return { selectedElementIds: [id] }; 
  }),

  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),

  deselectElement: (id) => set((state) => ({
    selectedElementIds: state.selectedElementIds.filter(selectedId => selectedId !== id)
  })),

  clearSelection: () => set({ selectedElementIds: [] }),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setZoom: (zoom) => set(({
    // Add constraints to zoom level if necessary
    // Add constraints to zoom level if necessary
    zoom: Math.max(0.1, Math.min(zoom, 10)) // Example: zoom between 0.1x and 10x
  })),

  setPan: (pan) => set({ pan }),

  setIsDrawing: (isDrawing) => set({ isDrawing }),

  setPreviewState: (isPreviewing, previewElement) => set({ 
    isPreviewing, 
    previewElement: previewElement !== undefined ? previewElement : null 
  }),

  setResizeState: (isResizing, handle, startPos, startSize) => set({
    isResizing,
    resizeHandle: handle ?? null,
    resizeStartPos: startPos ?? { x: 0, y: 0 },
    resizeStartSize: startSize ?? { width: 0, height: 0 }
  }),

  setIsEditingText: (elementId) => set({ isEditingText: elementId }),

  setTextFormattingState: (show, position) => set({
    showTextFormatting: show,
    textFormattingPosition: position ?? null
  }),

  setTextSelectionState: (elementId, range, position) => set({
    selectedTextElement: elementId,
    selectedTextRange: range ?? null,
    showTextFormatting: !!elementId && !!range,
    textFormattingPosition: position ?? null
  }),

  addToHistory: (currentElementsState) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentElementsState); // Store the entire elements object
    const maxHistorySize = 50; // Configurable
    if (newHistory.length > maxHistorySize) {
      newHistory.shift(); // Remove oldest entry
    }
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return {
        elements: state.history[newIndex],
        historyIndex: newIndex,
        selectedElementIds: [] // Clear selection on undo
      };
    }
    // Optionally, if historyIndex is 0, revert to an initial empty state or first state
    return {}; // No change if cannot undo further
  }),

  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return {
        elements: state.history[newIndex],
        historyIndex: newIndex,
        selectedElementIds: [] // Clear selection on redo
      };
    }
    return {}; // No change if cannot redo further
  }),

  setDragState: (isDragging, startPos, startElementPos) => set({
    isDragging,
    dragStartPos: startPos ?? { x: 0, y: 0 },
    dragStartElementPos: startElementPos ?? null
  })
}));

// Note: The original src/hooks/canvas/useCanvasState.ts will need to be refactored or removed
// as its primary state management responsibilities are now handled by this Zustand store.
// Any utility functions or complex logic from useCanvasState.ts not directly related to
// simple state setters/getters might need to be migrated elsewhere or adapted.