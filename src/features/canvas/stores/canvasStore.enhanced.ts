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
import { CoordinateService } from '../utils/canvasCoordinateService';
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
  updateConnectedConnectors: (elementId: ElementId) => void;
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
              logger.warn('❌ [CANVAS STORE] Element not found for drop:', elementId);
              return;
            }

            if (!CoordinateService.validateCoordinates(position)) {
              logger.error('❌ [CANVAS STORE] Invalid coordinates provided for drop:', position);
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

              // FIXED: Always update coordinates, don't rely on needsUpdate flag
              // The test revealed this logic was preventing legitimate updates
              logger.log('🔄 [CANVAS STORE] Processing element drop:', {
                elementId,
                oldPosition: { x: element.x, y: element.y },
                newPosition: conversionResult.coordinates,
                sectionId: conversionResult.sectionId,
                needsUpdate: conversionResult.needsUpdate
              });

              // Single atomic update to prevent race conditions (as per performance guidelines)
              set((state: Draft<CanvasStoreState>) => {
                const stateElement = state.elements.get(elementId);
                if (!stateElement) {
                  logger.warn('❌ [CANVAS STORE] Element not found in draft state for drop:', elementId);
                  return;
                }

                // Store old section ID for cleanup
                const oldSectionId = stateElement.sectionId;

                // FIXED: Always update coordinates regardless of needsUpdate flag
                stateElement.x = conversionResult.coordinates.x;
                stateElement.y = conversionResult.coordinates.y;
                stateElement.sectionId = conversionResult.sectionId ? SectionId(conversionResult.sectionId) : null;
                stateElement.updatedAt = Date.now();

                // PHASE 8B ENHANCEMENT: Update section childElementIds bidirectional relationship
                // Remove from old section if exists
                if (oldSectionId && oldSectionId !== conversionResult.sectionId) {
                  const oldSection = state.sections.get(oldSectionId);
                  if (oldSection && oldSection.childElementIds) {
                    const index = oldSection.childElementIds.indexOf(elementId as ElementId);
                    if (index > -1) {
                      // Use helper function for consistent cross-store synchronization
                      const updatedOldSection = { ...oldSection };
                      updatedOldSection.childElementIds.splice(index, 1);
                      state.sections.set(oldSectionId, updatedOldSection);
                      
                      // Also update in elements store
                      const oldSectionElement = state.elements.get(oldSectionId);
                      if (oldSectionElement) {
                        const updatedOldSectionElement = { ...oldSectionElement, childElementIds: updatedOldSection.childElementIds };
                        state.elements.set(oldSectionId, updatedOldSectionElement);
                      }
                    }
                  }
                }

                // Add to new section if exists
                if (conversionResult.sectionId) {
                  const newSection = state.sections.get(conversionResult.sectionId);
                  if (newSection && newSection.childElementIds) {
                    if (!newSection.childElementIds.includes(elementId as ElementId)) {
                      // Use helper function for consistent cross-store synchronization
                      const updatedNewSection = { ...newSection };
                      updatedNewSection.childElementIds.push(elementId as ElementId);
                      state.sections.set(conversionResult.sectionId, updatedNewSection);
                      
                      // Also update in elements store
                      const newSectionElement = state.elements.get(conversionResult.sectionId);
                      if (newSectionElement) {
                        const updatedNewSectionElement = { ...newSectionElement, childElementIds: updatedNewSection.childElementIds };
                        state.elements.set(conversionResult.sectionId, updatedNewSectionElement);
                      }
                    }
                  }
                }

                logger.log('✅ [CANVAS STORE] Element dropped successfully with bidirectional section update:', {
                  elementId,
                  newPosition: conversionResult.coordinates,
                  oldSectionId,
                  newSectionId: conversionResult.sectionId
                });
              });
              
              // Update any connected connectors
              get().updateConnectedConnectors(elementId);
            } catch (error) {
              logger.error('❌ [CANVAS STORE] Error during element drop:', error);
              // TODO: Integrate with CanvasErrorHandler for production error recovery
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
                      }

                      logger.log('✅ [ENHANCED STORE] Assigned element to section:', { elementId, sectionId });
                    }
                  });
                });
              }
            } catch (error) {
              logger.error('❌ [ENHANCED STORE] Error during element capture:', error);
            }
          },

          updateElementCoordinatesOnSectionMove: (sectionId: SectionId, _deltaX: number, _deltaY: number) => {
            // This logic is simplified. Child elements have relative positions,
            // so their coordinates don't need to change when the parent section moves.
            // The rendering engine handles the group transform.
            // We just need to ensure the section's own coordinates are updated, which is done in its own slice.
            logger.log('✅ [ENHANCED STORE] Section moved. Child positions are relative.', { sectionId });
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
            // FIXED: Ensure coordinates are always defined and valid
            const validX = typeof x === 'number' && !isNaN(x) ? x : 100;
            const validY = typeof y === 'number' && !isNaN(y) ? y : 100;
            const validWidth = typeof width === 'number' && width > 0 ? width : 400;
            const validHeight = typeof height === 'number' && height > 0 ? height : 300;
            
            logger.log('🎯 [ENHANCED STORE] Creating section with validated coordinates:', {
              x: validX, y: validY, width: validWidth, height: validHeight, title
            });
            
            // Call the original section store method with validated coordinates
            const sectionId = sectionSlice.createSection(validX, validY, validWidth, validHeight, title);
            
            // CRITICAL FIX: Register the section in the elements store as well
            // This allows UI operations to find and manipulate sections
            set((state: Draft<CanvasStoreState>) => {
              const section = state.sections.get(sectionId);
              if (section) {
                // FIXED: Ensure section has proper coordinates
                const sectionElement = {
                  id: sectionId,
                  type: 'section',
                  x: section.x || validX, // Fallback to validated coordinates
                  y: section.y || validY,
                  width: section.width || validWidth,
                  height: section.height || validHeight,
                  title: section.title || title,
                  backgroundColor: section.backgroundColor,
                  borderColor: section.borderColor,
                  borderWidth: section.borderWidth,
                  cornerRadius: section.cornerRadius,
                  isLocked: section.isLocked,
                  isHidden: section.isHidden,
                  childElementIds: section.childElementIds || [], // FIXED: Always initialize as array
                  createdAt: section.createdAt,
                  updatedAt: section.updatedAt,
                  sectionId: null // Sections don't belong to other sections
                } as any;
                
                state.elements.set(sectionId, sectionElement);
                logger.log('✅ [ENHANCED STORE] Registered section in both stores:', sectionId, {
                  coordinates: { x: sectionElement.x, y: sectionElement.y },
                  dimensions: { width: sectionElement.width, height: sectionElement.height }
                });
              }
            });
            
            // FIXED: Immediately capture elements within the section bounds
            // Use direct implementation to ensure reliability
            let capturedElementIds: string[] = [];
            
            // Get fresh state after section creation
            const currentState = get();
            const createdSection = currentState.sections.get(sectionId);
            
            if (createdSection) {
              logger.log('🔍 [ENHANCED STORE] Starting element capture for section:', {
                sectionId,
                sectionBounds: { x: createdSection.x, y: createdSection.y, width: createdSection.width, height: createdSection.height },
                elementsCount: currentState.elements.size
              });
              
              // Manual capture logic for better debugging
              currentState.elements.forEach((element, elementId) => {
                // FIXED: Skip the section we just created (avoid self-capture)
                if (elementId === sectionId) {
                  return;
                }
                
                // Skip if element is already in a section
                if (element.sectionId) {
                  logger.log('⚠️ [ENHANCED STORE] Skipping element already in section:', elementId, element.sectionId);
                  return;
                }
                
                // Skip section elements themselves
                if (element.type === 'section') {
                  logger.log('⚠️ [ENHANCED STORE] Skipping section element:', elementId);
                  return;
                }
                
                // Get element dimensions
                let elementWidth = 50;
                let elementHeight = 50;
                
                // Use type predicates to safely access element properties
                if ('width' in element && element.width && 'height' in element && element.height) {
                  elementWidth = element.width;
                  elementHeight = element.height;
                } else if ('radius' in element && element.radius) {
                  elementWidth = element.radius * 2;
                  elementHeight = element.radius * 2;
                }
                
                // Calculate element center
                const elementCenterX = element.x + elementWidth / 2;
                const elementCenterY = element.y + elementHeight / 2;
                
                // Check if element center is within section bounds
                const isWithinSection = elementCenterX >= createdSection.x && 
                                       elementCenterX <= createdSection.x + createdSection.width && 
                                       elementCenterY >= createdSection.y && 
                                       elementCenterY <= createdSection.y + createdSection.height;
                                       
                logger.log('🧪 [ENHANCED STORE] Element containment check:', {
                  elementId,
                  elementCenter: { x: elementCenterX, y: elementCenterY },
                  sectionBounds: { 
                    left: createdSection.x, 
                    right: createdSection.x + createdSection.width,
                    top: createdSection.y, 
                    bottom: createdSection.y + createdSection.height 
                  },
                  isWithinSection
                });
                
                if (isWithinSection) {
                  capturedElementIds.push(elementId);
                  logger.log('✅ [ENHANCED STORE] Element captured:', elementId);
                }
              });
            } else {
              logger.error('❌ [ENHANCED STORE] Section not found for capture:', sectionId);
            }
            
            logger.log('🔍 [ENHANCED STORE] Element capture results:', {
              sectionId,
              capturedCount: capturedElementIds.length,
              capturedIds: capturedElementIds
            });
            
            if (capturedElementIds.length > 0) {
              logger.log('🎯 [ENHANCED STORE] Processing captured elements for section:', sectionId);
              
              // PHASE 8B ENHANCEMENT: Atomic update for all captured elements and section
              set((state: Draft<CanvasStoreState>) => {
                // First, update all captured elements to reference the section
                capturedElementIds.forEach(elementId => {
                  const element = state.elements.get(elementId);
                  if (element) {
                    element.sectionId = SectionId(sectionId);
                    element.updatedAt = Date.now();
                    
                    logger.log('✅ [ENHANCED STORE] Assigned sectionId to element:', {
                      elementId,
                      sectionId: element.sectionId,
                      elementPosition: { x: element.x, y: element.y }
                    });
                  } else {
                    logger.warn('❌ [ENHANCED STORE] Element not found during capture assignment:', elementId);
                  }
                });

                // Then, update the section to track its children
                const section = state.sections.get(sectionId);
                if (section) {
                  section.childElementIds = capturedElementIds.map(id => ElementId(id));
                  section.updatedAt = Date.now();
                  
                  // Also update the section in elements store for cross-store consistency
                  const sectionElement = state.elements.get(sectionId);
                  if (sectionElement) {
                    (sectionElement as any).childElementIds = section.childElementIds;
                  }
                  
                  logger.log('✅ [ENHANCED STORE] Updated section with childElementIds in atomic operation:', {
                    sectionId,
                    childCount: section.childElementIds.length,
                    childIds: section.childElementIds
                  });
                } else {
                  logger.error('❌ [ENHANCED STORE] Section not found for childElementIds update:', sectionId);
                }
              });
              
              logger.log('✅ [ENHANCED STORE] Successfully captured and assigned', capturedElementIds.length, 'elements to section:', sectionId);
            } else {
              // FIXED: Even when no elements captured, ensure section has proper structure
              set((state: Draft<CanvasStoreState>) => {
                const section = state.sections.get(sectionId);
                if (section && !section.childElementIds) {
                  const updatedSection = {
                    ...section,
                    childElementIds: [] // FIXED: Initialize empty array
                  };
                  state.sections.set(sectionId, updatedSection);
                  
                  // Also update in elements store
                  const sectionElement = state.elements.get(sectionId);
                  if (sectionElement) {
                    (sectionElement as any).childElementIds = [];
                    state.elements.set(sectionId, sectionElement);
                  }
                  
                  logger.log('✅ [ENHANCED STORE] Initialized empty childElementIds for section:', sectionId);
                }
              });
            }
            
            return sectionId;
          },

          // Override updateSection to handle child element movement
          updateSection: (id: SectionId, updates: Partial<any>) => {
            const currentState = get();
            const section = currentState.sections.get(id);
            
            if (!section) {
              logger.warn('❌ [ENHANCED STORE] Section not found for update:', id);
              return;
            }
            
            // Check if position is being updated (section being moved)
            const isMoving = 'x' in updates || 'y' in updates;
            
            if (isMoving) {
              const newX = updates.x !== undefined ? updates.x : section.x;
              const newY = updates.y !== undefined ? updates.y : section.y;
              const deltaX = newX - section.x;
              const deltaY = newY - section.y;
              
              if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                logger.log('🔄 [ENHANCED STORE] Section moving, updating ALL child elements:', id, { deltaX, deltaY });
                
                // Move ALL child elements by the same delta
                // This is the FigJam behavior - children maintain relative positions to each other
                const childIds = section.childElementIds || [];
                
                if (childIds.length > 0) {
                  set((state: Draft<CanvasStoreState>) => {
                    childIds.forEach(childId => {
                      const childElement = state.elements.get(childId as string);
                      if (childElement) {
                        const updatedChild = {
                          ...childElement,
                          x: childElement.x + deltaX,
                          y: childElement.y + deltaY,
                          updatedAt: Date.now()
                        };
                        state.elements.set(childId as string, updatedChild);
                      }
                    });
                  });
                  
                  logger.log('✅ [ENHANCED STORE] Moved', childIds.length, 'child elements with section');
                }
              }
            }
            
            // Call the original section store update method
            sectionSlice.updateSection(id, updates);
            
            // CRITICAL FIX: Also update the section in the elements store
            set((state: Draft<CanvasStoreState>) => {
              const updatedSection = state.sections.get(id);
              if (updatedSection) {
                // Sync the section in the elements store
                state.elements.set(id, {
                  id: updatedSection.id,
                  type: 'section',
                  x: updatedSection.x,
                  y: updatedSection.y,
                  width: updatedSection.width,
                  height: updatedSection.height,
                  title: updatedSection.title,
                  backgroundColor: updatedSection.backgroundColor,
                  borderColor: updatedSection.borderColor,
                  borderWidth: updatedSection.borderWidth,
                  cornerRadius: updatedSection.cornerRadius,
                  isLocked: updatedSection.isLocked,
                  isHidden: updatedSection.isHidden,
                  childElementIds: updatedSection.childElementIds,
                  createdAt: updatedSection.createdAt,
                  updatedAt: updatedSection.updatedAt,
                  sectionId: null // Sections don't belong to other sections
                } as any);
              }
            });
            
            logger.log('✅ [ENHANCED STORE] Section updated in both stores:', id, updates);
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
            
            // Note: Let the elements store handle the "not found" error case
            // This ensures that tests can properly catch cross-store synchronization issues

            // If element is in a section and position is being updated, apply constraints
            if (element && element.sectionId && ('x' in updates || 'y' in updates)) {
              const section = currentState.sections.get(element.sectionId);
              if (section) {
                // Get element dimensions for boundary checking
                let elementWidth = 50;
                let elementHeight = 50;
                
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
                
                // Apply constraints
                const padding = 10;
                const minX = section.x + padding;
                const maxX = section.x + section.width - elementWidth - padding;
                const minY = section.y + padding;
                const maxY = section.y + section.height - elementHeight - padding;
                
                if ('x' in updates) {
                  updates.x = Math.max(minX, Math.min(maxX, updates.x));
                }
                if ('y' in updates) {
                  updates.y = Math.max(minY, Math.min(maxY, updates.y));
                }
                
                logger.log('🔒 [ENHANCED STORE] Applied section constraints to element:', {
                  elementId: id,
                  sectionBounds: { x: section.x, y: section.y, width: section.width, height: section.height },
                  constrainedPosition: { x: updates.x, y: updates.y }
                });
              }
            }

            // Call the original element store update method
            elementsSlice.updateElement(id, updates);
            
            // Update any connected connectors if position changed
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

// Setup text debugging monitoring
if (process.env.NODE_ENV === 'development') {
  
}

// Development debugging: expose store globally
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).useCanvasStore = useCanvasStore;
  logger.log('🔧 Canvas store exposed globally as window.useCanvasStore for debugging');
}