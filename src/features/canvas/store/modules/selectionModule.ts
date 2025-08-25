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
          // Note: We don't validate element existence here to allow temporary selections
          // during element creation workflows. Validation happens in getSelectedElements()
          if (multiSelect) {
            if (state.selectedElementIds.has(id)) {
              state.selectedElementIds.delete(id);
            } else {
              state.selectedElementIds.add(id);
            }
          } else {
            state.selectedElementIds.clear();
            state.selectedElementIds.add(id);
          }
      
          const selectedIds = Array.from(state.selectedElementIds);
          state.lastSelectedElementId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
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
            // Also update the element itself to store the groupId
            get().setElementGroup(elementId, groupId);
          });
        });
        return groupId;
      },

      ungroupElements: (groupId: GroupId) => {
        set(state => {
          const elementIds = state.groups.get(groupId);
          if (elementIds) {
            // Remove elements from group mapping and clear groupId on element
            elementIds.forEach((elementId: ElementId) => {
              state.elementToGroupMap.delete(elementId);
              get().setElementGroup(elementId, null);
            });
            // Remove the group
            state.groups.delete(groupId);
          }
        });
      },
    },
  };
};