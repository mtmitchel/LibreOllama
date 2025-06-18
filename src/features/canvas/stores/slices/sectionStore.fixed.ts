// src/stores/slices/sectionStore.fixed.ts
/**
 * Section Store - FIXED VERSION
 * Handles section operations and containment without circular dependencies
 */

import { StateCreator } from 'zustand';
import { Draft } from 'immer';
import type { SectionElement } from '../../../../types/section';

export interface SectionState {
  // Section data
  sections: Record<string, SectionElement>;
  sectionOrder: string[];
  
  // Section operations
  createSection: (x: number, y: number, width?: number, height?: number, title?: string) => string;
  updateSection: (id: string, updates: Partial<SectionElement>) => void;
  deleteSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  
  // Element containment - basic operations that don't require element data
  addElementToSection: (elementId: string, sectionId: string) => void;
  removeElementFromSection: (elementId: string, sectionId: string) => void;
  moveElementBetweenSections: (elementId: string, fromSectionId: string, toSectionId: string) => void;
  getElementsInSection: (sectionId: string) => string[];
  getSectionForElement: (elementId: string) => string | null;
  
  // Section movement and resize
  handleSectionDragEnd: (sectionId: string, newX: number, newY: number) => { deltaX: number; deltaY: number; containedElementIds: string[] } | null;
  resizeSection: (sectionId: string, newWidth: number, newHeight: number) => { scaleX: number; scaleY: number; containedElementIds: string[] } | null;
  
  // Section queries
  getSectionById: (id: string) => SectionElement | null;
  getAllSections: () => SectionElement[];
  
  // Section utilities
  clearAllSections: () => void;
  isElementInAnySection: (elementId: string) => boolean;
  
  // NEW: Capture elements helper that will be called from the combined store
  captureElementsInSection: (sectionId: string, elementsInBounds: string[]) => void;
}

export const createSectionStore: StateCreator<
  SectionState,
  [['zustand/immer', never]],
  [],
  SectionState
