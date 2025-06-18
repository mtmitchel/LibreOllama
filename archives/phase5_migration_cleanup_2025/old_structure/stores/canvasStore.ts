// src/stores/canvasStore.ts
/**
 * Main Canvas Store - Composed from modular slices
 * Part of Phase 2 State Management Refactoring
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createCanvasElementsStore, type CanvasElementsState } from './slices/canvasElementsStore';
import { createTextEditingStore, type TextEditingState } from './slices/textEditingStore';
import { createSelectionStore, type SelectionState } from './slices/selectionStore';
import { createViewportStore, type ViewportState } from './slices/viewportStore';
import { createCanvasUIStore, type CanvasUIState } from './slices/canvasUIStore';
import { createCanvasHistoryStore, type CanvasHistoryState } from './slices/canvasHistoryStore';

// Combined store state
export interface CanvasStoreState extends 
  CanvasElementsState,
  TextEditingState,
  SelectionState,
  ViewportState,
  CanvasUIState,
  CanvasHistoryState {}

// Create the main store with all slices
export const useCanvasStore = create<CanvasStoreState>()(
  subscribeWithSelector(
    immer(
      (...a) => ({
        ...createCanvasElementsStore(...a),
        ...createTextEditingStore(...a),
        ...createSelectionStore(...a),
        ...createViewportStore(...a),
        ...createCanvasUIStore(...a),
        ...createCanvasHistoryStore(...a),
      })
    )
  )
);

// Individual hooks for each slice - for better performance and clarity
export const useCanvasElements = () => useCanvasStore((state) => ({
  elements: state.elements,
  elementOrder: state.elementOrder,
  addElement: state.addElement,
  updateElement: state.updateElement,
  updateMultipleElements: state.updateMultipleElements,
  deleteElement: state.deleteElement,
  deleteElements: state.deleteElements,
  duplicateElement: state.duplicateElement,
  clearAllElements: state.clearAllElements,
  exportElements: state.exportElements,
  importElements: state.importElements,
  getElementById: state.getElementById,
  getElementsByType: state.getElementsByType,
  getElementsBySection: state.getElementsBySection,
  getElementBounds: state.getElementBounds,
  optimizeElement: state.optimizeElement,
}));

export const useTextEditing = () => useCanvasStore((state) => ({
  activeElementId: state.activeElementId,
  isEditing: state.isEditing,
  currentText: state.currentText,
  selectionStart: state.selectionStart,
  selectionEnd: state.selectionEnd,
  richTextSegments: state.richTextSegments,
  lastEditTimestamp: state.lastEditTimestamp,
  startTextEditing: state.startTextEditing,
  updateText: state.updateText,
  insertText: state.insertText,
  deleteText: state.deleteText,
  formatText: state.formatText,
  clearTextFormat: state.clearTextFormat,
  getTextFormat: state.getTextFormat,
  setTextSelection: state.setTextSelection,
  selectAllText: state.selectAllText,
  validateText: state.validateText,
  optimizeText: state.optimizeText,
  stopTextEditing: state.stopTextEditing,
}));

export const useSelection = () => useCanvasStore((state) => ({
  selectedElementIds: state.selectedElementIds,
  lastSelectedId: state.lastSelectedId,
  selectionBounds: state.selectionBounds,
  isMultiSelect: state.isMultiSelect,
  selectElement: state.selectElement,
  deselectElement: state.deselectElement,
  selectMultipleElements: state.selectMultipleElements,
  clearSelection: state.clearSelection,
  toggleElementSelection: state.toggleElementSelection,
  selectAll: state.selectAll,
  getSelectedElements: state.getSelectedElements,
  updateSelectionBounds: state.updateSelectionBounds,
}));

export const useViewport = () => useCanvasStore((state) => ({
  zoom: state.zoom,
  pan: state.pan,
  viewportBounds: state.viewportBounds,
  visibleElementIds: state.visibleElementIds,
  setZoom: state.setZoom,
  setPan: state.setPan,
  zoomIn: state.zoomIn,
  zoomOut: state.zoomOut,
  resetZoom: state.resetZoom,
  zoomToFit: state.zoomToFit,
  zoomToElement: state.zoomToElement,
  panToElement: state.panToElement,
  updateViewportBounds: state.updateViewportBounds,
  updateVisibleElements: state.updateVisibleElements,
  screenToCanvas: state.screenToCanvas,
  canvasToScreen: state.canvasToScreen,
}));

export const useCanvasUI = () => useCanvasStore((state) => ({
  currentTool: state.currentTool,
  isDrawing: state.isDrawing,
  isDragging: state.isDragging,
  showGrid: state.showGrid,
  showRulers: state.showRulers,
  snapToGrid: state.snapToGrid,
  gridSize: state.gridSize,
  penToolSettings: state.penToolSettings,
  setCurrentTool: state.setCurrentTool,
  setIsDrawing: state.setIsDrawing,
  setIsDragging: state.setIsDragging,
  toggleGrid: state.toggleGrid,
  toggleRulers: state.toggleRulers,
  toggleSnapToGrid: state.toggleSnapToGrid,
  setGridSize: state.setGridSize,
  updatePenToolSettings: state.updatePenToolSettings,
}));

export const useCanvasHistory = () => useCanvasStore((state) => ({
  history: state.history,
  currentIndex: state.currentIndex,
  canUndo: state.canUndo,
  canRedo: state.canRedo,
  undo: state.undo,
  redo: state.redo,
  pushToHistory: state.pushToHistory,
  clearHistory: state.clearHistory,
  getHistoryState: state.getHistoryState,
}));

// Main store export for direct access when needed
export default useCanvasStore;
