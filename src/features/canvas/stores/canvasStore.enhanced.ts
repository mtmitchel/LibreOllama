// src/stores/canvasStore.enhanced.ts
/**
 * Enhanced Canvas Store - Handles cross-slice operations
 * Resolves circular dependencies by implementing cross-slice logic at the combined store level
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft } from 'immer';


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
            
            // Simplified section detection: use the original simple point-based approach
            // The complex bounds checking was causing issues
            const targetSectionId = currentState.findSectionAtPoint(position);
            const oldSectionId = element.sectionId;
            
            console.log('🔍 [CANVAS STORE] Element drop analysis:', {
              elementId,
              elementType: element.type,
              oldSectionId,
              targetSectionId,
              position
            });

            // Atomic state update - all changes in one set() call
            set((state: Draft<CanvasStoreState>) => {
              const stateElement = state.elements[elementId];
              if (!stateElement) {
                console.warn('❌ [CANVAS STORE] Element not found in draft state:', elementId);
                return;
              }

              // Case 1: Element moved within the same section
              if (oldSectionId === targetSectionId && targetSectionId) {
                const section = state.sections[targetSectionId];
                if (section) {
                  // Convert absolute position to relative coordinates within the section
                  stateElement.x = position.x - section.x;
                  stateElement.y = position.y - section.y;
                  console.log('🔄 [CANVAS STORE] Element moved within same section:', {
                    section: { x: section.x, y: section.y },
                    newRelativeCoords: { x: stateElement.x, y: stateElement.y }
                  });
                }
                return; // No containment changes needed
              }

              // Case 2: Element moved on canvas (no section)
              if (oldSectionId === targetSectionId && !targetSectionId) {
                stateElement.x = position.x;
                stateElement.y = position.y;
                console.log('🔄 [CANVAS STORE] Element moved on canvas:', {
                  newCoords: { x: stateElement.x, y: stateElement.y }
                });
                return; // No containment changes needed
              }

              // Case 3: Element moved between sections or from/to canvas
              // Set new coordinates and section assignment
              if (targetSectionId) {
                const targetSection = state.sections[targetSectionId];
                if (targetSection) {
                  // Convert absolute position to relative coordinates
                  stateElement.x = position.x - targetSection.x;
                  stateElement.y = position.y - targetSection.y;
                  stateElement.sectionId = targetSectionId;
                  console.log('📐 [CANVAS STORE] Converted to relative coords in new section:', {
                    targetSection: { x: targetSection.x, y: targetSection.y },
                    relativeCoords: { x: stateElement.x, y: stateElement.y }
                  });
                }
              } else {
                // Element dropped on canvas
                console.log('🔍 [CANVAS STORE] Before setting absolute coords:', {
                  elementId: elementId,
                  elementType: stateElement.type,
                  oldText: stateElement.text,
                  position: position
                });
                
                stateElement.x = position.x;
                stateElement.y = position.y;
                stateElement.sectionId = null;
                
                // Ensure text elements maintain valid text during coordinate updates
                if (stateElement.type === 'text' && (!stateElement.text || stateElement.text.trim().length === 0)) {
                  stateElement.text = 'Text';
                  console.warn('🛡️ [CANVAS STORE] Fixed text element during coordinate update');
                }
                
                console.log('📐 [CANVAS STORE] Set absolute coords on canvas:', {
                  coords: { x: stateElement.x, y: stateElement.y },
                  newText: stateElement.text,
                  textCharCodes: stateElement.text ? [...stateElement.text].map(c => c.charCodeAt(0)) : []
                });
              }

              console.log('🔍 [CANVAS STORE] Element after position update:', {
                elementId: elementId,
                type: stateElement.type,
                text: stateElement.text,
                textLength: stateElement.text?.length,
                textCharCodes: stateElement.text ? [...stateElement.text].map(c => c.charCodeAt(0)) : []
              });

              // Update section containment atomically
              if (oldSectionId && oldSectionId !== targetSectionId) {
                const oldSection = state.sections[oldSectionId];
                if (oldSection) {
                  const index = oldSection.containedElementIds.indexOf(elementId);
                  if (index > -1) {
                    oldSection.containedElementIds.splice(index, 1);
                    console.log('✅ [CANVAS STORE] Removed element from old section:', { elementId, oldSectionId });
                  }
                }
              }

              if (targetSectionId && oldSectionId !== targetSectionId) {
                const targetSection = state.sections[targetSectionId];
                if (targetSection && !targetSection.containedElementIds.includes(elementId)) {
                  targetSection.containedElementIds.push(elementId);
                  console.log('✅ [CANVAS STORE] Added element to new section:', { elementId, targetSectionId });
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
              
              element.x -= section.x;
              element.y -= section.y;
              element.sectionId = sectionId;
              console.log('✅ [CANVAS STORE] Converted element to relative coordinates:', elementId);
            });
          },
        };
      }
    )
  )
);

// Export the same selectors as before
export { useCanvasElements, useDrawing, useTextEditing, useSelection, useViewport, useCanvasUI, useCanvasHistory, useSections } from './canvasStore';

// Setup text debugging monitoring
if (process.env.NODE_ENV === 'development') {
  
}

// Development debugging: expose store globally
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useCanvasStore = useCanvasStore;
  console.log('🔧 Canvas store exposed globally as window.useCanvasStore for debugging');
}

export default useCanvasStore;