> = (set, get) => ({
  // Initial state
  sections: {},
  sectionOrder: [],
  
  // Section operations
  createSection: (x, y, width = 400, height = 300, title = 'New Section') => {
    const sectionId = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const section: SectionElement = {
      id: sectionId,
      type: 'section',
      x,
      y,
      width,
      height,
      title,
      containedElementIds: [],
      isLocked: false,
      isHidden: false,
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef',
      borderWidth: 2,
      cornerRadius: 8,
      titleBarHeight: 32,
      titleFontSize: 14,
      titleColor: '#495057',
      opacity: 1
    };
    
    set((state: Draft<SectionState>) => {
      state.sections[sectionId] = section;
      state.sectionOrder.push(sectionId);
    });
    
    console.log('✅ [SECTION STORE] Created section:', sectionId, { x, y, width, height, title });
    return sectionId;
  },

  updateSection: (id, updates) => {
    set((state: Draft<SectionState>) => {
      if (state.sections[id]) {
        Object.assign(state.sections[id], updates);
        console.log('✅ [SECTION STORE] Updated section:', id, updates);
      }
    });
  },
  
  deleteSection: (id) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections[id];
      if (section) {
        // Note: Contained elements become free elements (handled by combined store)
        delete state.sections[id];
        state.sectionOrder = state.sectionOrder.filter(sId => sId !== id);
        console.log('✅ [SECTION STORE] Deleted section:', id, 'with', section.containedElementIds.length, 'contained elements');
      }
    });
  },
  
  duplicateSection: (id) => {
    const section = get().sections[id];
    if (section) {
      const newSectionId = get().createSection(
        section.x + 20,
        section.y + 20,
        section.width,
        section.height,
        section.title + ' Copy'
      );
      
      set((state: Draft<SectionState>) => {
        if (state.sections[newSectionId]) {
          state.sections[newSectionId].backgroundColor = section.backgroundColor;
          state.sections[newSectionId].borderColor = section.borderColor;
          state.sections[newSectionId].isLocked = section.isLocked;
          state.sections[newSectionId].isHidden = section.isHidden;
        }
      });
      
      console.log('✅ [SECTION STORE] Duplicated section:', id, 'to', newSectionId);
    }
  },
  
  // Element containment - simplified without element access
  addElementToSection: (elementId, sectionId) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections[sectionId];
      if (section && !section.containedElementIds.includes(elementId)) {
        // Remove element from any other section first
        Object.values(state.sections).forEach(s => {
          const index = s.containedElementIds.indexOf(elementId);
          if (index > -1) {
            s.containedElementIds.splice(index, 1);
          }
        });
        
        // Add to target section
        section.containedElementIds.push(elementId);
        console.log('✅ [SECTION STORE] Added element', elementId, 'to section', sectionId);
      }
    });
  },
  
  removeElementFromSection: (elementId, sectionId) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections[sectionId];
      if (section) {
        const index = section.containedElementIds.indexOf(elementId);
        if (index > -1) {
          section.containedElementIds.splice(index, 1);
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
    const section = get().sections[sectionId];
    return section ? [...section.containedElementIds] : [];
  },
  
  getSectionForElement: (elementId) => {
    const sections = get().sections;
    for (const sectionId in sections) {
      const section = sections[sectionId];
      if (section && section.containedElementIds.includes(elementId)) {
        return sectionId;
      }
    }
    return null;
  },
  
  // Section movement and resize
  handleSectionDragEnd: (sectionId, newX, newY) => {
    const section = get().sections[sectionId];
    if (!section) return null;
    
    const deltaX = newX - section.x;
    const deltaY = newY - section.y;
    
    set((state: Draft<SectionState>) => {
      // Update section position
      const section = state.sections[sectionId];
      if (section) {
        section.x = newX;
        section.y = newY;
      }
    });
    
    console.log('✅ [SECTION STORE] Section drag end:', sectionId, 'moved by', { deltaX, deltaY });
    
    // Return delta for element store to update contained elements
    return { deltaX, deltaY, containedElementIds: section.containedElementIds };
  },
  
  resizeSection: (sectionId, newWidth, newHeight) => {
    const section = get().sections[sectionId];
    if (!section) return null;
    
    const scaleX = newWidth / section.width;
    const scaleY = newHeight / section.height;
    
    set((state: Draft<SectionState>) => {
      const section = state.sections[sectionId];
      if (section) {
        section.width = newWidth;
        section.height = newHeight;
        console.log('✅ [SECTION STORE] Resized section:', sectionId, { newWidth, newHeight, scaleX, scaleY });
      }
    });
    
    // Return scale factors for proportional resizing of contained elements
    return { scaleX, scaleY, containedElementIds: section.containedElementIds };
  },
  
  // Section queries
  getSectionById: (id) => {
    return get().sections[id] || null;
  },
  
  getAllSections: () => {
    const { sections, sectionOrder } = get();
    return sectionOrder.map(id => sections[id]).filter((section): section is SectionElement => Boolean(section));
  },
  
  // Section utilities
  clearAllSections: () => {
    set((state: Draft<SectionState>) => {
      state.sections = {};
      state.sectionOrder = [];
    });
    console.log('✅ [SECTION STORE] Cleared all sections');
  },
  
  isElementInAnySection: (elementId) => {
    return get().getSectionForElement(elementId) !== null;
  },
  
  // NEW: Method to capture elements that are within section bounds
  captureElementsInSection: (sectionId: string, elementsInBounds: string[]) => {
    set((state: Draft<SectionState>) => {
      const section = state.sections[sectionId];
      if (section) {
        // Remove elements from other sections
        elementsInBounds.forEach(elementId => {
          Object.values(state.sections).forEach(s => {
            if (s.id !== sectionId) {
              const index = s.containedElementIds.indexOf(elementId);
              if (index > -1) {
                s.containedElementIds.splice(index, 1);
              }
            }
          });
        });
        
        // Add all elements to this section
        section.containedElementIds = elementsInBounds;
        console.log('✅ [SECTION STORE] Captured', elementsInBounds.length, 'elements in section:', sectionId);
      }
    });
  }
});