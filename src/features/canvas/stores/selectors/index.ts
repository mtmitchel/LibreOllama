import { CanvasElement, ElementId } from '../../types/enhanced.types';

/**
 * Element selectors
 */
export const elementSelectors = {
  elements: (state: any) => state.elements,
  elementById: (id: string) => (state: any) => state.elements.get(id),
  elementCount: (state: any) => state.elements.size,
  elementOrder: (state: any) => state.elementOrder,
};

/**
 * Selection selectors
 */
export const selectionSelectors = {
  selectedIds: (state: any) => state.selectedElementIds,
  selectedElements: (state: any) =>
    Array.from(state.selectedElementIds)
      .map((id: ElementId) => state.elements.get(id))
      .filter(Boolean) as CanvasElement[],
  hasSelection: (state: any) => state.selectedElementIds.size > 0,
  lastSelectedElementId: (state: any) => state.lastSelectedElementId,
  lastSelectedElement: (state: any) => 
    state.lastSelectedElementId ? state.elements.get(state.lastSelectedElementId) : null,
};

/**
 * Viewport selectors
 */
export const viewportSelectors = {
  viewport: (state: any) => state.viewport,
  viewportBounds: (state: any) => state.viewportBounds,
  scale: (state: any) => state.viewport.scale,
  position: (state: any) => ({ x: state.viewport.x, y: state.viewport.y }),
};

/**
 * Drawing selectors
 */
export const drawingSelectors = {
  isDrawing: (state: any) => state.isDrawing,
  currentPath: (state: any) => state.currentPath,
  drawingTool: (state: any) => state.drawingTool,
  drawingStartPoint: (state: any) => state.drawingStartPoint,
  drawingCurrentPoint: (state: any) => state.drawingCurrentPoint,
  draftSection: (state: any) => state.draftSection,
  strokeConfig: (state: any) => state.strokeConfig,
};

/**
 * History selectors
 */
export const historySelectors = {
  canUndo: (state: any) => state.canUndo,
  canRedo: (state: any) => state.canRedo,
  historyLength: (state: any) => state.history.length,
  currentHistoryIndex: (state: any) => state.currentHistoryIndex,
  currentIndex: (state: any) => state.currentIndex,
};

/**
 * Section selectors
 */
export const sectionSelectors = {
  sections: (state: any) => state.sections,
  sectionElementMap: (state: any) => state.sectionElementMap,
  sectionById: (id: string) => (state: any) => state.sections.get(id),
};

/**
 * UI selectors
 */
export const uiSelectors = {
  selectedTool: (state: any) => state.selectedTool,
  textEditingElementId: (state: any) => state.textEditingElementId,
  selectedStickyNoteColor: (state: any) => state.selectedStickyNoteColor,
  penColor: (state: any) => state.penColor,
  showGrid: (state: any) => state.showGrid,
  snapToGrid: (state: any) => state.snapToGrid,
  isUploading: (state: any) => state.isUploading,
};

/**
 * Sticky Note selectors
 */
export const stickyNoteSelectors = {
  selectedStickyNoteColor: (state: any) => state.selectedStickyNoteColor,
  stickyNoteById: (id: ElementId) => (state: any) => {
    const element = state.elements.get(id);
    return element?.type === 'sticky-note' ? element : null;
  },
  stickyNoteChildren: (id: ElementId) => (state: any) => {
    const stickyNote = state.elements.get(id);
    if (stickyNote?.type === 'sticky-note' && stickyNote.childElementIds) {
      return stickyNote.childElementIds
        .map((childId: ElementId) => state.elements.get(childId))
        .filter(Boolean) as CanvasElement[];
    }
    return [];
  },
};

/**
 * Eraser selectors
 */
export const eraserSelectors = {
  spatialIndex: (state: any) => state.spatialIndex,
  spatialIndexDirty: (state: any) => state.spatialIndexDirty,
  eraserBatch: (state: any) => state.eraserBatch,
  isEraserBatchActive: (state: any) => state.eraserBatch.isActive,
};

/**
 * Combined selectors for convenience
 */
export const combinedSelectors = {
  ...elementSelectors,
  ...selectionSelectors,
  ...viewportSelectors,
  ...drawingSelectors,
  ...historySelectors,
  ...sectionSelectors,
  ...uiSelectors,
  ...stickyNoteSelectors,
  ...eraserSelectors,
};