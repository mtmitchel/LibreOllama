// src/stores/canvasStore.enhanced.ts
/**
 * Enhanced Canvas Store - Handles cross-slice operations
 * Resolves circular dependencies by implementing cross-slice logic at the combined store level
 * 
 * ARCHITECTURAL DECISION: Using namespace imports for all store slices
 * This ensures consistent module resolution across test and production environments
 * and provides explicit namespacing for better code clarity.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { Draft } from 'immer';
import { CoordinateService } from '../utils/coordinateService';
// TODO: Integrate performance utilities after core functionality is stable
// import { queueCanvasOperation } from '../utils/performance/operationQueue';
// import { CanvasErrorHandler } from '../utils/performance/canvasErrorHandler';

enableMapSet();

// Import store slices with namespace imports for consistency across environments
import * as CanvasElementsStore from '@/features/canvas/stores/slices/canvasElementsStore';
import * as SectionStore from '@/features/canvas/stores/slices/sectionStore';
import * as TextEditingStore from '@/features/canvas/stores/slices/textEditingStore';
import * as ViewportStore from '@/features/canvas/stores/slices/viewportStore';
import * as CanvasHistoryStore from '@/features/canvas/stores/slices/canvasHistoryStore';
import * as SelectionStore from '@/features/canvas/stores/slices/selectionStore';
import * as CanvasUIStore from '@/features/canvas/stores/slices/canvasUIStore';

import { ElementId, SectionId } from '../types/enhanced.types';
// import { safeMapGet, toElementId, toSectionId } from '../types/compatibility';

// Combined store state
export interface CanvasStoreState extends 
  Omit<CanvasElementsStore.CanvasElementsState, 'handleElementDrop'>,
  TextEditingStore.TextEditingState,
  SelectionStore.SelectionState,
  ViewportStore.ViewportState,
  CanvasUIStore.CanvasUIState,
  CanvasHistoryStore.CanvasHistoryState,
  SectionStore.SectionState {
  // Enhanced methods for cross-slice operations
  findSectionAtPoint: (point: { x: number; y: number }) => SectionId | null;
  handleElementDrop: (elementId: ElementId | SectionId, position: { x: number; y: number }) => void;
  captureElementsAfterSectionCreation: (sectionId: SectionId) => void;
  updateElementCoordinatesOnSectionMove: (sectionId: SectionId, deltaX: number, deltaY: number) => void;
  convertElementToAbsoluteCoordinates: (elementId: ElementId) => void;
  convertElementToRelativeCoordinates: (elementId: ElementId, sectionId: SectionId) => void;
}

// Store factory function for lazy initialization
const createEnhancedCanvasStore = () => {
  return create<CanvasStoreState>()(
    subscribeWithSelector(
      immer(
        (set, get, api) => {
          // Create each slice
          const elementsSlice = CanvasElementsStore.createCanvasElementsStore(set as any, get as any, api as any);
        const sectionSlice = SectionStore.createSectionStore(set as any, get as any, api as any);
        const textEditingSlice = TextEditingStore.createTextEditingStore(set as any, get as any, api as any);
        const selectionSlice = SelectionStore.createSelectionStore(set as any, get as any, api as any);
        const viewportSlice = ViewportStore.createViewportStore(set as any, get as any, api as any);
        const uiSlice = CanvasUIStore.createCanvasUIStore(set as any, get as any, api as any);
        const historySlice = CanvasHistoryStore.createCanvasHistoryStore(set as any, get as any, api as any);

        // Return combined store with enhanced methods
        return {
          ...elementsSlice,
          ...textEditingSlice,
          ...selectionSlice,
          ...viewportSlice,
          ...uiSlice,
          ...historySlice,
          ...sectionSlice,
          
          // Enhanced cross-slice methods
          findSectionAtPoint: (point: { x: number; y: number }): SectionId | null => {
            const sections = get().sections;
            for (const section of sections.values()) {
              if (point.x >= section.x && 
                  point.x <= section.x + section.width &&
                  point.y >= section.y && 
                  point.y <= section.y + section.height) {
                return SectionId(section.id);
              }
            }
            return null;
          },

          handleElementDrop: (elementId: ElementId | SectionId, position: { x: number; y: number }) => {
            const currentState = get();
            const element = currentState.elements.get(elementId);
            
            if (!element) {
              console.warn('❌ [CANVAS STORE] Element not found for drop:', elementId);
              return;
            }

            if (!CoordinateService.validateCoordinates(position)) {
              console.error('❌ [CANVAS STORE] Invalid coordinates provided for drop:', position);
              return;
            }
            
            try {
              // Convert Map to Record for coordinate service (as per coordinate system guidelines)
              const sectionsRecord = Object.fromEntries(currentState.sections);
              
              const conversionResult = CoordinateService.convertDragCoordinates(
                position,
                element,
                sectionsRecord
              );

              if (!conversionResult.needsUpdate) {
                return;
              }

              // Single atomic update to prevent race conditions (as per performance guidelines)
              set((state: Draft<CanvasStoreState>) => {
                const stateElement = state.elements.get(elementId);
                if (!stateElement) {
                  console.warn('❌ [CANVAS STORE] Element not found in draft state for drop:', elementId);
                  return;
                }

                // Update element coordinates
                stateElement.x = conversionResult.coordinates.x;
                stateElement.y = conversionResult.coordinates.y;
                stateElement.sectionId = conversionResult.sectionId ? SectionId(conversionResult.sectionId) : null;
                stateElement.updatedAt = Date.now();

                console.log('✅ [CANVAS STORE] Element dropped successfully:', {
                  elementId,
                  newPosition: conversionResult.coordinates,
                  sectionId: conversionResult.sectionId
                });
              });
            } catch (error) {
              console.error('❌ [CANVAS STORE] Error during element drop:', error);
              // TODO: Integrate with CanvasErrorHandler for production error recovery
            }
          },

          captureElementsAfterSectionCreation: (_sectionId: SectionId) => {
            console.log('🔧 [ENHANCED STORE] captureElementsAfterSectionCreation temporarily disabled for type safety');
            // TODO: Re-implement after section store is fully updated to enhanced types
          },

          updateElementCoordinatesOnSectionMove: (sectionId: SectionId, _deltaX: number, _deltaY: number) => {
            // This logic is simplified. Child elements have relative positions,
            // so their coordinates don't need to change when the parent section moves.
            // The rendering engine handles the group transform.
            // We just need to ensure the section's own coordinates are updated, which is done in its own slice.
            console.log('✅ [ENHANCED STORE] Section moved. Child positions are relative.', { sectionId });
          },

          convertElementToAbsoluteCoordinates: (_elementId: ElementId) => {
            console.log('🔧 [ENHANCED STORE] convertElementToAbsoluteCoordinates temporarily disabled for type safety');
            // TODO: Re-implement after section store is fully updated to enhanced types
          },

          convertElementToRelativeCoordinates: (_elementId: ElementId, _sectionId: SectionId) => {
            console.log('🔧 [ENHANCED STORE] convertElementToRelativeCoordinates temporarily disabled for type safety');
            // TODO: Re-implement after section store is fully updated to enhanced types
          },

          // FIXED: Enhanced clearCanvas function that clears both elements AND sections
          clearCanvas: () => {
            console.log('🧹 [CANVAS STORE] Clearing entire canvas including sections');
            
            set((state: Draft<CanvasStoreState>) => {
              state.elements.clear();
              state.sections.clear();
              state.selectedElementIds.clear();
              
              // Reset drawing state
              state.isDrawing = false;
              state.currentPath = [];
              state.selectedTool = 'select';
              
              // Clear text editing state
              state.editingTextId = null;
              
              console.log('✅ [CANVAS STORE] Canvas fully cleared including sections');
            });
          },
        };
        }
      )
    )
  );
};

// Lazy initialization to avoid module loading issues
let _canvasStore: ReturnType<typeof createEnhancedCanvasStore> | null = null;

const getCanvasStore = () => {
  if (!_canvasStore) {
    _canvasStore = createEnhancedCanvasStore();
  }
  return _canvasStore;
};

// Export the vanilla store for direct access in tests
export const canvasStore = getCanvasStore();

// Main store hook
export const useCanvasStore = <T>(selector: (state: CanvasStoreState) => T) => {
  return getCanvasStore()(selector);
};

// Export granular, memoized selectors for performance (as per [LO-Refactor] guidelines)
export const useCanvasElements = () => useCanvasStore(state => ({
  elements: state.elements,
  addElement: state.addElement,
  updateElement: state.updateElement,
  deleteElement: state.deleteElement,
  duplicateElement: state.duplicateElement
}));

export const useSelection = () => useCanvasStore(state => ({
  selectedElementIds: state.selectedElementIds,
  selectElement: state.selectElement,
  selectMultipleElements: state.selectMultipleElements,
  clearSelection: state.clearSelection
}));

// Granular element access selector for O(1) lookups
export const useElement = (elementId: ElementId) => useCanvasStore(
  state => state.elements.get(elementId)
);

// Granular selection check for O(1) performance
export const useIsElementSelected = (elementId: ElementId) => useCanvasStore(
  state => state.selectedElementIds.has(elementId)
);

// Performance-optimized viewport elements selector
export const useViewportElements = () => useCanvasStore(
  state => {
    // Only return elements visible in viewport for rendering optimization
    const viewport = state.viewportBounds;
    if (!viewport) return Array.from(state.elements.values());
    
    return Array.from(state.elements.values()).filter(element => {
      // Use type-safe property access for dimensions
      const elementWidth = 'width' in element ? element.width : 100;
      const elementHeight = 'height' in element ? element.height : 100;
      
      // Simple viewport culling - can be enhanced with more sophisticated bounds checking
      return element.x < viewport.right && 
             element.x + elementWidth > viewport.left &&
             element.y < viewport.bottom && 
             element.y + elementHeight > viewport.top;
    });
  }
);

export const useTextEditing = () => useCanvasStore(state => ({
  editingTextId: state.editingTextId
}));

export const useCanvasUI = () => useCanvasStore(state => ({
  selectedTool: state.selectedTool,
  setSelectedTool: state.setSelectedTool
}));

export const useViewport = () => useCanvasStore(state => ({
  viewportBounds: state.viewportBounds
}));

export const useCanvasHistory = () => useCanvasStore(state => ({
  undo: state.undo,
  redo: state.redo,
  canUndo: state.canUndo,
  canRedo: state.canRedo
}));

export const useSections = () => useCanvasStore(state => ({
  sections: state.sections,
  createSection: state.createSection,
  updateSection: state.updateSection,
  deleteSection: state.deleteSection
}));

export const useDrawing = () => useCanvasStore(state => ({
  isDrawing: state.isDrawing,
  currentPath: state.currentPath
}));

// Setup text debugging monitoring
if (process.env.NODE_ENV === 'development') {
  
}

// Development debugging: expose store globally
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useCanvasStore = useCanvasStore;
  console.log('🔧 Canvas store exposed globally as window.useCanvasStore for debugging');
}

export default useCanvasStore;