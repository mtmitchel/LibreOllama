// src/stores/slices/selectionStore.ts
/**
 * Selection Store - Manages element selection and multi-selection
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 * Updated to use Set<ElementId> for O(1) performance.
 */

import { StateCreator } from 'zustand';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft } from 'immer';
import { PerformanceMonitor } from '../../utils/performance/PerformanceMonitor';
import { ElementId } from '../../types/enhanced.types';
import { logger } from '../../../../lib/logger';

export interface SelectionState {
  // Selected element tracking
  selectedElementIds: Set<ElementId>;
  lastSelectedElementId: ElementId | null;
  
  // REFACTORING: Store accessor to prevent state duplication
  getElementsFromStore?: () => Map<string, any>;
  
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
  selectElement: (elementId: ElementId, addToSelection?: boolean) => void;
  deselectElement: (elementId: ElementId) => void;
  toggleElementSelection: (elementId: ElementId) => void;
  selectMultipleElements: (elementIds: ElementId[], replaceSelection?: boolean) => void;
  
  // Selection queries
  isElementSelected: (elementId: ElementId) => boolean;
  getSelectedElementIds: () => ElementId[];
  getSelectedElementCount: () => number;
  hasSelection: () => boolean;
  hasMultipleSelection: () => boolean;
  
  // Selection management
  clearSelection: () => void;
  selectAllElements: (elementIds?: ElementId[]) => void;
  invertSelection: (allElementIds: ElementId[]) => void;
  
  // REFACTORED: Remove state duplication - use element store via selectors
  // These methods now work with element IDs only, getting data from element store
  selectElementsByType: (elementType: string) => void;
  selectElementsInArea: (area: { x: number; y: number; width: number; height: number }) => void;
  selectElementsInRadius: (center: { x: number; y: number }, radius: number) => void;
  getSelectionBounds: () => { x: number; y: number; width: number; height: number } | null;
  selectChildElements: (parentElementId: ElementId) => void;
  selectSiblingElements: (elementId: ElementId) => void;
  selectByProperty: (property: string, value: any) => void;
  getSelectionCenter: () => { x: number; y: number } | null;
  
  // Selection rectangle operations
  startSelectionRectangle: (startX: number, startY: number) => void;
  updateSelectionRectangle: (endX: number, endY: number) => void;
  completeSelectionRectangle: (elementIds: ElementId[]) => void;
  cancelSelectionRectangle: () => void;
  
  // Modifier key tracking
  updateModifierKeys: (keys: Partial<SelectionState['modifierKeys']>) => void;
  
  // Performance optimization
  optimizeSelection: () => void;
  validateSelection: (allElementIds: ElementId[]) => void;
}

export const createSelectionStore: StateCreator<
  SelectionState,
  [['zustand/immer', never]],
  [],
  SelectionState
