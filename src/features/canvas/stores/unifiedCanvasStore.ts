/**
 * Unified Canvas Store - Modularized Version
 * 
 * This is the modularized version of the unified canvas store.
 * It composes multiple focused modules for better maintainability.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import Konva from 'konva';
import { logger } from '../../../core/lib/logger';
import {
  CanvasElement,
  ElementId,
  SectionId,
  ElementOrSectionId,
  GroupId,
} from '../types/enhanced.types';

// Import all modules
import { createElementModule, ElementState, ElementActions } from './modules/elementModule';
import { createSelectionModule, SelectionState, SelectionActions } from './modules/selectionModule';
import { createViewportModule, ViewportState, ViewportActions } from './modules/viewportModule';
import { createDrawingModule, DrawingState, DrawingActions } from './modules/drawingModule';
import { createHistoryModule, HistoryState, HistoryActions } from './modules/historyModule';
import { createSectionModule, SectionState, SectionActions } from './modules/sectionModule';
import { createTableModule, TableState, TableActions } from './modules/tableModule';
import { createStickyNoteModule, StickyNoteState, StickyNoteActions } from './modules/stickyNoteModule';
import { createUIModule, UIState, UIActions } from './modules/uiModule';
import { createEraserModule, EraserState, EraserActions } from './modules/eraserModule';

// Import selectors
import { combinedSelectors } from './selectors';

enableMapSet();

// Canvas event actions interface
export interface CanvasEventActions {
  handleMouseDown: (e: any, pos: { x: number; y: number } | null) => void;
  handleMouseMove: (e: any, pos: { x: number; y: number } | null) => void;
  handleMouseUp: (e: any, pos: { x: number; y: number } | null) => void;
  handleMouseLeave: (e: any, pos: { x: number; y: number } | null) => void;
  handleClick: (e: any, pos: { x: number; y: number } | null) => void;
  handleDoubleClick: (e: any, pos: { x: number; y: number } | null) => void;
  handleContextMenu: (e: any, pos: { x: number; y: number } | null) => void;
  handleDragStart: (e: any, pos: { x: number; y: number } | null) => void;
  handleDragMove: (e: any, pos: { x: number; y: number } | null) => void;
  handleDragEnd: (e: any, pos: { x: number; y: number } | null) => void;
}

// Legacy compatibility actions
export interface LegacyActions {
  exportElements: () => void;
  importElements: (elements: CanvasElement[]) => void;
  handleElementDrop: (elementId: ElementId, targetId?: ElementId) => void;
  createTestElements: () => void;
  groupElements: (elementIds: ElementId[]) => GroupId;
  ungroupElements: (groupId: GroupId) => void;
  isElementInGroup: (elementId: ElementId) => boolean;
  clearCanvas: () => void;
}

// Combined state interface
export interface UnifiedCanvasState extends 
  ElementState,
  SelectionState,
  ViewportState,
  DrawingState,
  HistoryState,
  SectionState,
  TableState,
  StickyNoteState,
  UIState,
  EraserState {
  // No additional state needed - all state comes from modules
}

// Combined actions interface
export interface UnifiedCanvasActions extends
  ElementActions,
  SelectionActions,
  ViewportActions,
  DrawingActions,
  HistoryActions,
  SectionActions,
  TableActions,
  StickyNoteActions,
  UIActions,
  EraserActions,
  CanvasEventActions,
  LegacyActions {
  // No additional actions needed - all actions come from modules
}

export type UnifiedCanvasStore = UnifiedCanvasState & UnifiedCanvasActions;

// Helper function to get element ID from Konva node
const getElementIdFromNode = (node: Konva.Node): ElementId | null => {
  if (node && node.id()) {
    return node.id() as ElementId;
  }
  return null;
};

export const createCanvasStoreSlice: (set: any, get: any) => UnifiedCanvasStore = (set, get) => {
  // Create all modules
  const modules = {
    element: createElementModule(set, get),
    selection: createSelectionModule(set, get),
    viewport: createViewportModule(set, get),
    drawing: createDrawingModule(set, get),
    history: createHistoryModule(set, get),
    section: createSectionModule(set, get),
    table: createTableModule(set, get),
    stickyNote: createStickyNoteModule(set, get),
    ui: createUIModule(set, get),
    eraser: createEraserModule(set, get),
  };

  return {
    // Spread all state
    ...modules.element.state,
    ...modules.selection.state,
    ...modules.viewport.state,
    ...modules.drawing.state,
    ...modules.history.state,
    ...modules.section.state,
    ...modules.table.state,
    ...modules.stickyNote.state,
    ...modules.ui.state,
    ...modules.eraser.state,

    // Spread all actions
    ...modules.element.actions,
    ...modules.selection.actions,
    ...modules.viewport.actions,
    ...modules.drawing.actions,
    ...modules.history.actions,
    ...modules.section.actions,
    ...modules.table.actions,
    ...modules.stickyNote.actions,
    ...modules.ui.actions,
    ...modules.eraser.actions,

    // Canvas event handlers (placeholder implementations)
    handleMouseDown: () => {},
    handleMouseMove: () => {},
    handleMouseUp: () => {},
    handleMouseLeave: () => {},
    handleClick: () => {},
    handleDoubleClick: () => {},
    handleContextMenu: () => {},
    handleDragStart: () => {},
    handleDragMove: () => {},
    handleDragEnd: () => {},

    // Legacy compatibility actions (placeholder implementations)
    exportElements: () => {
      console.log('exportElements not implemented in modular version');
    },
    importElements: (elements: CanvasElement[]) => {
      console.log('importElements not implemented in modular version');
    },
    handleElementDrop: (elementId: ElementId, targetId?: ElementId) => {
      console.log('handleElementDrop not implemented in modular version');
    },
    createTestElements: () => {
      console.log('createTestElements not implemented in modular version');
    },
    groupElements: (elementIds: ElementId[]) => {
      console.log('groupElements not implemented in modular version');
      return '' as GroupId;
    },
    ungroupElements: (groupId: GroupId) => {
      console.log('ungroupElements not implemented in modular version');
    },
    isElementInGroup: (elementId: ElementId) => {
      console.log('isElementInGroup not implemented in modular version');
      return false;
    },
    clearCanvas: () => {
      get().clearAllElements();
    },
  };
};

// Create the unified canvas store
export const useUnifiedCanvasStore = create<UnifiedCanvasStore>()(
  subscribeWithSelector(
    immer(createCanvasStoreSlice)
  )
);

// Add debugging to detect infinite loops
if (process.env.NODE_ENV === 'development') {
  let renderCount = 0;
  const originalSubscribe = useUnifiedCanvasStore.subscribe;
  
  useUnifiedCanvasStore.subscribe = (listener) => {
    return originalSubscribe((state, prevState) => {
      renderCount++;
      if (renderCount > 100) {
        console.error('⚠️ [MODULAR STORE] Potential infinite loop detected! Render count:', renderCount);
        renderCount = 0; // Reset to prevent spam
      }
      listener(state, prevState);
    });
  };
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

export const canvasSelectors = {
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

// Convenience hooks
export const useSelectedElements = () => useUnifiedCanvasStore(canvasSelectors.selectedElements);
export const useSelectedTool = () => useUnifiedCanvasStore(canvasSelectors.selectedTool);
export const usePenColor = () => useUnifiedCanvasStore(canvasSelectors.penColor);

logger.debug('[Store] Unified Canvas Store initialized');

// Expose demo function to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).createStickyNoteDemo = () => {
    const store = useUnifiedCanvasStore.getState();
    return store.createStickyNoteContainerDemo();
  };
  (window as any).useUnifiedCanvasStore = useUnifiedCanvasStore;
  console.log('🧪 [Debug] Added window.createStickyNoteDemo() function');
  console.log('🧪 [Debug] Added window.useUnifiedCanvasStore for debugging');
}