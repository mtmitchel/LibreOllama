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
    
    console.log('✅ [SECTION STORE] Created section:', sectionId, { x, y, width, height, title });
    return sectionId;
  },

  updateSection: (id, updates) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(id);
      if (section) {
        const updatedSection = { ...section, ...updates };
        state.sections.set(id, updatedSection);
        console.log('✅ [SECTION STORE] Updated section:', id, updates);
      }
    });
  },
  
  deleteSection: (id) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(id);
      if (section) {
        // Note: Contained elements become free elements (handled by combined store)
        state.sections.delete(id);
        state.sectionOrder = state.sectionOrder.filter(sId => sId !== id);
        console.log('✅ [SECTION STORE] Deleted section:', id, 'with', section.childElementIds.length, 'contained elements');
      }
    });
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
      
      console.log('✅ [SECTION STORE] Duplicated section:', id, 'to', newSectionId);
    }
  },
  
  // Element containment - simplified without element access
  addElementToSection: (elementId, sectionId) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections.get(sectionId);
      if (section && !section.childElementIds.includes(elementId)) {
        // Remove element from any other section first
        state.sections.forEach((s, sId) => {
          const index = s.childElementIds.indexOf(elementId);
          if (index > -1) {
            s.childElementIds.splice(index, 1);
            // Update the section in the map
            state.sections.set(sId, { ...s });
          }
        });
        
        // Add to target section
        section.childElementIds.push(elementId);
        state.sections.set(sectionId, { ...section });
        console.log('✅ [SECTION STORE] Added element', elementId, 'to section', sectionId);
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
          console.log('✅ [SECTION STORE] Removed element', elementId, 'from section', sectionId);
        }
      }
    });
  },
  
  moveElementBetweenSections: (elementId, fromSectionId, toSectionId) => {
    get().removeElementFromSection(elementId, fromSectionId);
    get().addElementToSection(elementId, toSectionId);
    console.log('✅ [SECTION STORE] Moved element', elementId, 'from', fromSectionId, 'to', toSectionId);
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
    
    console.log('✅ [SECTION STORE] Section drag end:', sectionId, 'moved by', { deltaX, deltaY });
    
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
        console.log('✅ [SECTION STORE] Resized section:', sectionId, { newWidth, newHeight, scaleX, scaleY });
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
    console.log('✅ [SECTION STORE] Cleared all sections');
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
      // Skip if element is already in a section
      if (element.sectionId) return;
      
      // Check if element is within section bounds
      const elementX = element.x;
      const elementY = element.y;
      
      // For elements with width/height, check if any part overlaps
      const elementWidth = element.width || element.radius * 2 || 100;
      const elementHeight = element.height || element.radius * 2 || 100;
      
      const elementRight = elementX + elementWidth;
      const elementBottom = elementY + elementHeight;
      const sectionRight = section.x + section.width;
      const sectionBottom = section.y + section.height;
      
      // Check for overlap (any part of element within section)
      const isOverlapping = elementX < sectionRight && 
                           elementRight > section.x && 
                           elementY < sectionBottom && 
                           elementBottom > section.y;
      
      if (isOverlapping) {
        capturedElementIds.push(elementId);
        console.log('🎯 [SECTION STORE] Captured existing element:', elementId, {
          element: { x: elementX, y: elementY, width: elementWidth, height: elementHeight },
          section: { x: section.x, y: section.y, width: section.width, height: section.height }
        });
      }
    });
      // Add captured elements to the section
    if (capturedElementIds.length > 0) {
      set((state: Draft<SectionState>) => {
        const section = state.sections.get(sectionId);
        if (section) {
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
          
          // Add all elements to this section - Convert strings to ElementId
          const updatedSection = {
            ...section,
            childElementIds: capturedElementIds.map(id => ElementId(id))
          };
          state.sections.set(sectionId, updatedSection);
          console.log('✅ [SECTION STORE] Captured', capturedElementIds.length, 'elements in section:', sectionId);
        }
      });
    }
    
    return capturedElementIds;
  }
});
