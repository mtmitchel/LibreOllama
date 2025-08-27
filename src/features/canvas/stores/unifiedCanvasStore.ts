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
// Removed unused import: logger
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
import { createLoadingModule, LoadingState, LoadingActions } from './modules/loadingModule';
import { createUIModule, UIState, UIActions } from './modules/uiModule';
import { createEraserModule, EraserState, EraserActions } from './modules/eraserModule';
import { createEventModule, EventState, EventActions } from './modules/eventModule';

// Removed unused import: combinedSelectors
import { StoreApi } from 'zustand';
import { WritableDraft } from 'immer';


enableMapSet();

// Legacy compatibility actions
export interface LegacyActions {
  exportElements: () => void;
  importElements: (elements: CanvasElement[]) => void;
  handleElementDrop: (elementId: ElementId, targetId?: ElementId) => void;
  createTestElements: () => void;
  createStressTestElements: (count: number) => void;
  groupElements: (elementIds: ElementId[]) => GroupId;
  ungroupElements: (groupId: GroupId) => void;
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
  LoadingState,
  UIState,
  EraserState,
  EventState {
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
  LoadingActions,
  UIActions,
  EraserActions,
  EventActions,
  LegacyActions {
  getVisibleElements: () => CanvasElement[];
}

export type UnifiedCanvasStore = UnifiedCanvasState & UnifiedCanvasActions;

// Removed unused helper function: getElementIdFromNode

type Get = StoreApi<UnifiedCanvasStore>['getState'];
type Set = (fn: (draft: WritableDraft<UnifiedCanvasStore>) => void) => void;

export const createCanvasStoreSlice: (set: Set, get: Get) => UnifiedCanvasStore = (set, get) => {
  // Create all modules with guaranteed initialization
  const modules = {
    element: createElementModule(set as any, get as any),
    selection: createSelectionModule(set as any, get as any),
    viewport: createViewportModule(set as any, get as any),
    drawing: createDrawingModule(set as any, get as any),
    history: createHistoryModule(set as any, get as any),
    section: createSectionModule(set as any, get as any),
    table: createTableModule(set as any, get as any),
    stickyNote: createStickyNoteModule(set as any, get as any),
    loading: createLoadingModule(set as any, get as any),
    ui: createUIModule(set as any, get as any),
    eraser: createEraserModule(set as any, get as any),
    event: createEventModule(set as any, get as any),
  };

  return {
    // Spread all state and actions from modules
    ...modules.element.state,
    ...modules.element.actions,
    ...modules.selection.state,
    ...modules.selection.actions,
    ...modules.viewport.state,
    ...modules.viewport.actions,
    ...modules.drawing.state,
    ...modules.drawing.actions,
    ...modules.history.state,
    ...modules.history.actions,
    ...modules.section.state,
    ...modules.section.actions,
    ...modules.table.state,
    ...modules.table.actions,
    ...modules.stickyNote.state,
    ...modules.stickyNote.actions,
    ...modules.loading.state,
    ...modules.loading.actions,
    ...modules.ui.state,
    ...modules.ui.actions,
    ...modules.eraser.state,
    ...modules.eraser.actions,
    ...modules.event.state,
    ...modules.event.actions,

    getVisibleElements: () => {
      // Use standardized simple viewport culling - no duplicate logic
      const { elements, viewport } = get();
      console.warn('[UnifiedCanvasStore] getVisibleElements is deprecated. Use useSimpleViewportCulling hook instead.');
      return Array.from(elements.values());
    },

    // Legacy compatibility actions
    handleElementDrop: (elementId: ElementId, targetId?: ElementId | SectionId) => {
      // Element drop functionality - move element to target position or container
      const element = get().elements.get(elementId);
      if (!element) return;
      
      if (targetId) {
        const targetElement = get().elements.get(targetId);
        if (targetElement && targetElement.type === 'section') {
          // Move element into section
          get().updateElement(elementId, { 
            sectionId: targetId as SectionId,
            x: targetElement.x + 10,
            y: targetElement.y + 40 
          });
        }
      }
    },
    createTestElements: () => {
      // Create test elements for development
      get().createStressTestElements(5);
    },
    createStressTestElements: (count: number) => {
      get().createStressTestElements(count);
    },
    groupElements: (elementIds: ElementId[]) => {
      return get().groupElements(elementIds);
    },
    ungroupElements: (groupId: GroupId) => {
      get().ungroupElements(groupId);
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

// Debug loop detection disabled for performance

// Store initialized