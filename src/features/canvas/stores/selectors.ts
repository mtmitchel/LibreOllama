/**
 * Combined selectors for the unified canvas store
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

export const combinedSelectors = {
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
};