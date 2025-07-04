/**
 * Combined selectors for the unified canvas store
 * Enhanced selectors to reduce multiple subscriptions
 */

import { CanvasElement, ElementId } from '../types/enhanced.types';

interface UnifiedCanvasState {
  elements: Map<string, CanvasElement>;
  selectedElementIds: Set<ElementId>;
  selectedTool: string;
  viewport: {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
  };
  isDrawing: boolean;
  draftSection: any;
  sections: Map<string, any>;
  canUndo: boolean;
  canRedo: boolean;
  lastSelectedElementId: ElementId | null;
  penColor: string;
  currentPath: number[] | null;
  textEditingElementId: ElementId | null;
  startDrawing: any;
  updateDrawing: any;
  finishDrawing: any;
  cancelDrawing: any;
  setSelectedTool: any;
  addElement: any;
  findStickyNoteAtPoint: any;
  addElementToStickyNote: any;
  selectElement: any;
  deselectElement: any;
  clearSelection: any;
  updateElement: any;
  setTextEditingElement: any;
  selectedStickyNoteColor: string;
  enableStickyNoteContainer: boolean;
}

// Cached selectors to prevent infinite loops
const elementsSelector = (state: UnifiedCanvasState) => state.elements;
const selectedElementIdsSelector = (state: UnifiedCanvasState) => state.selectedElementIds;
const selectedToolSelector = (state: UnifiedCanvasState) => state.selectedTool;
const viewportSelector = (state: UnifiedCanvasState) => state.viewport;
const isDrawingSelector = (state: UnifiedCanvasState) => state.isDrawing;
const draftSectionSelector = (state: UnifiedCanvasState) => state.draftSection;
const sectionsSelector = (state: UnifiedCanvasState) => state.sections;
const canUndoSelector = (state: UnifiedCanvasState) => state.canUndo;
const canRedoSelector = (state: UnifiedCanvasState) => state.canRedo;
const penColorSelector = (state: UnifiedCanvasState) => state.penColor;

// Enhanced grouped selectors
const drawingStateSelector = (state: UnifiedCanvasState) => ({
  isDrawing: state.isDrawing,
  currentPath: state.currentPath,
  penColor: state.penColor
});

const drawingActionsSelector = (state: UnifiedCanvasState) => ({
  startDrawing: state.startDrawing,
  updateDrawing: state.updateDrawing,
  finishDrawing: state.finishDrawing,
  cancelDrawing: state.cancelDrawing
});

const toolStateSelector = (state: UnifiedCanvasState) => ({
  selectedTool: state.selectedTool,
  isDrawing: state.isDrawing,
  textEditingElementId: state.textEditingElementId
});

const toolActionsSelector = (state: UnifiedCanvasState) => ({
  setSelectedTool: state.setSelectedTool,
  setTextEditingElement: state.setTextEditingElement,
  addElement: state.addElement,
  updateElement: state.updateElement
});

const elementStateSelector = (state: UnifiedCanvasState) => ({
  elements: state.elements,
  selectedElementIds: state.selectedElementIds,
  lastSelectedElementId: state.lastSelectedElementId
});

const elementActionsSelector = (state: UnifiedCanvasState) => ({
  addElement: state.addElement,
  updateElement: state.updateElement,
  selectElement: state.selectElement,
  deselectElement: state.deselectElement,
  clearSelection: state.clearSelection
});

const selectionStateSelector = (state: UnifiedCanvasState) => ({
  selectedElementIds: state.selectedElementIds,
  lastSelectedElementId: state.lastSelectedElementId,
  selectedElements: Array.from(state.selectedElementIds)
    .map(id => state.elements.get(id))
    .filter(Boolean) as CanvasElement[]
});

const selectionActionsSelector = (state: UnifiedCanvasState) => ({
  selectElement: state.selectElement,
  deselectElement: state.deselectElement,
  clearSelection: state.clearSelection
});

const stickyNoteStateSelector = (state: UnifiedCanvasState) => ({
  selectedStickyNoteColor: state.selectedStickyNoteColor,
  enableStickyNoteContainer: state.enableStickyNoteContainer,
  textEditingElementId: state.textEditingElementId
});

const stickyNoteActionsSelector = (state: UnifiedCanvasState) => ({
  findStickyNoteAtPoint: state.findStickyNoteAtPoint,
  addElementToStickyNote: state.addElementToStickyNote,
  setTextEditingElement: state.setTextEditingElement
});

const viewportStateSelector = (state: UnifiedCanvasState) => ({
  viewport: state.viewport
});

export const combinedSelectors = {
  // Basic selectors (backward compatibility)
  elements: elementsSelector,
  elementById: (id: ElementId) => (state: UnifiedCanvasState) => state.elements.get(id),
  selectedElementIds: selectedElementIdsSelector,
  selectedElements: (state: UnifiedCanvasState) =>
    Array.from(state.selectedElementIds)
      .map(id => state.elements.get(id))
      .filter(Boolean) as CanvasElement[],
  selectedTool: selectedToolSelector,
  viewport: viewportSelector,
  isDrawing: isDrawingSelector,
  draftSection: draftSectionSelector,
  sections: sectionsSelector,
  canUndo: canUndoSelector,
  canRedo: canRedoSelector,
  lastSelectedElement: (state: UnifiedCanvasState) => 
    state.lastSelectedElementId ? state.elements.get(state.lastSelectedElementId) : null,
  penColor: penColorSelector,

  // Enhanced grouped selectors
  drawingState: drawingStateSelector,
  drawingActions: drawingActionsSelector,
  toolState: toolStateSelector,
  toolActions: toolActionsSelector,
  elementState: elementStateSelector,
  elementActions: elementActionsSelector,
  selectionState: selectionStateSelector,
  selectionActions: selectionActionsSelector,
  stickyNoteState: stickyNoteStateSelector,
  stickyNoteActions: stickyNoteActionsSelector,
  viewportState: viewportStateSelector
};