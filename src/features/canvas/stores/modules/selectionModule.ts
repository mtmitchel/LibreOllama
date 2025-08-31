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
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get as any;

  return {
    state: {
      selectedElementIds: new Set(),
      lastSelectedElementId: null,
      groups: new Map(),
      elementToGroupMap: new Map(),
    },
    
    actions: {
      selectElement: (id, multiSelect = false) => {
        // Clear edge draft on selection change to prevent stale overlay geometry
        try { (getState() as any).cancelEdgeDraft?.(); } catch {}

        setState((state: any) => {
          // Defensive check - ensure selectedElementIds Set exists
          if (!state.selectedElementIds || !(state.selectedElementIds instanceof Set)) {
            state.selectedElementIds = new Set();
          }
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
        setState((state: any) => {
          if (!state.selectedElementIds || !(state.selectedElementIds instanceof Set)) {
            state.selectedElementIds = new Set();
          }
          state.selectedElementIds.delete(id);
          if (state.lastSelectedElementId === id) {
            state.lastSelectedElementId = null;
          }
        });
      },

      clearSelection: () => {
        setState((state: any) => {
          // Reset to a new Set to avoid calling .clear on non-Set values restored from persistence
          state.selectedElementIds = new Set();
          state.lastSelectedElementId = null;
        });
      },

      getSelectedElements: () => {
        const { elements, selectedElementIds } = getState();
        return Array.from(selectedElementIds).map(id => elements.get(id)).filter(Boolean) as CanvasElement[];
      },

      groupElements: (elementIds: ElementId[]) => {
        const groupId = nanoid() as GroupId;
        setState((state: any) => {
          // Defensive check - ensure groups Map exists
          if (!state.groups || !(state.groups instanceof Map)) {
            state.groups = new Map();
          }
          if (!state.elementToGroupMap || !(state.elementToGroupMap instanceof Map)) {
            state.elementToGroupMap = new Map();
          }
          
          const elementSet = new Set(elementIds);
          state.groups.setState(groupId, elementSet);
          
          // Update element to group mapping
          elementIds.forEach((elementId: ElementId) => {
            state.elementToGroupMap.setState(elementId, groupId);
            // Also update the element itself to store the groupId
            getState().setElementGroup(elementId, groupId);
          });
        });
        return groupId;
      },

      ungroupElements: (groupId: GroupId) => {
        setState((state: any) => {
          // Defensive check - ensure groups Map exists
          if (!state.groups || !(state.groups instanceof Map)) {
            state.groups = new Map();
            return;
          }
          if (!state.elementToGroupMap || !(state.elementToGroupMap instanceof Map)) {
            state.elementToGroupMap = new Map();
          }
          
          const elementIds = state.groups.get(groupId);
          if (elementIds) {
            // Remove elements from group mapping and clear groupId on element
            elementIds.forEach((elementId: ElementId) => {
              state.elementToGroupMap.delete(elementId);
              getState().setElementGroup(elementId, null);
            });
            // Remove the group
            state.groups.delete(groupId);
          }
        });
      },
    },
  };
};