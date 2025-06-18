// src/stores/slices/selectionStore.ts
/**
 * Selection Store - Manages element selection and multi-selection
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 * Updated to use string[] instead of Set<string> for better component compatibility
 */

import { StateCreator } from 'zustand';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft } from 'immer';
import { PerformanceMonitor } from '../../../../utils/performance/PerformanceMonitor';

export interface SelectionState {
  // Selected element tracking
  selectedElementIds: string[];
  lastSelectedElementId: string | null;
  
  // Selection rectangle for multi-selection
  selectionRectangle: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isActive: boolean;
  } | null;
  
  // Keyboard modifier states
  modifierKeys: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
  
  // Selection performance tracking
  selectionMetrics: {
    selectionOperations: number;
    multiSelectOperations: number;
    lastSelectionUpdate: number;
    averageSelectionTime: number;
  };
  
  // Selection operations
  selectElement: (elementId: string, addToSelection?: boolean) => void;
  deselectElement: (elementId: string) => void;
  toggleElementSelection: (elementId: string) => void;
  selectMultipleElements: (elementIds: string[], replaceSelection?: boolean) => void;
  
  // Selection queries
  isElementSelected: (elementId: string) => boolean;
  getSelectedElementIds: () => string[];
  getSelectedElementCount: () => number;
  hasSelection: () => boolean;
  hasMultipleSelection: () => boolean;
  
  // Selection management
  clearSelection: () => void;
  selectAllElements: (elementIds?: string[]) => void;
  invertSelection: (allElementIds: string[]) => void;
  
  // Selection rectangle operations
  startSelectionRectangle: (startX: number, startY: number) => void;
  updateSelectionRectangle: (endX: number, endY: number) => void;
  completeSelectionRectangle: (elementIds: string[]) => void;
  cancelSelectionRectangle: () => void;
  
  // Modifier key tracking
  updateModifierKeys: (keys: Partial<SelectionState['modifierKeys']>) => void;
  
  // Performance optimization
  optimizeSelection: () => void;
  validateSelection: (allElementIds: string[]) => void;
}

export const createSelectionStore: StateCreator<
  SelectionState,
  [['zustand/immer', never]],
  [],
  SelectionState
