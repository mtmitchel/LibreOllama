// src/stores/canvasStore.enhanced.ts
/**
 * Enhanced Canvas Store - Handles cross-slice operations
 * Resolves circular dependencies by implementing cross-slice logic at the combined store level
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft } from 'immer';
import { CoordinateService } from '../utils/coordinateService.fixed';
import type { CanvasElement } from '../../../types';

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
            const sections = get().getAllSections();
            const stage = get().stage;
            return CoordinateService.findSectionAtPoint(point, sections, stage);
          },

          handleElementDrop: (elementId: string, position: { x: number; y: number }) => {
            console.log('🎯 [CANVAS STORE] handleElementDrop called:', { elementId, position });
            
            const targetSectionId = get().findSectionAtPoint(position);
            
            set((state: Draft<CanvasStoreState>) => {
              const element = state.elements[elementId];
              if (!element) {
                console.warn('❌ [CANVAS STORE] Element not found:', elementId);
                return;
              }

              const oldSectionId = element.sectionId;
              console.log('🔍 [CANVAS STORE] Element drop:', {
                elementId,
                oldSectionId,
                targetSectionId,
                position
              });

              if (oldSectionId === targetSectionId) {
                console.log('ℹ️ [CANVAS STORE] Element staying in same section/canvas');
                return;
              }

              // Convert to absolute coordinates from old parent
              if (oldSectionId) {
                const oldSection = state.sections[oldSectionId];
                if (oldSection) {
                  element.x += oldSection.x;
                  element.y += oldSection.y;
                  console.log('📐 [CANVAS STORE] Converted to absolute coords from section:', {
                    oldSection: { x: oldSection.x, y: oldSection.y },
                    newCoords: { x: element.x, y: element.y }
                  });
                }
              }

              if (targetSectionId) {
                // Add to new section and convert to relative coordinates
                const targetSection = state.sections[targetSectionId];
                if (targetSection) {
                  element.x -= targetSection.x;
                  element.y -= targetSection.y;
                  element.sectionId = targetSectionId;
                  
                  // Update section's contained elements
                  get().addElementToSection(elementId, targetSectionId);
                  
                  console.log(`✅ [CANVAS STORE] Moved element ${elementId} to section ${targetSectionId}`, {
                    targetSection: { x: targetSection.x, y: targetSection.y },
                    relativeCoords: { x: element.x, y: element.y }
                  });
                }
              } else {
                // Dropped on canvas (no section)
                element.sectionId = undefined;
                if (oldSectionId) {
                  get().removeElementFromSection(elementId, oldSectionId);
                  console.log(`✅ [CANVAS STORE] Moved element ${elementId} from section ${oldSectionId} to canvas`);
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
                element.sectionId = undefined;
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

export default useCanvasStore;