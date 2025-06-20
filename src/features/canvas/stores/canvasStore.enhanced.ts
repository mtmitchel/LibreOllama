// src/stores/canvasStore.enhanced.ts
/**
 * Enhanced Canvas Store - Handles cross-slice operations
 * Resolves circular dependencies by implementing cross-slice logic at the combined store level
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft } from 'immer';
import { CoordinateService } from '../utils/coordinateService';


// Import the fixed store slices
import { createCanvasElementsStore, type CanvasElementsState } from './slices/canvasElementsStore.fixed';
import { createSectionStore, type SectionState } from './slices/sectionStore.fixed';
// Import other slices as before
import { createTextEditingStore, type TextEditingState } from './slices/textEditingStore';
import { createSelectionStore, type SelectionState } from './slices/selectionStore';
import { createViewportStore, type ViewportState } from './slices/viewportStore';
import { createCanvasUIStore, type CanvasUIState } from './slices/canvasUIStore';
import { createCanvasHistoryStore, type CanvasHistoryState } from './slices/canvasHistoryStore';

// Combined store state
export interface CanvasStoreState extends 
  CanvasElementsState,
  TextEditingState,
  SelectionState,
  ViewportState,
  CanvasUIState,
  CanvasHistoryState,
  SectionState {
  // Enhanced methods for cross-slice operations
  findSectionAtPoint: (point: { x: number; y: number }) => string | null;
  handleElementDrop: (elementId: string, position: { x: number; y: number }) => void;
  captureElementsAfterSectionCreation: (sectionId: string) => void;
  updateElementCoordinatesOnSectionMove: (sectionId: string, deltaX: number, deltaY: number) => void;
  convertElementToAbsoluteCoordinates: (elementId: string) => void;
  convertElementToRelativeCoordinates: (elementId: string, sectionId: string) => void;
}

// Create the enhanced store with cross-slice operations
export const useCanvasStore = create<CanvasStoreState>()(
  subscribeWithSelector(
    immer(
      (set, get, api) => {
        // Create each slice
        const elementsSlice = createCanvasElementsStore(set as any, get as any, api as any);
        const sectionSlice = createSectionStore(set as any, get as any, api as any);
        const textEditingSlice = createTextEditingStore(set as any, get as any, api as any);
        const selectionSlice = createSelectionStore(set as any, get as any, api as any);
        const viewportSlice = createViewportStore(set as any, get as any, api as any);
        const uiSlice = createCanvasUIStore(set as any, get as any, api as any);
        const historySlice = createCanvasHistoryStore(set as any, get as any, api as any);

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
          findSectionAtPoint: (point: { x: number; y: number }) => {
            console.log('🔍 [ENHANCED STORE] findSectionAtPoint called with point:', point);
            const sectionsRecord = get().sections;
            const sectionsArray = Object.values(sectionsRecord);
            console.log('🔍 [ENHANCED STORE] Available sections:', sectionsArray.length);
            
            // Simple geometric check - the point parameter should already be in the correct coordinate space
            for (const section of sectionsArray) {
              console.log(`🔍 [ENHANCED STORE] Checking section ${section.id}:`, {
                bounds: { x: section.x, y: section.y, width: section.width, height: section.height },
                point: point
              });
              
              if (point.x >= section.x && 
                  point.x <= section.x + section.width &&
                  point.y >= section.y && 
                  point.y <= section.y + section.height) {
                console.log(`✅ [ENHANCED STORE] Point is inside section ${section.id}`);
                return section.id;
              }
            }
            
            console.log('❌ [ENHANCED STORE] Point not inside any section');
            return null;
          },

          handleElementDrop: (elementId: string, position: { x: number; y: number }) => {
            console.log('🎯 [CANVAS STORE] handleElementDrop called:', { elementId, position });
            
            // Get current state outside of set() to avoid stale reads
            const currentState = get();
            const element = currentState.elements[elementId];
            
            if (!element) {
              console.warn('❌ [CANVAS STORE] Element not found:', elementId);
              console.log('🔍 [CANVAS STORE] Available elements:', Object.keys(currentState.elements));
              return;
            }

            // Validate input coordinates
            if (!CoordinateService.validateCoordinates(position)) {
              console.error('❌ [CANVAS STORE] Invalid coordinates provided:', position);
              return;
            }

            // Use the enhanced coordinate conversion
            const conversionResult = CoordinateService.convertDragCoordinates(
              position,
              element,
              currentState.sections
            );

              // Only update if coordinates actually changed
              if (!conversionResult.needsUpdate) {
                console.log('⏭️ [CANVAS STORE] No coordinate update needed for element:', elementId);
                return;
              }

              console.log('� [CANVAS STORE] Element drop analysis:', {
                elementId,
                elementType: element.type,
                oldSectionId: element.sectionId,
                newSectionId: conversionResult.sectionId,
                finalCoordinates: conversionResult.coordinates,
                needsUpdate: conversionResult.needsUpdate
              });

              // Atomic state update - all changes in one set() call
              set((state: Draft<CanvasStoreState>) => {
                const stateElement = state.elements[elementId];
                if (!stateElement) {
                  console.warn('❌ [CANVAS STORE] Element not found in draft state:', elementId);
                  return;
                }

                const oldSectionId = stateElement.sectionId;
                const newSectionId = conversionResult.sectionId;

                // Update element coordinates and section assignment atomically
                stateElement.x = conversionResult.coordinates.x;
                stateElement.y = conversionResult.coordinates.y;
                stateElement.sectionId = newSectionId;

                // Ensure text elements maintain valid text during coordinate updates
                if (stateElement.type === 'text' && (!stateElement.text || stateElement.text.trim().length === 0)) {
                  stateElement.text = 'Text';
                  console.warn('🛡️ [CANVAS STORE] Fixed text element during coordinate update');
                }

                console.log('📐 [CANVAS STORE] Updated element coordinates:', {
                  elementId,
                  coordinates: conversionResult.coordinates,
                  sectionId: newSectionId,
                  type: stateElement.type
                });

                // Update section containment atomically
                if (oldSectionId && oldSectionId !== newSectionId) {
                  const oldSection = state.sections[oldSectionId];
                  if (oldSection) {
                    const index = oldSection.containedElementIds.indexOf(elementId);
                    if (index > -1) {
                      oldSection.containedElementIds.splice(index, 1);
                      console.log('✅ [CANVAS STORE] Removed element from old section:', { elementId, oldSectionId });
                    }
                  }
                }

                if (newSectionId && oldSectionId !== newSectionId) {
                  const newSection = state.sections[newSectionId];
                  if (newSection && !newSection.containedElementIds.includes(elementId)) {
                    newSection.containedElementIds.push(elementId);
                    console.log('✅ [CANVAS STORE] Added element to new section:', { elementId, newSectionId });
                  }
                }
              });
          },

          captureElementsAfterSectionCreation: (sectionId: string) => {
            const section = get().getSectionById(sectionId);
            if (!section) return;
            
            const elements = get().elements;
            const capturedElementIds: string[] = [];
            
            Object.entries(elements).forEach(([elementId, element]) => {
              // Skip if element is already in a section
              if (element.sectionId) return;
              
              // Check if element is within section bounds
              const elementBounds = {
                left: element.x,
                top: element.y,
                right: element.x + (element.width || 100),
                bottom: element.y + (element.height || 100)
              };
              
              const sectionBounds = {
                left: section.x,
                top: section.y,
                right: section.x + section.width,
                bottom: section.y + section.height
              };
              
              // Check for overlap
              const isOverlapping = 
                elementBounds.left < sectionBounds.right && 
                elementBounds.right > sectionBounds.left && 
                elementBounds.top < sectionBounds.bottom && 
                elementBounds.bottom > sectionBounds.top;
              
              if (isOverlapping) {
                capturedElementIds.push(elementId);
              }
            });
            
            // Update elements to be relative to section
            if (capturedElementIds.length > 0) {
              set((state: Draft<CanvasStoreState>) => {
                capturedElementIds.forEach(elementId => {
                  const element = state.elements[elementId];
                  if (element) {
                    // Convert to section-relative coordinates
                    element.x -= section.x;
                    element.y -= section.y;
                    element.sectionId = sectionId;
                  }
                });
              });
              
              // Update section's contained elements list
              get().captureElementsInSection(sectionId, capturedElementIds);
              
              console.log('✅ [CANVAS STORE] Captured', capturedElementIds.length, 'elements in new section:', sectionId);
            }
          },

          updateElementCoordinatesOnSectionMove: (sectionId: string, deltaX: number, deltaY: number) => {
            const containedElementIds = get().getElementsInSection(sectionId);
            
            // Elements with sectionId use relative coordinates, so no update needed
            // The Konva Group transform handles the visual positioning automatically
            console.log('✅ [CANVAS STORE] Section moved. Contained elements use relative coords, no update needed:', {
              sectionId,
              delta: { x: deltaX, y: deltaY },
              elementCount: containedElementIds.length
            });
          },

          convertElementToAbsoluteCoordinates: (elementId: string) => {
            set((state: Draft<CanvasStoreState>) => {
              const element = state.elements[elementId];
              if (!element || !element.sectionId) return;
              
              const section = state.sections[element.sectionId];
              if (section) {
                element.x += section.x;
                element.y += section.y;
                element.sectionId = null;
                console.log('✅ [CANVAS STORE] Converted element to absolute coordinates:', elementId);
              }
            });
          },

          convertElementToRelativeCoordinates: (elementId: string, sectionId: string) => {
            set((state: Draft<CanvasStoreState>) => {
              const element = state.elements[elementId];
              const section = state.sections[sectionId];
              
              if (!element || !section) return;
              
              // Calculate relative coordinates
              const relativeX = element.x - section.x;
              const relativeY = element.y - section.y;
              
              // Ensure element is positioned within section bounds with reasonable defaults
              const elementWidth = element.width || 100;
              const elementHeight = element.height || 50;
              const padding = 20;
              const titleBarHeight = section.titleBarHeight || 32;
              
              // Apply bounds checking to prevent negative coordinates or overflow
              const constrainedX = Math.max(
                padding,
                Math.min(relativeX, (section.width || 300) - elementWidth - padding)
              );
              
              const constrainedY = Math.max(
                titleBarHeight + padding,
                Math.min(relativeY, (section.height || 200) - elementHeight - padding)
              );
              
              element.x = constrainedX;
              element.y = constrainedY;
              element.sectionId = sectionId;
              
              console.log(`✅ [CANVAS STORE] Converted element to relative coordinates: ${elementId} from (${relativeX}, ${relativeY}) to constrained (${constrainedX}, ${constrainedY})`);
            });
          },

          // FIXED: Enhanced clearCanvas function that clears both elements AND sections
          clearCanvas: () => {
            console.log('🧹 [CANVAS STORE] Clearing entire canvas including sections');
            
            set((state: Draft<CanvasStoreState>) => {
              // Clear all elements
              state.elements = {};
              state.elementOrder = [];
              
              // Clear all sections
              state.sections = {};
              state.sectionOrder = [];
              
              // Reset drawing state
              state.isDrawing = false;
              state.currentPath = [];
              state.drawingTool = null;
              
              // Clear text editing state
              state.editingTextId = null;
              state.isEditingText = null;
              
              console.log('✅ [CANVAS STORE] Canvas fully cleared including sections');
            });
          },
        };
      }
    )
  )
);

// Export individual selectors for convenience
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