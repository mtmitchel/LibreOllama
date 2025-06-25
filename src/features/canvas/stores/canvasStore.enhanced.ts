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

import { logger } from '@/lib/logger';
import { updateConnectorPosition } from '../utils/connectorUtils';
import { isConnectorElement } from '../types/enhanced.types';

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

import { ElementId, SectionId, CanvasElement } from '../types/enhanced.types';
import { nanoid } from 'nanoid';
// import { safeMapGet, toElementId, toSectionId } from '../types/compatibility';

// Combined store state
// FIXED: Replaced complex Omit/intersection with a direct intersection of all slice states.
// This ensures all properties and methods from all slices are correctly included in the final type.
export interface CanvasStoreState extends
  CanvasElementsStore.CanvasElementsState,
  TextEditingStore.TextEditingState,
  SelectionStore.SelectionState,
  ViewportStore.ViewportState,
  CanvasUIStore.CanvasUIState,
  CanvasHistoryStore.CanvasHistoryState,
  SectionStore.SectionState {
  // Enhanced methods for cross-slice operations
  createElement: (elementData: Partial<CanvasElement>) => CanvasElement;
  findSectionAtPoint: (point: { x: number; y: number }) => SectionId | null;
  handleElementDrop: (elementId: ElementId | SectionId, position: { x: number; y: number }) => void;
  captureElementsAfterSectionCreation: (sectionId: SectionId) => void;
  updateElementCoordinatesOnSectionMove: (sectionId: SectionId, deltaX: number, deltaY: number) => void;
  convertElementToAbsoluteCoordinates: (elementId: ElementId) => void;
  convertElementToRelativeCoordinates: (elementId: ElementId, sectionId: SectionId) => void;
  updateConnectedConnectors: (elementId: ElementId) => void;
  
  // INSIGHTS FROM TESTS: Additional convenience methods
  setSelectedTool: (tool: string) => void;
  deleteSelectedElements: () => void;
}

