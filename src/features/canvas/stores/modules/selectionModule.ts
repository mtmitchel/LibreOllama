import { CanvasElement, ElementId } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Selection module state
 */
export interface SelectionState {
  selectedElementIds: Set<ElementId>;
  lastSelectedElementId: ElementId | null;
}

/**
 * Selection module actions
 */
export interface SelectionActions {
  selectElement: (id: ElementId, multiSelect?: boolean) => void;
  deselectElement: (id: ElementId) => void;
  clearSelection: () => void;
  getSelectedElements: () => CanvasElement[];
}

/**
 * Creates the selection module
 */
export const createSelectionModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<SelectionState, SelectionActions> => {
  return {
    state: {
      selectedElementIds: new Set(),
      lastSelectedElementId: null,
    },
    
    actions: {
      selectElement: (id, multiSelect = false) => {
        set(state => {
          if (!multiSelect) {
            state.selectedElementIds.clear();
          }
          state.selectedElementIds.add(id);
          state.lastSelectedElementId = id;
        });
      },

      deselectElement: (id) => {
        set(state => {
          state.selectedElementIds.delete(id);
          if (state.lastSelectedElementId === id) {
            state.lastSelectedElementId = null;
          }
        });
      },

      clearSelection: () => {
        set(state => {
          state.selectedElementIds.clear();
          state.lastSelectedElementId = null;
        });
      },

      getSelectedElements: () => {
        const { elements, selectedElementIds } = get();
        return Array.from(selectedElementIds).map(id => elements.get(id)).filter(Boolean) as CanvasElement[];
      },
    },
  };
};