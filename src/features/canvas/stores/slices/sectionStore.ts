// src/stores/slices/sectionStore.ts
/**
 * Section Store - FIXED VERSION
 * Handles section operations and containment without circular dependencies
 * Updated to use Map<string, SectionElement> for O(1) performance
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import type { SectionElement } from '../../types/enhanced.types';
import { SectionId, ElementId } from '../../types/enhanced.types';
import { logger } from '@/lib/logger';

export interface SectionState {
  // Section data - Updated to use Map for O(1) operations
  sections: Map<string, SectionElement>;
  sectionOrder: string[];
    // Section operations
  createSection: (x: number, y: number, width?: number, height?: number, title?: string) => SectionId;
  updateSection: (id: SectionId, updates: Partial<SectionElement>) => void;
  deleteSection: (id: SectionId) => void;
  duplicateSection: (id: SectionId) => void;
  
  // Element containment - basic operations that don't require element data
  addElementToSection: (elementId: ElementId, sectionId: SectionId) => void;
  removeElementFromSection: (elementId: ElementId, sectionId: SectionId) => void;
  moveElementBetweenSections: (elementId: ElementId, fromSectionId: SectionId, toSectionId: SectionId) => void;
  getElementsInSection: (sectionId: SectionId) => ElementId[];
  getSectionForElement: (elementId: ElementId) => SectionId | null;
  
  // Section movement and resize
  handleSectionDragEnd: (sectionId: SectionId, newX: number, newY: number) => { deltaX: number; deltaY: number; childElementIds: ElementId[] } | null;
  resizeSection: (sectionId: SectionId, newWidth: number, newHeight: number) => { scaleX: number; scaleY: number; childElementIds: ElementId[] } | null;
  
  // Section queries
  getSectionById: (id: SectionId) => SectionElement | null;
  getAllSections: () => SectionElement[];
  
  // Section utilities
  clearAllSections: () => void;
  isElementInAnySection: (elementId: string) => boolean;
  
  // NEW: Capture elements helper that will be called from the combined store
  captureElementsInSection: (sectionId: string, elements: Map<string, any>) => string[];
}

export const createSectionStore: StateCreator<
  SectionState,
  [['zustand/immer', never]],
  [],
  SectionState
> = (set, get) => ({
  // Initial state - Using Map for O(1) performance
  sections: new Map(),  sectionOrder: [],
  
  // Section operations
  createSection: (x, y, width = 400, height = 300, title = 'New Section') => {
    const sectionId = SectionId(`section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const section: SectionElement = {
      id: sectionId,
      type: 'section',
      x,
      y,
      width,
      height,
      title,      childElementIds: [],
      isLocked: false,
      isHidden: false,
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef',
      borderWidth: 2,
      cornerRadius: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
      set((state: Draft<SectionState>) => {
      state.sections.set(sectionId, section);
      state.sectionOrder.push(sectionId);
    });
    
    logger.log('✅ [SECTION STORE] Created section:', sectionId, { x, y, width, height, title });
    return sectionId;
  },

  updateSection: (id, updates) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(id);
      if (section) {
        const updatedSection = { ...section, ...updates, updatedAt: Date.now() };
        state.sections.set(id, updatedSection);
        logger.log('✅ [SECTION STORE] Updated section:', id, updates);
      }
    });
  },
  
  deleteSection: (id) => {
    const section = get().sections.get(id);
    if (!section) return;

    const childElementIds = section.childElementIds || [];
    
    set((state: Draft<SectionState>) => {
      // Remove section
      state.sections.delete(id);
      state.sectionOrder = state.sectionOrder.filter(sId => sId !== id);
      logger.log('✅ [SECTION STORE] Deleted section:', id, 'with', childElementIds.length, 'contained elements');
    });
    
    // Return child element IDs so enhanced store can free them
    return childElementIds;
  },
  
  duplicateSection: (id) => {
    const section = get().sections.get(id);
    if (section) {
      const newSectionId = get().createSection(
        section.x + 20,
        section.y + 20,
        section.width,
        section.height,
        section.title + ' Copy'
      );
      
      set((state: Draft<SectionState>) => {        const newSection = state.sections.get(newSectionId);
        if (newSection) {
          const updatedSection = {
            ...newSection,
            ...(section.backgroundColor && { backgroundColor: section.backgroundColor }),
            ...(section.borderColor && { borderColor: section.borderColor }),
            ...(section.isLocked !== undefined && { isLocked: section.isLocked }),
            ...(section.isHidden !== undefined && { isHidden: section.isHidden })
          };
          state.sections.set(newSectionId, updatedSection);
        }
      });
      
      logger.log('✅ [SECTION STORE] Duplicated section:', id, 'to', newSectionId);
    }
  },
  
  // Element containment - simplified without element access
  addElementToSection: (elementId, sectionId) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(sectionId);      if (section && section.childElementIds && !section.childElementIds.includes(elementId)) {
        // Remove element from any other section first
        state.sections.forEach((s, sId) => {
          if (s.childElementIds) {  // Defensive check for childElementIds array
            const index = s.childElementIds.indexOf(elementId);
            if (index > -1) {
              s.childElementIds.splice(index, 1);
              // Update the section in the map
              state.sections.set(sId, { ...s });
            }
          }
        });
        
        // Add to target section
        section.childElementIds.push(elementId);
        state.sections.set(sectionId, { ...section });
        logger.log('✅ [SECTION STORE] Added element', elementId, 'to section', sectionId);
      }
    });
  },
  
  removeElementFromSection: (elementId, sectionId) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(sectionId);
      if (section) {
        const index = section.childElementIds.indexOf(elementId);
        if (index > -1) {
          section.childElementIds.splice(index, 1);
          state.sections.set(sectionId, { ...section });
          logger.log('✅ [SECTION STORE] Removed element', elementId, 'from section', sectionId);
        }
      }
    });
  },
  
  moveElementBetweenSections: (elementId, fromSectionId, toSectionId) => {
    get().removeElementFromSection(elementId, fromSectionId);
    get().addElementToSection(elementId, toSectionId);
    logger.log('✅ [SECTION STORE] Moved element', elementId, 'from', fromSectionId, 'to', toSectionId);
  },
  
  getElementsInSection: (sectionId) => {
    const section = get().sections.get(sectionId);
    return section ? [...section.childElementIds] : [];
  },
    getSectionForElement: (elementId) => {
    const sections = get().sections;
    
    for (const [sectionId, section] of sections) {
      if (section.childElementIds.includes(elementId)) {
        return SectionId(sectionId);
      }
    }
    
    return null;
  },
  
  // Section movement and resize
  handleSectionDragEnd: (sectionId, newX, newY) => {
    const section = get().sections.get(sectionId);
    if (!section) return null;
    
    const deltaX = newX - section.x;
    const deltaY = newY - section.y;
    
    set((state: Draft<SectionState>) => {
      // Update section position
      const section = state.sections.get(sectionId);
      if (section) {
        const updatedSection = {
          ...section,
          x: newX,
          y: newY
        };
        state.sections.set(sectionId, updatedSection);
      }
    });
    
    logger.log('✅ [SECTION STORE] Section drag end:', sectionId, 'moved by', { deltaX, deltaY });
    
    // Return delta for element store to update contained elements
    return { deltaX, deltaY, childElementIds: section.childElementIds };
  },
  
  resizeSection: (sectionId, newWidth, newHeight) => {
    const section = get().sections.get(sectionId);
    if (!section) return null;
    
    const scaleX = newWidth / section.width;
    const scaleY = newHeight / section.height;
    
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(sectionId);
      if (section) {
        const updatedSection = {
          ...section,
          width: newWidth,
          height: newHeight
        };
        state.sections.set(sectionId, updatedSection);
        logger.log('✅ [SECTION STORE] Resized section:', sectionId, { newWidth, newHeight, scaleX, scaleY });
      }
    });
    
    // Return scale factors for proportional resizing of contained elements
    return { scaleX, scaleY, childElementIds: section.childElementIds };
  },
  
  // Section queries - Updated to work with Map
  getSectionById: (id) => {
    return get().sections.get(id) || null;
  },
  
  getAllSections: () => {
    const { sections, sectionOrder } = get();
    return sectionOrder
      .map(id => sections.get(id))
      .filter((section): section is SectionElement => section !== undefined);
  },
  
  // Section utilities - Updated to work with Map
  clearAllSections: () => {
    set((state: Draft<SectionState>) => {
      state.sections.clear();
      state.sectionOrder = [];
    });
    logger.log('✅ [SECTION STORE] Cleared all sections');
  },
    isElementInAnySection: (elementId) => {
    return get().getSectionForElement(ElementId(elementId)) !== null;
  },
  
  // NEW: Method to capture elements that are within section bounds - Updated to work with Map
  captureElementsInSection: (sectionId: string, elements: Map<string, any>) => {
    const section = get().sections.get(sectionId);
    if (!section) return [];
    
    const capturedElementIds: string[] = [];
      elements.forEach((element, elementId) => {
      // Skip if element is already in a DIFFERENT section
      if (element.sectionId && element.sectionId !== sectionId) return;
      
      // Skip section elements themselves
      if (element.type === 'section') return;
      
      // Check if element center is within section bounds
      const elementX = element.x;
      const elementY = element.y;
      
      // Get element dimensions
      let elementWidth = 50;
      let elementHeight = 50;
      
      if (element.width && element.height) {
        elementWidth = element.width;
        elementHeight = element.height;
      } else if (element.radius) {
        elementWidth = element.radius * 2;
        elementHeight = element.radius * 2;
      }
      
      // Calculate element center
      const elementCenterX = elementX + elementWidth / 2;
      const elementCenterY = elementY + elementHeight / 2;
      
      // Check if element center is within section bounds
      const isWithinSection = elementCenterX >= section.x && 
                             elementCenterX <= section.x + section.width && 
                             elementCenterY >= section.y && 
                             elementCenterY <= section.y + section.height;
        if (isWithinSection) {
        capturedElementIds.push(elementId);
        logger.log('🎯 [SECTION STORE] Captured existing element:', elementId, {
          element: { 
            x: elementX, 
            y: elementY, 
            centerX: elementCenterX, 
            centerY: elementCenterY,
            width: elementWidth, 
            height: elementHeight 
          },
          section: { x: section.x, y: section.y, width: section.width, height: section.height }
        });      }
    });
      // Add captured elements to the section OR initialize empty childElementIds
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(sectionId);
      if (section) {
        if (capturedElementIds.length > 0) {
          // Remove elements from other sections
          capturedElementIds.forEach(elementId => {
            state.sections.forEach((s, sId) => {
              if (sId !== sectionId) {
                const index = s.childElementIds.findIndex(id => (id as string) === elementId);
                if (index > -1) {
                  s.childElementIds.splice(index, 1);
                  // Update the section in the map
                  state.sections.set(sId, { ...s });
                }
              }
            });
          });
          
          // FIXED: Merge with existing childElementIds instead of replacing
          const existingIds = section.childElementIds || [];
          const newIds = capturedElementIds.map(id => ElementId(id));
          const mergedIds = [...existingIds];
          
          // Add only new IDs that aren't already in the array
          newIds.forEach(newId => {
            if (!mergedIds.some(existingId => existingId === newId)) {
              mergedIds.push(newId);
            }
          });
          
          const updatedSection = {
            ...section,
            childElementIds: mergedIds
          };
          state.sections.set(sectionId, updatedSection);
          logger.log('✅ [SECTION STORE] Merged', capturedElementIds.length, 'new elements with', existingIds.length, 'existing elements in section:', sectionId);
        } else {
          // FIXED: Initialize empty childElementIds even when no elements are captured
          const updatedSection = {
            ...section,
            childElementIds: []
          };
          state.sections.set(sectionId, updatedSection);
          logger.log('✅ [SECTION STORE] Initialized empty childElementIds for section:', sectionId);
        }
      }
    });
    
    return capturedElementIds;
  }
});