> = (set, get) => ({
  // Initial state
  selectedElementIds: [],
  lastSelectedElementId: null,
  selectionRectangle: null,
  
  modifierKeys: {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false
  },
  
  selectionMetrics: {
    selectionOperations: 0,
    multiSelectOperations: 0,
    lastSelectionUpdate: 0,
    averageSelectionTime: 0
  },

  // Selection operations
  selectElement: (elementId: string, addToSelection = false) => {
    const endTiming = PerformanceMonitor.startTiming('selectElement');
    
    try {
      console.log('🎯 [SELECTION STORE] Selecting element:', elementId, { addToSelection });
      
      set((state: Draft<SelectionState>) => {
        if (!addToSelection && !state.modifierKeys.ctrl && !state.modifierKeys.meta) {
          // Clear existing selection if not adding
          state.selectedElementIds.length = 0;
        }
        
        if (!state.selectedElementIds.includes(elementId)) {
          state.selectedElementIds.push(elementId);
        }
        state.lastSelectedElementId = elementId;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        if (state.selectedElementIds.length > 1) {
          state.selectionMetrics.multiSelectOperations++;
        }
        
        console.log('✅ [SELECTION STORE] Element selected:', elementId, 'Total selected:', state.selectedElementIds.length);
      });
      
      PerformanceMonitor.recordMetric('elementSelected', 1, 'interaction', {
        elementId,
        addToSelection,
        totalSelected: get().selectedElementIds.length
      });
    } finally {
      endTiming();
    }
  },

  deselectElement: (elementId: string) => {
    const endTiming = PerformanceMonitor.startTiming('deselectElement');
    
    try {
      console.log('🎯 [SELECTION STORE] Deselecting element:', elementId);
      
      set((state: Draft<SelectionState>) => {
        const index = state.selectedElementIds.indexOf(elementId);
        if (index > -1) {
          state.selectedElementIds.splice(index, 1);
        }
        
        if (state.lastSelectedElementId === elementId) {
          state.lastSelectedElementId = state.selectedElementIds[state.selectedElementIds.length - 1] || null;
        }
        
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] Element deselected:', elementId, 'Total selected:', state.selectedElementIds.length);
      });
      
      PerformanceMonitor.recordMetric('elementDeselected', 1, 'interaction', {
        elementId,
        totalSelected: get().selectedElementIds.length
      });
    } finally {
      endTiming();
    }
  },

  toggleElementSelection: (elementId: string) => {
    const isSelected = get().isElementSelected(elementId);
    if (isSelected) {
      get().deselectElement(elementId);
    } else {
      get().selectElement(elementId, true);
    }
  },

  selectMultipleElements: (elementIds: string[], replaceSelection = true) => {
    const endTiming = PerformanceMonitor.startTiming('selectMultipleElements');
    
    try {
      console.log('🎯 [SELECTION STORE] Selecting multiple elements:', elementIds.length, { replaceSelection });
      
      set((state: Draft<SelectionState>) => {
        if (replaceSelection) {
          state.selectedElementIds.length = 0; // Clear array
        }
        
        for (const id of elementIds) {
          if (!state.selectedElementIds.includes(id)) {
            state.selectedElementIds.push(id);
          }
        }
        
        state.lastSelectedElementId = elementIds[elementIds.length - 1] || null;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] Multiple elements selected:', state.selectedElementIds.length);
      });
      
      PerformanceMonitor.recordMetric('multipleElementsSelected', elementIds.length, 'interaction', {
        replaceSelection,
        totalSelected: get().selectedElementIds.length
      });
    } finally {
      endTiming();
    }
  },

  // Selection queries
  isElementSelected: (elementId: string) => {
    return get().selectedElementIds.includes(elementId);
  },

  getSelectedElementIds: () => {
    return [...get().selectedElementIds]; // Return a copy
  },

  getSelectedElementCount: () => {
    return get().selectedElementIds.length;
  },

  hasSelection: () => {
    return get().selectedElementIds.length > 0;
  },

  hasMultipleSelection: () => {
    return get().selectedElementIds.length > 1;
  },

  // Selection management
  clearSelection: () => {
    const endTiming = PerformanceMonitor.startTiming('clearSelection');
    
    try {
      const previousCount = get().selectedElementIds.length;
      
      set((state: Draft<SelectionState>) => {
        state.selectedElementIds.length = 0; // Clear array
        state.lastSelectedElementId = null;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
      });
      
      console.log('✅ [SELECTION STORE] Selection cleared. Previous count:', previousCount);
      PerformanceMonitor.recordMetric('selectionCleared', previousCount, 'interaction');
    } finally {
      endTiming();
    }
  },

  selectAllElements: (elementIds?: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('selectAllElements');
    
    try {
      set((state: Draft<SelectionState>) => {
        if (elementIds) {
          state.selectedElementIds = [...elementIds];
        }
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] All elements selected:', state.selectedElementIds.length);
      });
      
      PerformanceMonitor.recordMetric('allElementsSelected', get().selectedElementIds.length, 'interaction');
    } finally {
      endTiming();
    }
  },

  invertSelection: (allElementIds: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('invertSelection');
    
    try {
      set((state: Draft<SelectionState>) => {
        const currentSelection = state.selectedElementIds;
        const newSelection = allElementIds.filter(id => !currentSelection.includes(id));
        
        state.selectedElementIds = newSelection;
        state.lastSelectedElementId = newSelection[newSelection.length - 1] || null;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] Selection inverted:', state.selectedElementIds.length);
      });
      
      PerformanceMonitor.recordMetric('selectionInverted', get().selectedElementIds.length, 'interaction');
    } finally {
      endTiming();
    }
  },

  // Selection rectangle operations
  startSelectionRectangle: (startX: number, startY: number) => {
    set((state: Draft<SelectionState>) => {
      state.selectionRectangle = {
        startX,
        startY,
        endX: startX,
        endY: startY,
        isActive: true
      };
    });
  },

  updateSelectionRectangle: (endX: number, endY: number) => {
    set((state: Draft<SelectionState>) => {
      if (state.selectionRectangle) {
        state.selectionRectangle.endX = endX;
        state.selectionRectangle.endY = endY;
      }
    });
  },

  completeSelectionRectangle: (elementIds: string[]) => {
    const addToSelection = get().modifierKeys.ctrl || get().modifierKeys.meta;
    get().selectMultipleElements(elementIds, !addToSelection);
    
    set((state: Draft<SelectionState>) => {
      state.selectionRectangle = null;
    });
  },

  cancelSelectionRectangle: () => {
    set((state: Draft<SelectionState>) => {
      state.selectionRectangle = null;
    });
  },

  // Modifier key tracking
  updateModifierKeys: (keys: Partial<SelectionState['modifierKeys']>) => {
    set((state: Draft<SelectionState>) => {
      Object.assign(state.modifierKeys, keys);
    });
  },

  // Performance optimization
  optimizeSelection: () => {
    const endTiming = PerformanceMonitor.startTiming('optimizeSelection');
    
    try {
      set((state: Draft<SelectionState>) => {
        // Remove any duplicate IDs (shouldn't happen, but safety check)
        const uniqueIds = Array.from(new Set(state.selectedElementIds));
        
        let optimized = false;
        if (uniqueIds.length !== state.selectedElementIds.length) {
          state.selectedElementIds = uniqueIds;
          optimized = true;
        }
        
        console.log('🔧 [SELECTION STORE] Selection optimized:', { 
          hadDuplicates: optimized,
          finalCount: state.selectedElementIds.length 
        });
      });
    } finally {
      endTiming();
    }
  },

  validateSelection: (allElementIds: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('validateSelection');
    
    try {
      set((state: Draft<SelectionState>) => {
        // Filter out any invalid element IDs
        const validElementIds = new Set(allElementIds);
        const validSelection = state.selectedElementIds.filter(id => validElementIds.has(id));
        
        const removedCount = state.selectedElementIds.length - validSelection.length;
        
        if (removedCount > 0) {
          state.selectedElementIds = validSelection;
          
          // Update last selected if it was invalid
          if (state.lastSelectedElementId && !validElementIds.has(state.lastSelectedElementId)) {
            state.lastSelectedElementId = validSelection[validSelection.length - 1] || null;
          }
          
          console.warn('⚠️ [SELECTION STORE] Invalid element IDs removed:', removedCount);
        }
      });
    } finally {
      endTiming();
    }
  }
});

// Create individual store hook for direct component usage
export const useSelectionStore = create<SelectionState>()(
  subscribeWithSelector(
    immer(createSelectionStore)
  )
);

// Export store selectors for optimized subscriptions
export const useSelectedElementIds = () => useSelectionStore((state) => state.selectedElementIds);
export const useLastSelectedElementId = () => useSelectionStore((state) => state.lastSelectedElementId);
export const useSelectionRectangle = () => useSelectionStore((state) => state.selectionRectangle);
export const useHasSelection = () => useSelectionStore((state) => state.hasSelection());
export const useHasMultipleSelection = () => useSelectionStore((state) => state.hasMultipleSelection());
export const useSelectElement = () => useSelectionStore((state) => state.selectElement);
export const useDeselectElement = () => useSelectionStore((state) => state.deselectElement);
export const useClearSelection = () => useSelectionStore((state) => state.clearSelection);