// Store factory function for lazy initialization
export const createEnhancedCanvasStore = () => {
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

        // FIXED: Explicitly merge all slice states and methods to prevent property loss.
        // The previous spread order might have caused methods to be overwritten by initial state objects.
        const combinedState = {
          ...elementsSlice,
          ...sectionSlice,
          ...textEditingSlice,
          ...selectionSlice,
          ...viewportSlice,
          ...uiSlice,
          ...historySlice,
        };

        // Return combined store with enhanced methods
        return {
          ...combinedState,

          // NEW: Implemented the missing `createElement` enhanced method.
          // This function handles ID generation and adds timestamps.
          createElement: (elementData: Partial<CanvasElement>): CanvasElement => {
            const newElement: CanvasElement = {
              id: elementData.id || ElementId(nanoid(10)),
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              rotation: 0,
              isHidden: false, // FIXED: Was 'visible', which is not a valid property.
              isLocked: false,
              ...elementData,
              type: elementData.type || 'rectangle', // Default type
              createdAt: Date.now(),
              updatedAt: Date.now(),
            } as CanvasElement; // Added type assertion for safety
            
            set(state => {
              state.elements.set(newElement.id, newElement);
            });

            return newElement;
          },
          
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
            const { findSectionAtPoint, convertElementToRelativeCoordinates, updateElement, updateSection } = get();
            const targetSectionId = findSectionAtPoint(position);

            if (targetSectionId) {
              // Dropped onto a section
              convertElementToRelativeCoordinates(elementId as ElementId, targetSectionId);
            } else {
              // Dropped on canvas
              const element = get().elements.get(elementId as ElementId);
              if (element && element.sectionId) {
                // Element was in a section, now it's not
                get().convertElementToAbsoluteCoordinates(elementId as ElementId);
              } else {
                // Just update position
                updateElement(elementId as ElementId, { x: position.x, y: position.y });
              }
            }
          },

          captureElementsAfterSectionCreation: (sectionId: SectionId) => {
            logger.log('🎯 [ENHANCED STORE] Capturing elements after section creation:', sectionId);
            
            const currentState = get();
            const section = currentState.sections.get(sectionId);
            
            if (!section) {
              logger.warn('❌ [ENHANCED STORE] Section not found for element capture:', sectionId);
              return;
            }
            
            // FIXED: Validate section coordinates before capture
            if (typeof section.x !== 'number' || typeof section.y !== 'number') {
              logger.error('❌ [ENHANCED STORE] Section has invalid coordinates:', {
                sectionId, 
                x: section.x, 
                y: section.y,
                type: { x: typeof section.x, y: typeof section.y }
              });
              return;
            }
            
            try {
              // 1. Use the refactored, non-mutating query from the section store
              const capturedElementIds = currentState.captureElementsInSection(sectionId, currentState.elements);
              
              logger.log('🔍 [ENHANCED STORE] Capture query results:', {
                sectionId,
                capturedCount: capturedElementIds.length,
                capturedIds: capturedElementIds,
              });
              
              if (capturedElementIds.length > 0) {
                // 2. Perform all state mutations here in the enhanced store
                set((state: Draft<CanvasStoreState>) => {
                  const targetSection = state.sections.get(sectionId);
                  if (!targetSection) return;

                  // Initialize childElementIds if it doesn't exist
                  if (!targetSection.childElementIds) {
                    targetSection.childElementIds = [];
                  }

                  capturedElementIds.forEach(elementId => {
                    const element = state.elements.get(elementId);
                    if (element) {
                      const oldSectionId = element.sectionId;

                      // A. Update the element's sectionId
                      element.sectionId = SectionId(sectionId);
                      element.updatedAt = Date.now();
                      state.elements.set(elementId, element);

                      // B. Remove from old section's childElementIds if it exists
                      if (oldSectionId && oldSectionId !== sectionId) {
                        const oldSection = state.sections.get(oldSectionId);
                        if (oldSection && oldSection.childElementIds) {
                          const index = oldSection.childElementIds.indexOf(ElementId(elementId));
                          if (index > -1) {
                            oldSection.childElementIds.splice(index, 1);
                          }
                        }
                      }
                      
                      // C. Add to new section's childElementIds if not already present
                      if (!targetSection.childElementIds.includes(ElementId(elementId))) {
                        targetSection.childElementIds.push(ElementId(elementId));
                        logger.log('✅ [ENHANCED STORE] Element captured in new section:', { elementId, sectionId });
                      }
                    }
                  });
                });
              }
            } catch (error) {
              logger.error('❌ [ENHANCED STORE] Error during element capture:', error);
            }
          },

          resizeSection: (sectionId: SectionId, newWidth: number, newHeight: number) => {
            const { sections, elements, updateElement } = get();
            const section = sections.get(sectionId);

            if (!section) return;

            const oldWidth = section.width;
            const oldHeight = section.height;
            const scaleX = newWidth / oldWidth;
            const scaleY = newHeight / oldHeight;

            get().updateSection(sectionId, { width: newWidth, height: newHeight });

            section.childElementIds.forEach(elementId => {
              const element = elements.get(elementId);
              if (element) {
                const newX = element.x * scaleX;
                const newY = element.y * scaleY;
                let updates: Partial<CanvasElement> = { x: newX, y: newY };

                if (element.type === 'circle') {
                  updates.radius = (element.radius || 0) * Math.min(scaleX, scaleY);
                } else {
                  updates.width = (element.width || 0) * scaleX;
                  updates.height = (element.height || 0) * scaleY;
                }

                updateElement(elementId, updates);
              }
            });
          },

          convertElementToAbsoluteCoordinates: (elementId: ElementId) => {
            logger.log('🔄 [ENHANCED STORE] Converting element to absolute coordinates:', elementId);
            
            const currentState = get();
            const element = currentState.elements.get(elementId);
            
            if (!element || !element.sectionId) {
              logger.log('ℹ️ [ENHANCED STORE] Element not in section or not found, no conversion needed:', elementId);
              return;
            }
            
            const section = currentState.sections.get(element.sectionId);
            if (!section) {
              logger.warn('❌ [ENHANCED STORE] Section not found for element:', element.sectionId);
              return;
            }
            
            try {
              // Calculate absolute coordinates
              const absoluteX = section.x + element.x;
              const absoluteY = section.y + element.y;
              
              set((state: Draft<CanvasStoreState>) => {
                const stateElement = state.elements.get(elementId);
                if (stateElement) {
                  stateElement.x = absoluteX;
                  stateElement.y = absoluteY;
                  stateElement.sectionId = null; // Remove section reference
                  stateElement.updatedAt = Date.now();
                  state.elements.set(elementId, { ...stateElement });
                  
                  // Remove from section's child list
                  const stateSection = state.sections.get(element.sectionId!);
                  if (stateSection) {
                    const index = stateSection.childElementIds.indexOf(elementId);
                    if (index > -1) {
                      stateSection.childElementIds.splice(index, 1);
                      state.sections.set(element.sectionId!, { ...stateSection });
                    }
                  }
                }
              });
              
              logger.log('✅ [ENHANCED STORE] Element converted to absolute coordinates:', {
                elementId,
                newPosition: { x: absoluteX, y: absoluteY },
                removedFromSection: element.sectionId
              });
            } catch (error) {
              logger.error('❌ [ENHANCED STORE] Error converting to absolute coordinates:', error);
            }
          },

          convertElementToRelativeCoordinates: (elementId: ElementId, sectionId: SectionId) => {
            logger.log('🔄 [ENHANCED STORE] Converting element to relative coordinates:', { elementId, sectionId });
            
            const currentState = get();
            const element = currentState.elements.get(elementId);
            const section = currentState.sections.get(sectionId);
            
            if (!element) {
              logger.warn('❌ [ENHANCED STORE] Element not found:', elementId);
              return;
            }
            
            if (!section) {
              logger.warn('❌ [ENHANCED STORE] Section not found:', sectionId);
              return;
            }
            
            try {
              // Calculate relative coordinates
              const relativeX = element.x - section.x;
              const relativeY = element.y - section.y;
              
              set((state: Draft<CanvasStoreState>) => {
                const stateElement = state.elements.get(elementId);
                if (stateElement) {
                  // Remove from current section if any
                  if (stateElement.sectionId) {
                    const currentSection = state.sections.get(stateElement.sectionId);
                    if (currentSection) {
                      const index = currentSection.childElementIds.indexOf(elementId);
                      if (index > -1) {
                        currentSection.childElementIds.splice(index, 1);
                        state.sections.set(stateElement.sectionId, { ...currentSection });
                      }
                    }
                  }
                  
                  // Update element with relative coordinates and new section
                  stateElement.x = relativeX;
                  stateElement.y = relativeY;
                  stateElement.sectionId = sectionId;
                  stateElement.updatedAt = Date.now();
                  state.elements.set(elementId, { ...stateElement });
                  
                  // Add to new section's child list
                  const targetSection = state.sections.get(sectionId);
                  if (targetSection && !targetSection.childElementIds.includes(elementId)) {
                    targetSection.childElementIds.push(elementId);
                    state.sections.set(sectionId, { ...targetSection });
                  }
                }
              });
              
              logger.log('✅ [ENHANCED STORE] Element converted to relative coordinates:', {
                elementId,
                newPosition: { x: relativeX, y: relativeY },
                addedToSection: sectionId
              });
            } catch (error) {
              logger.error('❌ [ENHANCED STORE] Error converting to relative coordinates:', error);
            }
          },

          updateConnectedConnectors: (elementId: ElementId) => {
            logger.log('🔗 [ENHANCED STORE] Updating connectors connected to element:', elementId);
            
            const currentState = get();
            const updates: Array<{ id: string; updates: Partial<any> }> = [];
            
            // Find all connectors connected to this element
            currentState.elements.forEach((element, id) => {
              if (isConnectorElement(element)) {
                const connector = element as any;
                if (connector.startElementId === elementId || connector.endElementId === elementId) {
                  const connectorUpdates = updateConnectorPosition(connector, currentState.elements);
                  if (Object.keys(connectorUpdates).length > 0) {
                    updates.push({ id, updates: connectorUpdates });
                  }
                }
              }
            });
            
            if (updates.length > 0) {
              logger.log('🔗 [ENHANCED STORE] Updating', updates.length, 'connectors');
              
              // Apply all connector updates
              set((state: Draft<CanvasStoreState>) => {
                updates.forEach(({ id, updates }) => {
                  const connector = state.elements.get(id);
                  if (connector) {
                    Object.assign(connector, updates);
                    connector.updatedAt = Date.now();
                    state.elements.set(id, connector);
                  }
                });
              });
              
              logger.log('✅ [ENHANCED STORE] Connectors updated successfully');
            }
          },

          // FIXED: Enhanced clearCanvas function that clears both elements AND sections
          clearCanvas: () => {
            logger.log('🧹 [CANVAS STORE] Clearing entire canvas including sections');
            
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
              
              logger.log('✅ [CANVAS STORE] Canvas fully cleared including sections');
            });
          },

          // Override createSection to add automatic element capture
          createSection: (x: number, y: number, width = 400, height = 300, title = 'New Section') => {
            const validX = typeof x === 'number' && !isNaN(x) ? x : 100;
            const validY = typeof y === 'number' && !isNaN(y) ? y : 100;
            const validWidth = typeof width === 'number' && width > 0 ? width : 400;
            const validHeight = typeof height === 'number' && height > 0 ? height : 300;
            
            logger.log('🎯 [ENHANCED STORE] Creating section with validated coordinates:', {
              x: validX, y: validY, width: validWidth, height: validHeight, title
            });
            
            const sectionId = SectionId(`section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
            
            let capturedElementIds: string[] = [];
            const currentState = get();
            
            currentState.elements.forEach((element, elementId) => {
                if (elementId === sectionId) {
                  return;
                }
                
                if (element.sectionId) {
                  logger.log('⚠️ [ENHANCED STORE] Skipping element already in section:', elementId, element.sectionId);
                  return;
                }
                
                if (element.type === 'section') {
                  logger.log('⚠️ [ENHANCED STORE] Skipping section element:', elementId);
                  return;
                }
                
                let elementWidth = 50;
                let elementHeight = 50;
                
                if ('width' in element && element.width && 'height' in element && element.height) {
                  elementWidth = element.width;
                  elementHeight = element.height;
                } else if ('radius' in element && element.radius) {
                  elementWidth = element.radius * 2;
                  elementHeight = element.radius * 2;
                }
                
                const elementCenterX = element.x + elementWidth / 2;
                const elementCenterY = element.y + elementHeight / 2;
                
                const isWithinSection = elementCenterX >= validX && 
                                       elementCenterX <= validX + validWidth && 
                                       elementCenterY >= validY && 
                                       elementCenterY <= validY + validHeight;
                                       
                if (isWithinSection) {
                  capturedElementIds.push(elementId);
                }
            });

            const newSection: SectionElement = {
              id: sectionId,
              type: 'section',
              x: validX,
              y: validY,
              width: validWidth,
              height: validHeight,
              title,
              childElementIds: capturedElementIds.map(id => ElementId(id)),
              isLocked: false,
              isHidden: false,
              backgroundColor: '#f8f9fa',
              borderColor: '#e9ecef',
              borderWidth: 2,
              cornerRadius: 8,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            set((state: Draft<CanvasStoreState>) => {
              state.sections.set(sectionId, newSection);
              state.elements.set(sectionId, newSection as any);

              capturedElementIds.forEach(elementId => {
                const element = state.elements.get(elementId);
                if (element) {
                  element.sectionId = sectionId;
                  element.updatedAt = Date.now();
                }
              });
            });
            
            return sectionId;
          },

          // Override updateSection to handle child element movement
          updateSection: (id: SectionId, updates: Partial<any>) => {
            // First, update the section in its own slice
            sectionSlice.updateSection(id, updates);

            // Then, get the fully updated section from the sections slice
            const updatedSection = get().sections.get(id);

            if (updatedSection) {
              // Now, update the corresponding entry in the main elements map
              set((state: Draft<CanvasStoreState>) => {
                const sectionElement = state.elements.get(id);
                if (sectionElement) {
                  // Merge updates into the existing element to preserve references
                  Object.assign(sectionElement, updatedSection);
                  sectionElement.updatedAt = Date.now();
                  state.elements.set(id, sectionElement);
                }
              });
            }

            logger.log('✅ [ENHANCED STORE] Section updated and synced in both stores:', id, updates);
          },

          // Override deleteSection to clean up element references
          deleteSection: (id: SectionId) => {
            const currentState = get();
            const section = currentState.sections.get(id);
            
            if (!section) {
              logger.warn('❌ [ENHANCED STORE] Section not found for deletion:', id);
              return;
            }

            const childElementIds = section.childElementIds || [];
            logger.log('🗑️ [ENHANCED STORE] Deleting section and freeing', childElementIds.length, 'child elements');

            // Free all child elements (remove their sectionId reference)
            if (childElementIds.length > 0) {
              set((state: Draft<CanvasStoreState>) => {
                childElementIds.forEach(elementId => {
                  const element = state.elements.get(elementId as string);
                  if (element) {
                    const freedElement = {
                      ...element,
                      sectionId: undefined, // Remove section reference
                      updatedAt: Date.now()
                    };
                    state.elements.set(elementId as string, freedElement);
                  }
                });
              });
            }

            // Call the original section store delete method
            sectionSlice.deleteSection(id);
            
            // CRITICAL FIX: Also remove the section from the elements store
            set((state: Draft<CanvasStoreState>) => {
              state.elements.delete(id);
            });
            
            logger.log('✅ [ENHANCED STORE] Section deleted from both stores and', childElementIds.length, 'elements freed');
          },

          // Override updateElement to apply section constraints
          updateElement: (id: ElementId, updates: Partial<any>) => {
            const currentState = get();
            const element = currentState.elements.get(id as string);

            

            elementsSlice.updateElement(id, updates);
            
            if ('x' in updates || 'y' in updates) {
              get().updateConnectedConnectors(id);
            }
          },

          // Override addElement to provide automatic cross-store registration
          addElement: (element: any) => {
            logger.log('🎯 [ENHANCED STORE] Adding element with cross-store registration check:', { 
              elementId: element.id, 
              type: element.type, 
              sectionId: element.sectionId 
            });
            
            // Call the original elements store addElement method first
            elementsSlice.addElement(element);
            
            // CRITICAL FIX: If element has a sectionId, automatically register it in the section's childElementIds
            if (element.sectionId) {
              logger.log('🔄 [ENHANCED STORE] Element has sectionId, performing cross-store registration:', {
                elementId: element.id,
                sectionId: element.sectionId
              });
              
              set((state: Draft<CanvasStoreState>) => {
                const section = state.sections.get(element.sectionId);
                if (section) {
                  // Add element to section's childElementIds if not already present
                  if (!section.childElementIds.includes(element.id)) {
                    section.childElementIds.push(element.id);
                    state.sections.set(element.sectionId, { ...section });
                    
                    // Also update the section in elements store for cross-store consistency
                    const sectionElement = state.elements.get(element.sectionId);
                    if (sectionElement) {
                      const updatedSectionElement = { ...sectionElement, childElementIds: section.childElementIds };
                      state.elements.set(element.sectionId, updatedSectionElement);
                    }
                    
                    logger.log('✅ [ENHANCED STORE] Element automatically registered in section:', {
                      elementId: element.id,
                      sectionId: element.sectionId,
                      childCount: section.childElementIds.length
                    });
                  } else {
                    logger.log('ℹ️ [ENHANCED STORE] Element already registered in section:', {
                      elementId: element.id,
                      sectionId: element.sectionId
                    });
                  }
                } else {
                  logger.warn('❌ [ENHANCED STORE] Section not found for element registration:', {
                    elementId: element.id,
                    sectionId: element.sectionId
                  });
                }
              });
            }
          },

          // Helper function for consistent cross-store synchronization
          updateSectionInBothStores: (sectionId: SectionId, updateFn: (section: any) => any) => {
            set((state: Draft<CanvasStoreState>) => {
              const section = state.sections.get(sectionId);
              if (section) {
                const updatedSection = updateFn(section);
                state.sections.set(sectionId, updatedSection);
                
                // Also update in elements store for cross-store consistency
                const sectionElement = state.elements.get(sectionId);
                if (sectionElement) {
                  const updatedSectionElement = { ...sectionElement, ...updatedSection };
                  state.elements.set(sectionId, updatedSectionElement);
                }
              }
            });
          },
          
          // FIXED: Add setSelectedTool alias to map to UI store's setActiveTool
          setSelectedTool: (tool: string) => {
            const currentState = get();
            if (currentState.setActiveTool) {
              currentState.setActiveTool(tool);
            }
          },

          // INSIGHT FROM TESTS: Add convenience method for deleting selected elements
          // Tests revealed users need a single method that combines: getSelectedElementIds + deleteElements + clearSelection
          deleteSelectedElements: () => {
            const currentState = get();
            const selectedIds = currentState.getSelectedElementIds();
            
            if (selectedIds.length > 0) {
              // Delete the selected elements
              currentState.deleteElements(selectedIds);
              // Clear the selection
              currentState.clearSelection();
              
              // Log the operation for debugging
              console.log(`✅ Deleted ${selectedIds.length} selected elements`);
            }
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

// Export the creator function for testing purposes
export const createCanvasStore = createEnhancedCanvasStore;

// Debug: Expose store to window for browser debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__CANVAS_STORE__ = canvasStore;
  console.log('🔧 [DEBUG] Canvas store exposed to window.__CANVAS_STORE__');
}

// Main store hook
export const useCanvasStore = <T>(selector: (state: CanvasStoreState) => T) => {
  return getCanvasStore()(selector);
};

// Export individual primitive selectors for React 19 compatibility
// Individual primitive selectors for React 19 compatibility  
// Object-returning selectors cause "getSnapshot should be cached" errors
export const useElements = () => useCanvasStore(state => state.elements);
export const useAddElement = () => useCanvasStore(state => state.addElement);
export const useUpdateElement = () => useCanvasStore(state => state.updateElement);
export const useDeleteElement = () => useCanvasStore(state => state.deleteElement);
export const useDuplicateElement = () => useCanvasStore(state => state.duplicateElement);

// Note: Selection selectors are provided by selectionStore slice to avoid export conflicts

// Granular element access selector for O(1) lookups
export const useElement = (elementId: ElementId) => useCanvasStore(
  state => state.elements.get(elementId)
);

// Granular selection check for O(1) performance
export const useIsElementSelected = (elementId: ElementId) => useCanvasStore(
  state => state.selectedElementIds.has(elementId)
);

// Elements selector - Note: This returns a new array each time, components should memoize if needed
export const useViewportElements = () => useCanvasStore(
  state => {
    // Only return elements visible in viewport for rendering optimization
    const viewport = state.viewportBounds;
    if (!viewport) return Array.from(state.elements.values());
    
    return Array.from(state.elements.values()).filter(element => {
      // Use type-safe property access for dimensions
      let elementWidth = 100;
      let elementHeight = 100;
      
      if ('width' in element && element.width) {
        elementWidth = element.width;
      }
      if ('height' in element && element.height) {
        elementHeight = element.height;
      }
      if ('radius' in element && element.radius) {
        elementWidth = element.radius * 2;
        elementHeight = element.radius * 2;
      }
      
      // Simple viewport culling - can be enhanced with more sophisticated bounds checking
      return element.x < viewport.right && 
             element.x + elementWidth > viewport.left &&
             element.y < viewport.bottom && 
             element.y + elementHeight > viewport.top;
    });
  }
);

// Individual primitive selectors for React 19 compatibility
export const useEditingTextId = () => useCanvasStore(state => state.editingTextId);

export const useSelectedTool = () => useCanvasStore(state => state.selectedTool);
export const useSetSelectedTool = () => useCanvasStore(state => state.setSelectedTool);

export const useViewportBounds = () => useCanvasStore(state => state.viewportBounds);

export const useUndo = () => useCanvasStore(state => state.undo);
export const useRedo = () => useCanvasStore(state => state.redo);
export const useCanUndo = () => useCanvasStore(state => state.canUndo);
export const useCanRedo = () => useCanvasStore(state => state.canRedo);

export const useSectionsData = () => useCanvasStore(state => state.sections);
export const useCreateSection = () => useCanvasStore(state => state.createSection);
export const useUpdateSection = () => useCanvasStore(state => state.updateSection);
export const useDeleteSection = () => useCanvasStore(state => state.deleteSection);

export const useIsDrawing = () => useCanvasStore(state => state.isDrawing);
export const useCurrentPath = () => useCanvasStore(state => state.currentPath);

// INSIGHTS FROM TESTS: Export new convenience method hooks
export const useDeleteSelectedElements = () => useCanvasStore(state => state.deleteSelectedElements);

// Setup text debugging monitoring
if (process.env.NODE_ENV === 'development') {
  
}

// Development debugging: expose store globally
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useCanvasStore = useCanvasStore;
  logger.log('🔧 Canvas store exposed globally as window.useCanvasStore for debugging');
}