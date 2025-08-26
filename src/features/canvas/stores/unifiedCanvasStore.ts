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
import { createEventModule, EventState, EventActions } from './modules/eventModule';

// Import selectors
import { combinedSelectors } from './selectors';
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
  UIActions,
  EraserActions,
  EventActions,
  LegacyActions {
  getVisibleElements: () => CanvasElement[];
}

export type UnifiedCanvasStore = UnifiedCanvasState & UnifiedCanvasActions;

// Helper function to get element ID from Konva node
const getElementIdFromNode = (node: Konva.Node): ElementId | null => {
  if (node && node.id()) {
    return node.id() as ElementId;
  }
  return null;
};

type Get = StoreApi<UnifiedCanvasStore>['getState'];
type Set = (fn: (draft: WritableDraft<UnifiedCanvasStore>) => void) => void;

export const createCanvasStoreSlice: (set: Set, get: Get) => UnifiedCanvasStore = (set, get) => {
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
    event: createEventModule(set, get),
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
    ...modules.event.state,

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
    ...modules.event.actions,

    getVisibleElements: () => {
      const { elements, viewport } = get();
      const visibleElements: CanvasElement[] = [];
      const buffer = 300; // Generous buffer for smooth scrolling

      // Calculate viewport bounds with buffer
      const viewportBounds = {
        left: (-viewport.x - buffer) / viewport.scale,
        top: (-viewport.y - buffer) / viewport.scale,
        right: (viewport.width - viewport.x + buffer) / viewport.scale,
        bottom: (viewport.height - viewport.y + buffer) / viewport.scale,
      };

      // Simple intersection test for each element
      elements.forEach(element => {
        // Always show locked or text elements (critical for UX)
        if (element.isLocked || element.type === 'text') {
          visibleElements.push(element);
          return;
        }

        const elementBounds = {
          left: element.x,
          top: element.y,
          right: element.x + (element.width || 0),
          bottom: element.y + (element.height || 0),
        };
        
        // Simple AABB intersection test
        const isVisible =
          elementBounds.left < viewportBounds.right &&
          elementBounds.right > viewportBounds.left &&
          elementBounds.top < viewportBounds.bottom &&
          elementBounds.bottom > viewportBounds.top;

        if (isVisible) {
          visibleElements.push(element);
        }
      });
      return visibleElements;
    },

    // Legacy compatibility actions
    handleElementDrop: (elementId: ElementId, targetId?: ElementId) => {
      // Element drop functionality - move element to target position or container
      const element = get().elements.get(elementId);
      if (!element) return;
      
      if (targetId) {
        const targetElement = get().elements.get(targetId);
        if (targetElement && targetElement.type === 'section') {
          // Move element into section
          get().updateElement(elementId, { 
            sectionId: targetId as unknown as SectionId,
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