> = (set, get) => ({
  // Initial state
  selectedElementIds: new Set(),
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
  selectElement: (elementId: ElementId, addToSelection = false) => {
    const endTiming = PerformanceMonitor.startTiming('selectElement');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting element:', elementId, { addToSelection });
      
      set((state: Draft<SelectionState>) => {
        if (!addToSelection && !state.modifierKeys.ctrl && !state.modifierKeys.meta) {
          // Clear existing selection if not adding
          state.selectedElementIds.clear();
        }
        
        state.selectedElementIds.add(elementId);
        state.lastSelectedElementId = elementId;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        if (state.selectedElementIds.size > 1) {
          state.selectionMetrics.multiSelectOperations++;
        }
        
        logger.log('✅ [SELECTION STORE] Element selected:', elementId, 'Total selected:', state.selectedElementIds.size);
      });
      
      PerformanceMonitor.recordMetric('elementSelected', 1, 'interaction', {
        elementId,
        addToSelection,
        totalSelected: get().selectedElementIds.size
      });
    } finally {
      endTiming();
    }
  },

  deselectElement: (elementId: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('deselectElement');
    
    try {
      logger.log('🎯 [SELECTION STORE] Deselecting element:', elementId);
      
      set((state: Draft<SelectionState>) => {
        state.selectedElementIds.delete(elementId);
        
        if (state.lastSelectedElementId === elementId) {
          state.lastSelectedElementId = Array.from(state.selectedElementIds).pop() || null;
        }
        
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        logger.log('✅ [SELECTION STORE] Element deselected:', elementId, 'Total selected:', state.selectedElementIds.size);
      });
      
      PerformanceMonitor.recordMetric('elementDeselected', 1, 'interaction', {
        elementId,
        totalSelected: get().selectedElementIds.size
      });
    } finally {
      endTiming();
    }
  },

  toggleElementSelection: (elementId: ElementId) => {
    const isSelected = get().isElementSelected(elementId);
    if (isSelected) {
      get().deselectElement(elementId);
    } else {
      get().selectElement(elementId, true);
    }
  },

  selectMultipleElements: (elementIds: ElementId[], replaceSelection = true) => {
    const endTiming = PerformanceMonitor.startTiming('selectMultipleElements');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting multiple elements:', elementIds.length, { replaceSelection });
      
      set((state: Draft<SelectionState>) => {
        if (replaceSelection) {
          state.selectedElementIds.clear(); // Clear set
        }
        
        for (const id of elementIds) {
          state.selectedElementIds.add(id);
        }
        
        state.lastSelectedElementId = elementIds[elementIds.length - 1] || null;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        logger.log('✅ [SELECTION STORE] Multiple elements selected:', state.selectedElementIds.size);
      });
      
      PerformanceMonitor.recordMetric('multipleElementsSelected', elementIds.length, 'interaction', {
        replaceSelection,
        totalSelected: get().selectedElementIds.size
      });
    } finally {
      endTiming();
    }
  },

  // Selection queries
  isElementSelected: (elementId: ElementId) => {
    return get().selectedElementIds.has(elementId);
  },

  getSelectedElementIds: () => {
    return Array.from(get().selectedElementIds); // Return a copy
  },

  getSelectedElementCount: () => {
    return get().selectedElementIds.size;
  },

  hasSelection: () => {
    return get().selectedElementIds.size > 0;
  },

  hasMultipleSelection: () => {
    return get().selectedElementIds.size > 1;
  },

  // Selection management
  clearSelection: () => {
    const endTiming = PerformanceMonitor.startTiming('clearSelection');
    
    try {
      const previousCount = get().selectedElementIds.size;
      
      set((state: Draft<SelectionState>) => {
        state.selectedElementIds.clear(); // Clear set
        state.lastSelectedElementId = null;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
      });
      
      logger.log('✅ [SELECTION STORE] Selection cleared. Previous count:', previousCount);
      PerformanceMonitor.recordMetric('selectionCleared', previousCount, 'interaction');
    } finally {
      endTiming();
    }
  },

  selectAllElements: (elementIds?: ElementId[]) => {
    const endTiming = PerformanceMonitor.startTiming('selectAllElements');
    
    try {
      set((state: Draft<SelectionState>) => {
        if (elementIds) {
          state.selectedElementIds = new Set(elementIds);
        }
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        logger.log('✅ [SELECTION STORE] All elements selected:', state.selectedElementIds.size);
      });
      
      PerformanceMonitor.recordMetric('allElementsSelected', get().selectedElementIds.size, 'interaction');
    } finally {
      endTiming();
    }
  },

  invertSelection: (allElementIds: ElementId[]) => {
    const endTiming = PerformanceMonitor.startTiming('invertSelection');
    
    try {
      set((state: Draft<SelectionState>) => {
        const currentSelection = state.selectedElementIds;
        const newSelection = new Set(allElementIds.filter(id => !currentSelection.has(id)));
        
        state.selectedElementIds = newSelection;
        state.lastSelectedElementId = Array.from(newSelection).pop() || null;
        state.selectionMetrics.selectionOperations++;
        state.selectionMetrics.multiSelectOperations++;
        state.selectionMetrics.lastSelectionUpdate = performance.now();
        
        logger.log('✅ [SELECTION STORE] Selection inverted:', state.selectedElementIds.size);
      });
      
      PerformanceMonitor.recordMetric('selectionInverted', get().selectedElementIds.size, 'interaction');
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

  completeSelectionRectangle: (elementIds: ElementId[]) => {
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
        // With Set, uniqueness is guaranteed, so this check is no longer needed
        // but we can keep the log for consistency.
        const originalSize = state.selectedElementIds.size;
          logger.log('🔧 [SELECTION STORE] Selection optimized:', { 
          hadDuplicates: false, // Set handles uniqueness automatically
          finalCount: originalSize 
        });
      });
    } finally {
      endTiming();
    }
  },

  validateSelection: (allElementIds: ElementId[]) => {
    const endTiming = PerformanceMonitor.startTiming('validateSelection');
    
    try {
      set((state: Draft<SelectionState>) => {
        // Filter out any invalid element IDs
        const validElementIds = new Set(allElementIds);
        const currentSelection = state.selectedElementIds;
        let changed = false;
        
        for (const selectedId of Array.from(currentSelection)) {
          if (!validElementIds.has(selectedId)) {
            currentSelection.delete(selectedId);
            changed = true;
          }
        }
        
        const removedCount = currentSelection.size - state.selectedElementIds.size;
        
        if (changed) {
          state.selectedElementIds = currentSelection;
          
          // Update last selected if it was invalid
          if (state.lastSelectedElementId && !validElementIds.has(state.lastSelectedElementId)) {
            state.lastSelectedElementId = Array.from(currentSelection).pop() || null;
          }
          
          console.warn('⚠️ [SELECTION STORE] Invalid element IDs removed:', removedCount);
        }
      });
    } finally {
      endTiming();
    }
  },

  // Advanced selection operations implementation
  selectElementsByType: (elementType: string) => {
    const endTiming = PerformanceMonitor.startTiming('selectElementsByType');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting elements by type:', elementType);
      
      // FIXED: Use store accessor instead of duplicated allElements parameter
      const elements = get().getElementsFromStore?.() || new Map();
      const elementsOfType = Array.from(elements.values())
        .filter(element => element.type === elementType)
        .map(element => element.id as ElementId);
      
      get().selectMultipleElements(elementsOfType, true);
      
      PerformanceMonitor.recordMetric('elementsByTypeSelected', elementsOfType.length, 'interaction', { elementType });
      logger.log('✅ [SELECTION STORE] Selected elements by type:', elementType, 'count:', elementsOfType.length);
    } finally {
      endTiming();
    }
  },

  selectElementsInArea: (area: { x: number; y: number; width: number; height: number }) => {
    const endTiming = PerformanceMonitor.startTiming('selectElementsInArea');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting elements in area:', area);
      
      // FIXED: Use store accessor instead of duplicated allElements parameter
      const elements = get().getElementsFromStore?.() || new Map();
      const elementsInArea = Array.from(elements.values()).filter(element => {
        // Check if element overlaps with area
        const elementRight = element.x + (element.width || element.radius * 2 || 100);
        const elementBottom = element.y + (element.height || element.radius * 2 || 100);
        const areaRight = area.x + area.width;
        const areaBottom = area.y + area.height;
        
        return element.x < areaRight && 
               elementRight > area.x && 
               element.y < areaBottom && 
               elementBottom > area.y;
      }).map(element => element.id as ElementId);
      
      get().selectMultipleElements(elementsInArea, true);
      
      PerformanceMonitor.recordMetric('elementsInAreaSelected', elementsInArea.length, 'interaction');
      logger.log('✅ [SELECTION STORE] Selected elements in area:', elementsInArea.length);
    } finally {
      endTiming();
    }
  },

  selectElementsInRadius: (center: { x: number; y: number }, radius: number) => {
    const endTiming = PerformanceMonitor.startTiming('selectElementsInRadius');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting elements in radius:', { center, radius });
      
      // FIXED: Use store accessor instead of duplicated allElements parameter
      const elements = get().getElementsFromStore?.() || new Map();
      const elementsInRadius = Array.from(elements.values()).filter(element => {
        const elementCenterX = element.x + (element.width ? element.width / 2 : element.radius || 50);
        const elementCenterY = element.y + (element.height ? element.height / 2 : element.radius || 50);
        
        const distance = Math.sqrt(
          Math.pow(elementCenterX - center.x, 2) + 
          Math.pow(elementCenterY - center.y, 2)
        );
        
        return distance <= radius;
      }).map(element => element.id as ElementId);
      
      get().selectMultipleElements(elementsInRadius, true);
      
      PerformanceMonitor.recordMetric('elementsInRadiusSelected', elementsInRadius.length, 'interaction');
      logger.log('✅ [SELECTION STORE] Selected elements in radius:', elementsInRadius.length);
    } finally {
      endTiming();
    }
  },

  getSelectionBounds: () => {
    const endTiming = PerformanceMonitor.startTiming('getSelectionBounds');
    
    try {
      const selectedIds = get().getSelectedElementIds();
      if (selectedIds.length === 0) return null;
      
      // FIXED: Use store accessor instead of duplicated allElements parameter
      const elements = get().getElementsFromStore?.() || new Map();
      const selectedElements = Array.from(elements.values()).filter(element => 
        selectedIds.includes(element.id as ElementId)
      );
      
      if (selectedElements.length === 0) return null;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      selectedElements.forEach(element => {
        const width = element.width || element.radius * 2 || 100;
        const height = element.height || element.radius * 2 || 100;
        
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + width);
        maxY = Math.max(maxY, element.y + height);
      });
      
      const bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
      
      PerformanceMonitor.recordMetric('selectionBoundsCalculated', 1, 'interaction');
      logger.log('📐 [SELECTION STORE] Selection bounds calculated:', bounds);
      
      return bounds;
    } finally {
      endTiming();
    }
  },

  selectChildElements: (parentElementId: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('selectChildElements');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting child elements of:', parentElementId);
      
      // FIXED: Use store accessor instead of duplicated allElements parameter
      const elements = get().getElementsFromStore?.() || new Map();
      const childElements = Array.from(elements.values()).filter(element => 
        ('parentId' in element && element.parentId === parentElementId) || 
        ('sectionId' in element && element.sectionId === parentElementId)
      ).map(element => element.id as ElementId);
      
      get().selectMultipleElements(childElements, false); // Add to existing selection
      
      PerformanceMonitor.recordMetric('childElementsSelected', childElements.length, 'interaction');
      logger.log('✅ [SELECTION STORE] Selected child elements:', childElements.length);
    } finally {
      endTiming();
    }
  },

  selectSiblingElements: (elementId: ElementId) => {
    const endTiming = PerformanceMonitor.startTiming('selectSiblingElements');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting sibling elements of:', elementId);
      
      // FIXED: Use store accessor instead of duplicated allElements parameter
      const elements = get().getElementsFromStore?.() || new Map();
      const element = elements.get(elementId);
      if (!element) return;
      
      const siblingElements = Array.from(elements.values()).filter((el: any) => 
        el.id !== elementId && 
        ((element.parentId && el.parentId === element.parentId) || 
         (element.sectionId && el.sectionId === element.sectionId))
      ).map((el: any) => el.id as ElementId);
      
      get().selectMultipleElements(siblingElements, false); // Add to existing selection
      
      PerformanceMonitor.recordMetric('siblingElementsSelected', siblingElements.length, 'interaction');
      logger.log('✅ [SELECTION STORE] Selected sibling elements:', siblingElements.length);
    } finally {
      endTiming();
    }
  },

  selectByProperty: (property: string, value: any) => {
    const endTiming = PerformanceMonitor.startTiming('selectByProperty');
    
    try {
      logger.log('🎯 [SELECTION STORE] Selecting elements by property:', { property, value });
      
      // FIXED: Use store accessor instead of duplicated allElements parameter
      const elements = get().getElementsFromStore?.() || new Map();
      const matchingElements = Array.from(elements.values()).filter((element: any) => 
        element[property] === value
      ).map((element: any) => element.id as ElementId);
      
      get().selectMultipleElements(matchingElements, true);
      
      PerformanceMonitor.recordMetric('elementsByPropertySelected', matchingElements.length, 'interaction', { property });
      logger.log('✅ [SELECTION STORE] Selected elements by property:', matchingElements.length);
    } finally {
      endTiming();
    }
  },

  getSelectionCenter: () => {
    const endTiming = PerformanceMonitor.startTiming('getSelectionCenter');
    
    try {
      const bounds = get().getSelectionBounds();
      if (!bounds) return null;
      
      const center = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2
      };
      
      PerformanceMonitor.recordMetric('selectionCenterCalculated', 1, 'interaction');
      console.log('📍 [SELECTION STORE] Selection center calculated:', center);
      
      return center;
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
