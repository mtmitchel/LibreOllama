import { nanoid } from 'nanoid';
import { produce } from 'immer';
import { 
  CanvasElement, 
  ElementId, 
  ElementOrSectionId,
  isTableElement,
  TableCell 
} from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Element module state
 */
export interface ElementState {
  elements: Map<string, CanvasElement>;
  elementOrder: string[];
}

/**
 * Element module actions
 */
export interface ElementActions {
  // Core CRUD operations
  getElementById: (id: ElementOrSectionId) => CanvasElement | undefined;
  addElement: (element: CanvasElement) => void;
  createElement: (type: string, position: { x: number; y: number }) => void;
  updateElement: (id: ElementOrSectionId, updates: Partial<CanvasElement>) => void;
  updateMultipleElements: (updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => void;
  deleteElement: (id: ElementOrSectionId) => void;
  deleteSelectedElements: () => void;
  
  // High-performance operations
  addElementFast: (element: CanvasElement) => void;
  patchElement: (id: string, updates: Partial<CanvasElement>) => void;
  patchElementFast: (id: string, updates: Partial<CanvasElement>) => void;
  batchUpdateElements: (updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => void;
  updateStrokeFast: (id: string, points: number[], bounds?: { x: number; y: number; width: number; height: number }) => void;
  
  
  // Utility operations
  clearAllElements: () => void;
  
  // Import/Export operations
  exportElements: () => void;
  importElements: (elements: CanvasElement[]) => void;
}

/**
 * Creates the element module
 */
export const createElementModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<ElementState, ElementActions> => {
  const getElementCenter = (element: CanvasElement): { x: number; y: number } => {
    const width = element.width ?? 0;
    const height = element.height ?? 0;
    return {
      x: element.x + width / 2,
      y: element.y + height / 2,
    };
  };

  return {
    state: {
      elements: new Map(),
      elementOrder: [],
    },
    
    actions: {
      getElementById: (id) => get().elements.get(id),
      
      addElement: (element) => {
        set(state => {
          // Create a new Map to ensure proper change detection
          const newElements = new Map(state.elements);
          newElements.set(element.id, element);
          state.elements = newElements;
          state.elementOrder.push(element.id);
        });
        get().addToHistory('addElement');
      },

      addElementFast: (element) => {
        set(state => {
          // Direct map insertion without creating new Map reference for performance
          state.elements.set(element.id, element);
          state.elementOrder.push(element.id);
        });
        // Skip history and expensive operations for performance
      },

      createElement: (type, position) => {
        const newElement = { id: nanoid(), type, ...position } as CanvasElement;
        get().addElement(newElement);
      },

      updateElement: (id, updates) => {
        console.log('🔄 [Store] updateElement called:', { id, updates });
        set(state => {
          const element = state.elements.get(id);
          console.log('🔄 [Store] Current element:', element);
          if (element) {
            const oldX = element.x;
            const oldY = element.y;

            // Create a new element object to ensure proper change detection
            const updatedElement = { ...element, ...updates };
            console.log('🔄 [Store] Updated element:', updatedElement);

            // If element is in a section, constrain its position
            if (updatedElement.sectionId) {
              const section = state.sections?.get(updatedElement.sectionId);
              if (section) {
                updatedElement.x = Math.max(section.x, Math.min(updatedElement.x, section.x + section.width - (updatedElement.width ?? 0)));
                updatedElement.y = Math.max(section.y, Math.min(updatedElement.y, section.y + section.height - (updatedElement.height ?? 0)));
              }
            }

            // Update the Map to trigger re-renders
            state.elements.set(id, updatedElement);
            console.log('🔄 [Store] Element updated in map');

            // If it's a section, update its children
            if (updatedElement.type === 'section') {
              const oldSectionId = updatedElement.sectionId;
              const hasPositionChanged = updates.x !== undefined || updates.y !== undefined;
      
              if (hasPositionChanged) {
                const newCenter = getElementCenter(updatedElement);
                const newSectionId = get().findSectionAtPoint?.(newCenter);
      
                if (oldSectionId && oldSectionId !== newSectionId) {
                  // Remove from old section
                  const oldSection = state.sections?.get(oldSectionId);
                  if (oldSection) {
                    oldSection.childElementIds = oldSection.childElementIds.filter(childId => childId !== id);
                  }
                }
      
                if (newSectionId && oldSectionId !== newSectionId) {
                  // Add to new section
                  const newSection = state.sections?.get(newSectionId);
                  if (newSection) {
                    newSection.childElementIds.push(id);
                  }
                }
                
                updatedElement.sectionId = newSectionId || undefined;
                // Update the element again with the new sectionId
                state.elements.set(id, updatedElement);
              }
            }

            // If sticky note moved, move its children by same delta
            if (updatedElement.type === 'sticky-note' && updatedElement.childElementIds && (updates.x !== undefined || updates.y !== undefined)) {
              const deltaX = (updates.x ?? element.x) - oldX;
              const deltaY = (updates.y ?? element.y) - oldY;
              console.log('🗒️ [Store] Moving sticky note children:', {
                stickyNoteId: updatedElement.id,
                deltaX,
                deltaY,
                childCount: updatedElement.childElementIds.length
              });
              if (deltaX !== 0 || deltaY !== 0) {
                updatedElement.childElementIds.forEach(childId => {
                  const child = state.elements.get(childId);
                  if (child) {
                    console.log('🗒️ [Store] Moving child element:', {
                      childId,
                      childType: child.type,
                      oldPosition: { x: child.x, y: child.y },
                      newPosition: { x: child.x + deltaX, y: child.y + deltaY }
                    });
                    
                    let movedChild = { ...child, x: child.x + deltaX, y: child.y + deltaY };
                    
                    // For stroke elements (pen, marker, highlighter), also update the points array
                    if (child.type === 'pen' || child.type === 'marker' || child.type === 'highlighter') {
                      const strokeChild = child as any; // Cast to access points
                      if (strokeChild.points && Array.isArray(strokeChild.points)) {
                        console.log('🗒️ [Store] Updating stroke points for child:', childId);
                        const updatedPoints = strokeChild.points.map((point: number, index: number) => {
                          return index % 2 === 0 ? point + deltaX : point + deltaY;
                        });
                        movedChild = { ...movedChild, points: updatedPoints };
                      }
                    }
                    
                    state.elements.set(childId, movedChild);
                  }
                });
              }
            }
          }
        });
        get().addToHistory('updateElement');
      },

      updateMultipleElements: (updates) => {
        set(state => {
          updates.forEach(({ id, updates: elementUpdates }) => {
            const element = state.elements.get(id);
            if (element) {
              Object.assign(element, elementUpdates);
            }
          });
        });
        get().addToHistory('updateMultipleElements');
      },

      deleteElement: (id) => {
        set(state => {
          if (!state.elements.has(id)) return;
      
          const elementToDelete = state.elements.get(id);
          if (elementToDelete?.sectionId) {
            const section = state.sections?.get(elementToDelete.sectionId);
            if (section) {
              section.childElementIds = section.childElementIds.filter(childId => childId !== id);
            }
          }
      
          state.elements.delete(id);
          state.elementOrder = state.elementOrder.filter(elementId => elementId !== id);
          state.selectedElementIds?.delete(id as ElementId);
        });
        get().addToHistory('deleteElement');
      },

      deleteSelectedElements: () => {
        const { selectedElementIds } = get();
        set(state => {
          for (const id of selectedElementIds) {
            if (!state.elements.has(id)) continue;
            const elementToDelete = state.elements.get(id);
            if (elementToDelete?.sectionId) {
              const section = state.sections?.get(elementToDelete.sectionId);
              if (section) {
                section.childElementIds = section.childElementIds.filter(childId => childId !== id);
              }
            }
            state.elements.delete(id);
            state.elementOrder = state.elementOrder.filter(elementId => elementId !== id);
          }
          state.selectedElementIds.clear();
        });
        get().addToHistory('deleteSelectedElements');
      },

      // Fast element patch without history snapshot (used by stroke tools)
      patchElement: (id: string, updates: Partial<CanvasElement>) => {
        set(state => {
          const element = state.elements.get(id);
          if (!element) return;
          const updated = { ...element, ...updates } as CanvasElement;
          state.elements.set(id, updated);
          // Ensure change detection
          state.elements = new Map(state.elements);
        });
      },

      // Ultra-fast patch for stroke processing (no validation, minimal overhead)
      patchElementFast: (id: string, updates: Partial<CanvasElement>) => {
        set(state => {
          const element = state.elements.get(id);
          if (element) {
            // Direct mutation for performance (Immer will handle immutability)
            Object.assign(element, updates);
          }
        });
        // Skip history and validation for performance
      },

      // Batch update method for multiple stroke updates
      batchUpdateElements: (updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => {
        set(state => {
          updates.forEach(({ id, changes }) => {
            const element = state.elements.get(id);
            if (element) {
              Object.assign(element, changes);
            }
          });
        });
        get().addToHistory('batchUpdateElements');
      },

      // Dedicated stroke update method that skips validation
      updateStrokeFast: (id: string, points: number[], bounds?: { x: number; y: number; width: number; height: number }) => {
        set(state => {
          const element = state.elements.get(id);
          if (element) {
            // Direct mutation for performance (Immer will handle immutability)
            Object.assign(element, { points });
          }
        });
        // Skip history and validation for performance
      },


      clearAllElements: () => {
        set(state => {
          state.elements = new Map();
          state.elementOrder = [];
          state.selectedElementIds = new Set();
          state.lastSelectedElementId = null;
          state.sections = new Map();
          state.sectionElementMap = new Map();
        });
        get().addToHistory('clearAllElements');
      },

      exportElements: () => {
        const { elements } = get();
        const elementsArray = Array.from(elements.values());
        const dataStr = JSON.stringify(elementsArray, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'canvas-elements.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      },

      importElements: (elements: CanvasElement[]) => {
        set(state => {
          // Clear existing elements
          state.elements.clear();
          state.elementOrder = [];
          state.selectedElementIds.clear();
          state.lastSelectedElementId = null;
          
          // Add imported elements
          elements.forEach(element => {
            state.elements.set(element.id, element);
            state.elementOrder.push(element.id);
          });
        });
        get().addToHistory('importElements');
      },
    },
  };
};