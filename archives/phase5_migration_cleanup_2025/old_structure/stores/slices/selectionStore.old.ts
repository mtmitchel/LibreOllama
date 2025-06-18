// src/stores/slices/selectionStore.ts
/**
 * Selection Store - Manages element selection and multi-selection
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import { PerformanceMonitor, recordMetric } from '../utils/performance';

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
  getLastSelectedElement: () => string | null;
  
  // Selection operations
  clearSelection: () => void;
  selectAll: (elementIds: string[]) => void;
  invertSelection: (allElementIds: string[]) => void;
  
  // Selection rectangle operations
  startSelectionRectangle: (startX: number, startY: number) => void;
  updateSelectionRectangle: (endX: number, endY: number) => void;
  endSelectionRectangle: () => void;
  getSelectionRectangleBounds: () => { x: number; y: number; width: number; height: number } | null;
  
  // Keyboard modifier operations
  setModifierKey: (key: keyof SelectionState['modifierKeys'], pressed: boolean) => void;
  clearAllModifiers: () => void;
  isMultiSelectMode: () => boolean;
  
  // Selection utilities
  getSelectionBounds: (elementPositions: Record<string, { x: number; y: number; width: number; height: number }>) => { x: number; y: number; width: number; height: number } | null;
  validateSelection: (allElementIds: string[]) => void;
  
  // Performance utilities
  getSelectionPerformance: () => { avgSelectionTime: number; operationCount: number };
  resetSelectionMetrics: () => void;
}

export const createSelectionStore: StateCreator<
  SelectionState,
  [['zustand/immer', never]],
  [],
  SelectionState
> = (set, get) => ({  // Initial state
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
  selectElement: (elementId: string, addToSelection: boolean = false) => {
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
        recordMetric('elementSelected', 1, 'interaction', { 
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
        state.selectedElementIds.delete(elementId);
        
        if (state.lastSelectedElementId === elementId) {
          // Set last selected to another selected element if available
          const remainingIds = Array.from(state.selectedElementIds);
          state.lastSelectedElementId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1]! : null;
        }
        
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] Element deselected:', elementId, 'Total selected:', state.selectedElementIds.size);
      });
      
      recordMetric('elementDeselected', 1, 'interaction', { 
        elementId,
        totalSelected: get().selectedElementIds.size
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

  selectMultipleElements: (elementIds: string[], replaceSelection: boolean = true) => {
    const endTiming = PerformanceMonitor.startTiming('selectMultipleElements');
    
    try {
      console.log('🎯 [SELECTION STORE] Selecting multiple elements:', elementIds.length, { replaceSelection });
      
      set((state: Draft<SelectionState>) => {
        if (replaceSelection) {
          state.selectedElementIds.clear();
        }
        
        elementIds.forEach(id => {
          state.selectedElementIds.add(id);
        });
        
        if (elementIds.length > 0) {
          state.lastSelectedElementId = elementIds.length > 0 ? elementIds[elementIds.length - 1]! : null;
        }
        
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] Multiple elements selected:', state.selectedElementIds.size);
      });
      
      recordMetric('multipleElementsSelected', elementIds.length, 'interaction', { 
        replaceSelection,
        totalSelected: get().selectedElementIds.size
      });
    } finally {
      endTiming();
    }
  },

  // Selection queries
  isElementSelected: (elementId: string): boolean => {
    return get().selectedElementIds.has(elementId);
  },

  getSelectedElementIds: (): string[] => {
    return Array.from(get().selectedElementIds);
  },

  getSelectedElementCount: (): number => {
    return get().selectedElementIds.size;
  },

  hasSelection: (): boolean => {
    return get().selectedElementIds.size > 0;
  },

  getLastSelectedElement: (): string | null => {
    return get().lastSelectedElementId;
  },

  // Selection operations
  clearSelection: () => {
    const endTiming = PerformanceMonitor.startTiming('clearSelection');
    
    try {
      const previousCount = get().selectedElementIds.size;
      console.log('🎯 [SELECTION STORE] Clearing selection:', previousCount, 'elements');
      
      set((state: Draft<SelectionState>) => {
        state.selectedElementIds.clear();
        state.lastSelectedElementId = null;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] Selection cleared');
      });
      
      recordMetric('selectionCleared', previousCount, 'interaction');
    } finally {
      endTiming();
    }
  },

  selectAll: (elementIds: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('selectAll');
    
    try {
      console.log('🎯 [SELECTION STORE] Selecting all elements:', elementIds.length);
      
      set((state: Draft<SelectionState>) => {
        state.selectedElementIds.clear();
        elementIds.forEach(id => {
          state.selectedElementIds.add(id);
        });
        
        if (elementIds.length > 0) {
          state.lastSelectedElementId = elementIds.length > 0 ? elementIds[elementIds.length - 1]! : null;
        }
        
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] All elements selected:', state.selectedElementIds.size);
      });
      
      recordMetric('selectAllElements', elementIds.length, 'interaction');
    } finally {
      endTiming();
    }
  },

  invertSelection: (allElementIds: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('invertSelection');
    
    try {
      const currentSelection = get().selectedElementIds;
      console.log('🎯 [SELECTION STORE] Inverting selection');
      
      set((state: Draft<SelectionState>) => {
        const newSelection = new Set<string>();
        
        allElementIds.forEach(id => {
          if (!currentSelection.has(id)) {
            newSelection.add(id);
          }
        });
        
        state.selectedElementIds = newSelection;
        
        const newSelectionArray = Array.from(newSelection);
        state.lastSelectedElementId = newSelectionArray.length > 0 ? newSelectionArray[newSelectionArray.length - 1]! : null;
        
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        console.log('✅ [SELECTION STORE] Selection inverted:', state.selectedElementIds.size);
      });
      
      recordMetric('selectionInverted', get().selectedElementIds.size, 'interaction');
    } finally {
      endTiming();
    }
  },

  // Selection rectangle operations
  startSelectionRectangle: (startX: number, startY: number) => {
    console.log('📐 [SELECTION STORE] Starting selection rectangle:', { startX, startY });
    
    set((state: Draft<SelectionState>) => {
      state.selectionRectangle = {
        startX,
        startY,
        endX: startX,
        endY: startY,
        isActive: true
      };
    });
    
    recordMetric('selectionRectangleStart', 1, 'interaction');
  },

  updateSelectionRectangle: (endX: number, endY: number) => {
    set((state: Draft<SelectionState>) => {
      if (state.selectionRectangle && state.selectionRectangle.isActive) {
        state.selectionRectangle.endX = endX;
        state.selectionRectangle.endY = endY;
      }
    });
  },

  endSelectionRectangle: () => {
    console.log('📐 [SELECTION STORE] Ending selection rectangle');
    
    set((state: Draft<SelectionState>) => {
      if (state.selectionRectangle) {
        state.selectionRectangle.isActive = false;
      }
    });
    
    recordMetric('selectionRectangleEnd', 1, 'interaction');
    
    // Clear rectangle after a short delay
    setTimeout(() => {
      set((state: Draft<SelectionState>) => {
        state.selectionRectangle = null;
      });
    }, 100);
  },

  getSelectionRectangleBounds: () => {
    const { selectionRectangle } = get();
    if (!selectionRectangle) return null;
    
    const { startX, startY, endX, endY } = selectionRectangle;
    
    return {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY)
    };
  },

  // Keyboard modifier operations
  setModifierKey: (key: keyof SelectionState['modifierKeys'], pressed: boolean) => {
    set((state: Draft<SelectionState>) => {
      state.modifierKeys[key] = pressed;
    });
  },

  clearAllModifiers: () => {
    set((state: Draft<SelectionState>) => {
      state.modifierKeys = {
        shift: false,
        ctrl: false,
        alt: false,
        meta: false
      };
    });
  },

  isMultiSelectMode: (): boolean => {
    const { modifierKeys } = get();
    return modifierKeys.ctrl || modifierKeys.meta;
  },

  // Selection utilities
  getSelectionBounds: (elementPositions: Record<string, { x: number; y: number; width: number; height: number }>) => {
    const selectedIds = get().getSelectedElementIds();
    
    if (selectedIds.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedIds.forEach(id => {
      const pos = elementPositions[id];
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + pos.width);
        maxY = Math.max(maxY, pos.y + pos.height);
      }
    });
    
    if (minX === Infinity) return null;
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  validateSelection: (allElementIds: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('validateSelection');
    
    try {
      const validElementIds = new Set(allElementIds);
      const currentSelection = get().selectedElementIds;
      let hasInvalidElements = false;
      
      set((state: Draft<SelectionState>) => {
        const validSelection = new Set<string>();
        
        currentSelection.forEach(id => {
          if (validElementIds.has(id)) {
            validSelection.add(id);
          } else {
            hasInvalidElements = true;
          }
        });
        
        state.selectedElementIds = validSelection;
        
        // Update last selected element if it's no longer valid
        if (state.lastSelectedElementId && !validElementIds.has(state.lastSelectedElementId)) {
          const validIds = Array.from(validSelection);
          state.lastSelectedElementId = validIds.length > 0 ? validIds[validIds.length - 1]! : null;
        }
      });
      
      if (hasInvalidElements) {
        console.log('🎯 [SELECTION STORE] Selection validated, removed invalid elements');
        recordMetric('selectionValidated', 1, 'interaction', { 
          removedElements: currentSelection.size - get().selectedElementIds.size
        });
      }
    } finally {
      endTiming();
    }
  },

  // Performance utilities
  getSelectionPerformance: () => {
    const { selectionMetrics } = get();
    
    return {
      avgSelectionTime: 0, // Would calculate from timing data
      operationCount: selectionMetrics.selectionOperations
    };
  },

  resetSelectionMetrics: () => {
    set((state: Draft<SelectionState>) => {
      state.selectionMetrics = {
        selectionOperations: 0,
        multiSelectOperations: 0,
        lastSelectionUpdate: 0,
        averageSelectionTime: 0
      };
    });
    
    console.log('🎯 [SELECTION STORE] Selection metrics reset');
  }
});
