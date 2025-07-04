import { useShallow } from 'zustand/react/shallow';
import { UnifiedCanvasState, UnifiedCanvasActions } from "../unifiedCanvasStore";

type CanvasState = UnifiedCanvasState & UnifiedCanvasActions;

/**
 * Standardized, memoized selectors for the UnifiedCanvasStore.
 * These selectors are designed to be used with `useShallow` to prevent
 * unnecessary re-renders by returning stable objects.
 */
export const canvasSelectors = {
  // Element Module
  elementState: (state: CanvasState) => ({
    elements: state.elements,
    elementOrder: state.elementOrder,
  }),
  elementActions: (state: CanvasState) => ({
    getElementById: state.getElementById,
    addElement: state.addElement,
    createElement: state.createElement,
    updateElement: state.updateElement,
    batchUpdate: state.batchUpdate,
    deleteElement: state.deleteElement,
    deleteSelectedElements: state.deleteSelectedElements,
  }),

  // Selection Module
  selectionState: (state: CanvasState) => ({
    selectedElementIds: state.selectedElementIds,
    lastSelectedElementId: state.lastSelectedElementId,
  }),
  selectionActions: (state: CanvasState) => ({
    selectElement: state.selectElement,
    deselectElement: state.deselectElement,
    clearSelection: state.clearSelection,
  }),
  
  // Viewport Module
  viewportState: (state: CanvasState) => ({
    viewport: state.viewport,
    viewportBounds: state.viewportBounds,
  }),
  viewportActions: (state: CanvasState) => ({
    setViewport: state.setViewport,
    zoomViewport: state.zoomViewport,
    panViewport: state.panViewport,
  }),

  // Drawing Module
  drawingState: (state: CanvasState) => ({
    isDrawing: state.isDrawing,
    currentPath: state.currentPath,
    drawingTool: state.drawingTool,
    strokeConfig: state.strokeConfig,
  }),
  drawingActions: (state: CanvasState) => ({
    startDrawing: state.startDrawing,
    updateDrawing: state.updateDrawing,
    finishDrawing: state.finishDrawing,
  }),

  // History Module
  historyState: (state: CanvasState) => ({
    history: state.history,
    currentHistoryIndex: state.currentHistoryIndex,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  }),
  historyActions: (state: CanvasState) => ({
    addToHistory: state.addToHistory,
    undo: state.undo,
    redo: state.redo,
    clearHistory: state.clearHistory,
  }),
  
  // UI Module
  uiState: (state: CanvasState) => ({
    selectedTool: state.selectedTool,
    textEditingElementId: state.textEditingElementId,
    penColor: state.penColor,
    showGrid: state.showGrid,
    snapToGrid: state.snapToGrid,
  }),
  uiActions: (state: CanvasState) => ({
    setSelectedTool: state.setSelectedTool,
    setTextEditingElement: state.setTextEditingElement,
    setPenColor: state.setPenColor,
  }),

  // Table Module (as an example of a feature module)
  tableActions: (state: CanvasState) => ({
    updateTableCell: state.updateTableCell,
    addTableRow: state.addTableRow,
    removeTableRow: state.removeTableRow,
    addTableColumn: state.addTableColumn,
    removeTableColumn: state.removeTableColumn,
  }),
};