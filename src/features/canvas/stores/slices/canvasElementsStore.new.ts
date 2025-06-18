// src/stores/slices/canvasElementsStore.ts
/**
 * Canvas Elements Store - Handles element CRUD operations
 * Part of the LibreOllama Canvas Architecture Enhancement - Phase 2
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import type { CanvasElement } from '../types';
import { PerformanceMonitor } from '../../../../utils/performance/PerformanceMonitor';

export interface CanvasElementsState {
  // Element data
  elements: Record<string, CanvasElement>;
  elementOrder: string[];
  
  // Element operations
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElement: (id: string) => void;
  
  // Element queries
  getElementById: (id: string) => CanvasElement | null;
  getElementsByType: (type: CanvasElement['type']) => CanvasElement[];
  getElementsByIds: (ids: string[]) => CanvasElement[];
  getAllElements: () => CanvasElement[];
  
  // Element utilities
  clearAllElements: () => void;
  exportElements: () => CanvasElement[];
  importElements: (elements: CanvasElement[]) => void;
  validateElement: (element: CanvasElement) => boolean;
  optimizeElement: (id: string) => void;
}

export const createCanvasElementsStore: StateCreator<
  CanvasElementsState,
  [['zustand/immer', never]],
  [],
  CanvasElementsState
> = (set, get) => ({
  // Initial state
  elements: {},
  elementOrder: [],

  // Element operations with performance monitoring
  addElement: (element: CanvasElement) => {
    const endTiming = PerformanceMonitor.startTiming('addElement');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Adding element:', element.id, element.type);
      
      set((state: Draft<CanvasElementsState>) => {
        // Validate element before adding
        if (!get().validateElement(element)) {
          console.error('🔧 [ELEMENTS STORE] Invalid element rejected:', element);
          return;
        }
        
        state.elements[element.id] = { ...element };
        if (!state.elementOrder.includes(element.id)) {
          state.elementOrder.push(element.id);
        }
        console.log('✅ [ELEMENTS STORE] Element added successfully:', element.id);
      });
      
      PerformanceMonitor.recordMetric('elementAdded', 1, 'canvas', { elementType: element.type });
    } finally {
      endTiming();
    }
  },

  updateElement: (id: string, updates: Partial<CanvasElement>) => {
    const endTiming = PerformanceMonitor.startTiming('updateElement');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Updating element:', id, updates);
      
      set((state: Draft<CanvasElementsState>) => {
        const element = state.elements[id];
        if (!element) {
          console.warn('🔧 [ELEMENTS STORE] Element not found for update:', id);
          return;
        }
          // Apply updates
        if (state.elements[id]) {
          Object.assign(state.elements[id], updates);
        }
        console.log('✅ [ELEMENTS STORE] Element updated successfully:', id);
      });
      
      PerformanceMonitor.recordMetric('elementUpdated', 1, 'canvas', { elementType: get().elements[id]?.type });
    } finally {
      endTiming();
    }
  },

  updateMultipleElements: (updates: Record<string, Partial<CanvasElement>>) => {
    const endTiming = PerformanceMonitor.startTiming('updateMultipleElements');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Updating multiple elements:', Object.keys(updates));
      
      set((state: Draft<CanvasElementsState>) => {
        Object.entries(updates).forEach(([id, elementUpdates]) => {
          const element = state.elements[id];
          if (element) {
            Object.assign(element, elementUpdates);
          }
        });
      });
      
      PerformanceMonitor.recordMetric('multipleElementsUpdated', Object.keys(updates).length, 'canvas');
    } finally {
      endTiming();
    }
  },

  deleteElement: (id: string) => {
    const endTiming = PerformanceMonitor.startTiming('deleteElement');
    
    try {
      const element = get().elements[id];
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for deletion:', id);
        return;
      }

      set((state: Draft<CanvasElementsState>) => {
        delete state.elements[id];
        state.elementOrder = state.elementOrder.filter(elementId => elementId !== id);
      });
      
      PerformanceMonitor.recordMetric('elementDeleted', 1, 'canvas', { elementType: element.type });
      console.log('✅ [ELEMENTS STORE] Element deleted successfully:', id);
    } finally {
      endTiming();
    }
  },

  deleteElements: (ids: string[]) => {
    const endTiming = PerformanceMonitor.startTiming('deleteElements');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Deleting multiple elements:', ids);
      
      set((state: Draft<CanvasElementsState>) => {
        ids.forEach(id => {
          delete state.elements[id];
        });
        state.elementOrder = state.elementOrder.filter(elementId => !ids.includes(elementId));
      });
      
      PerformanceMonitor.recordMetric('elementsDeleted', ids.length, 'canvas');
    } finally {
      endTiming();
    }
  },

  duplicateElement: (id: string) => {
    const endTiming = PerformanceMonitor.startTiming('duplicateElement');
    
    try {
      const element = get().elements[id];
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for duplication:', id);
        return;
      }

      const duplicatedElement: CanvasElement = {
        ...element,
        id: `${element.id}_copy_${Date.now()}`,
        x: element.x + 10,
        y: element.y + 10
      };

      get().addElement(duplicatedElement);
      
      PerformanceMonitor.recordMetric('elementDuplicated', 1, 'canvas', { elementType: element.type });
      console.log('✅ [ELEMENTS STORE] Element duplicated successfully:', id, '→', duplicatedElement.id);
    } finally {
      endTiming();
    }
  },

  // Element queries
  getElementById: (id: string) => {
    return get().elements[id] || null;
  },

  getElementsByType: (type: CanvasElement['type']) => {
    const elements = get().elements;
    return Object.values(elements).filter(element => element.type === type);
  },

  getElementsByIds: (ids: string[]) => {
    const elements = get().elements;
    return ids.map(id => elements[id]).filter(Boolean) as CanvasElement[];
  },

  getAllElements: () => {
    return Object.values(get().elements);
  },

  // Element utilities
  clearAllElements: () => {
    const endTiming = PerformanceMonitor.startTiming('clearAllElements');
    
    try {
      const elementCount = Object.keys(get().elements).length;
      console.log('🔧 [ELEMENTS STORE] Clearing all elements, count:', elementCount);
      
      set((state: Draft<CanvasElementsState>) => {
        state.elements = {};
        state.elementOrder = [];
      });
      
      PerformanceMonitor.recordMetric('allElementsCleared', elementCount, 'canvas');
      console.log('✅ [ELEMENTS STORE] All elements cleared successfully');
    } finally {
      endTiming();
    }
  },

  exportElements: () => {
    const endTiming = PerformanceMonitor.startTiming('exportElements');
    
    try {
      const elements = Object.values(get().elements);
      console.log('🔧 [ELEMENTS STORE] Exporting elements, count:', elements.length);
      
      PerformanceMonitor.recordMetric('elementsExported', elements.length, 'canvas');
      return elements;
    } finally {
      endTiming();
    }
  },

  importElements: (elements: CanvasElement[]) => {
    const endTiming = PerformanceMonitor.startTiming('importElements');
    
    try {
      console.log('🔧 [ELEMENTS STORE] Importing elements, count:', elements.length);
      
      // Validate all elements first
      const validElements = elements.filter(element => get().validateElement(element));
      
      if (validElements.length !== elements.length) {
        console.warn('🔧 [ELEMENTS STORE] Some elements failed validation during import');
      }
      
      set((state: Draft<CanvasElementsState>) => {
        validElements.forEach(element => {
          state.elements[element.id] = { ...element };
          if (!state.elementOrder.includes(element.id)) {
            state.elementOrder.push(element.id);
          }
        });
      });
      
      PerformanceMonitor.recordMetric('elementsImported', validElements.length, 'canvas');
      console.log('✅ [ELEMENTS STORE] Elements imported successfully:', validElements.length);
    } finally {
      endTiming();
    }
  },

  validateElement: (element: CanvasElement): boolean => {
    const endTiming = PerformanceMonitor.startTiming('validateElement');
    
    try {
      // Basic validation
      if (!element || typeof element !== 'object') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: not an object');
        return false;
      }
      
      if (!element.id || typeof element.id !== 'string') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid id');
        return false;
      }
      
      if (!element.type || typeof element.type !== 'string') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid type');
        return false;
      }
      
      if (typeof element.x !== 'number' || typeof element.y !== 'number') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid coordinates');
        return false;
      }
      
      if (typeof element.width !== 'number' || typeof element.height !== 'number') {
        console.error('🔧 [ELEMENTS STORE] Invalid element: missing or invalid dimensions');
        return false;
      }
      
      PerformanceMonitor.recordMetric('textValidation', 1, 'interaction', {
        isValid: true,
        elementType: element.type
      });
      
      return true;
    } finally {
      endTiming();
    }
  },

  optimizeElement: (id: string) => {
    const endTiming = PerformanceMonitor.startTiming('optimizeElement');
    
    try {
      const element = get().elements[id];
      if (!element) {
        console.warn('🔧 [ELEMENTS STORE] Element not found for optimization:', id);
        return;
      }

      console.log('🔧 [ELEMENTS STORE] Optimizing element:', id);
      
      let optimized = false;
      
      set((state: Draft<CanvasElementsState>) => {
        const stateElement = state.elements[id];
        if (!stateElement) return;
        
        // Example optimizations
        if (stateElement.width && stateElement.width < 1) {
          stateElement.width = 1;
          optimized = true;
        }
        if (stateElement.height && stateElement.height < 1) {
          stateElement.height = 1;
          optimized = true;
        }
      });
      
      if (optimized) {
        console.log('✅ [ELEMENTS STORE] Element optimized:', id);
      }
      
      PerformanceMonitor.recordMetric('elementOptimized', 1, 'canvas', { 
        elementType: element.type,
        hadChanges: optimized
      });
    } finally {
      endTiming();
    }
  }
});
