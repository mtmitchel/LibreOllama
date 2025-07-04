import { CanvasElement, ElementId, GroupId } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';
import { nanoid } from 'nanoid';

/**
 * Selection module state
 */
export interface SelectionState {
  selectedElementIds: Set<ElementId>;
  lastSelectedElementId: ElementId | null;
  groups: Map<GroupId, Set<ElementId>>;
  elementToGroupMap: Map<ElementId, GroupId>;
}

/**
 * Selection module actions
 */
export interface SelectionActions {
  selectElement: (id: ElementId, multiSelect?: boolean) => void;
  deselectElement: (id: ElementId) => void;
  clearSelection: () => void;
  getSelectedElements: () => CanvasElement[];
  groupElements: (elementIds: ElementId[]) => GroupId;
  ungroupElements: (groupId: GroupId) => void;
  isElementInGroup: (elementId: ElementId) => boolean;
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
      groups: new Map(),
      elementToGroupMap: new Map(),
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

      groupElements: (elementIds: ElementId[]) => {
        const groupId = nanoid() as GroupId;
        set(state => {
          const elementSet = new Set(elementIds);
          state.groups.set(groupId, elementSet);
          
          // Update element to group mapping
          elementIds.forEach((elementId: ElementId) => {
            state.elementToGroupMap.set(elementId, groupId);
          });
        });
        return groupId;
      },

      ungroupElements: (groupId: GroupId) => {
        set(state => {
          const elementIds = state.groups.get(groupId);
          if (elementIds) {
            // Remove elements from group mapping
            elementIds.forEach((elementId: ElementId) => {
              state.elementToGroupMap.delete(elementId);
            });
            // Remove the group
            state.groups.delete(groupId);
          }
        });
      },

      isElementInGroup: (elementId: ElementId) => {
        const { elementToGroupMap } = get();
        return elementToGroupMap.has(elementId);
      },
    },
  };
};