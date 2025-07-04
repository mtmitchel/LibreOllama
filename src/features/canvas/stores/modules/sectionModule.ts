import { nanoid } from 'nanoid';
import { 
  SectionElement, 
  SectionId, 
  ElementId,
  CanvasElement 
} from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Section module state
 */
export interface SectionState {
  sections: Map<SectionId, SectionElement>;
  sectionElementMap: Map<SectionId, Set<ElementId>>;
}

/**
 * Section module actions
 */
export interface SectionActions {
  createSection: (x: number, y: number, width?: number, height?: number, title?: string) => SectionId;
  updateSection: (id: SectionId, updates: Partial<SectionElement>) => void;
  captureElementsInSection: (sectionId: SectionId) => void;
  deleteSection: (id: SectionId) => void;
  findSectionAtPoint: (point: { x: number; y: number }) => SectionId | null;
  addElementToSection: (elementId: ElementId, sectionId: SectionId) => void;
  updateElementCoordinatesOnSectionMove: (sectionId: SectionId, deltaX: number, deltaY: number) => void;
}

/**
 * Creates the section module
 */
export const createSectionModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<SectionState, SectionActions> => {
  const getElementCenter = (element: CanvasElement): { x: number; y: number } => {
    const width = (element as any).width ?? (element as any).radius * 2 ?? 0;
    const height = (element as any).height ?? (element as any).radius * 2 ?? 0;
    return {
      x: element.x + width / 2,
      y: element.y + height / 2,
    };
  };

  return {
    state: {
      sections: new Map(),
      sectionElementMap: new Map(),
    },
    
    actions: {
      createSection: (x, y, width = 400, height = 300, title = 'New Section') => {
        const newSectionId = nanoid() as SectionId;
        const newSection: SectionElement = {
          id: newSectionId,
          type: 'section',
          x,
          y,
          width,
          height,
          title,
          childElementIds: [],
          backgroundColor: 'rgba(240, 240, 240, 0.5)',
          borderColor: '#ccc',
          borderWidth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };

        set((state) => {
          const newSections = new Map(state.sections).set(newSectionId, newSection);
          const newElements = new Map(state.elements).set(newSectionId, newSection);
          const newElementOrder = [...state.elementOrder, newSectionId];
          const newSectionElementMap = new Map(state.sectionElementMap).set(newSectionId, new Set());
          
          return { 
            sections: newSections, 
            elements: newElements,
            elementOrder: newElementOrder,
            sectionElementMap: newSectionElementMap,
          };
        });

        get().captureElementsInSection(newSectionId);
        get().addToHistory('createSection');
        return newSectionId;
      },

      updateSection: (id, updates) => {
        set(state => {
          const section = state.sections.get(id);
          if (section) {
            const oldX = section.x;
            const oldY = section.y;

            Object.assign(section, updates);
            
            const deltaX = section.x - oldX;
            const deltaY = section.y - oldY;

            if (deltaX !== 0 || deltaY !== 0) {
              section.childElementIds.forEach((elementId: ElementId) => {
                const element = state.elements.get(elementId);
                if (element) {
                  element.x += deltaX;
                  element.y += deltaY;
                }
              });
            }

            // Also update the element representation
            const element = state.elements.get(id);
            if (element) {
              Object.assign(element, updates);
            }
          }
        });
        get().addToHistory('updateSection');
      },

      captureElementsInSection: (sectionId) => {
        const section = get().sections.get(sectionId);
        if (!section) return;

        const sectionBounds = {
          x1: section.x,
          y1: section.y,
          x2: section.x + section.width,
          y2: section.y + section.height,
        };

        set(state => {
          const childIds = new Set<ElementId>();
          for (const element of state.elements.values()) {
            if (element.type === 'section' || element.id === sectionId) continue;

            const elementCenter = getElementCenter(element);
            if (
              elementCenter.x >= sectionBounds.x1 &&
              elementCenter.x <= sectionBounds.x2 &&
              elementCenter.y >= sectionBounds.y1 &&
              elementCenter.y <= sectionBounds.y2
            ) {
              if (element.sectionId && element.sectionId !== sectionId) {
                const oldSection = state.sections.get(element.sectionId);
                if (oldSection) {
                  oldSection.childElementIds = oldSection.childElementIds.filter((id: ElementId) => id !== element.id);
                }
              }
              element.sectionId = sectionId;
              childIds.add(element.id as ElementId);
            }
          }
          const currentSection = state.sections.get(sectionId);
          if(currentSection) {
              currentSection.childElementIds = Array.from(childIds);
          }
        });
      },

      deleteSection: (id) => {
        set(state => {
          if (!state.sections.has(id)) return;
          
          // Release child elements
          const section = state.sections.get(id);
          if (section?.childElementIds) {
            section.childElementIds.forEach((childId: ElementId) => {
              const child = state.elements.get(childId);
              if (child) {
                child.sectionId = undefined;
              }
            });
          }

          state.sections.delete(id);
          state.elements.delete(id); // Also remove from elements map
          state.sectionElementMap.delete(id);
          state.elementOrder = state.elementOrder.filter((elId: ElementId | SectionId) => elId !== id);
          // Only delete from selectedElementIds if it's actually an ElementId, not a SectionId
          // state.selectedElementIds.delete(id as ElementId);
        });
        get().addToHistory('deleteSection');
      },

      findSectionAtPoint: (point) => {
        const { sections, elementOrder } = get();
        // Iterate backwards through elementOrder to find the top-most section
        for (let i = elementOrder.length - 1; i >= 0; i--) {
            const id = elementOrder[i] as SectionId;
            const section = sections.get(id);
            if (section &&
                point.x >= section.x &&
                point.x <= section.x + section.width &&
                point.y >= section.y &&
                point.y <= section.y + section.height) {
                return section.id;
            }
        }
        return null;
      },

      addElementToSection: (elementId, sectionId) => {
        set(state => {
          const section = state.sections.get(sectionId);
          const element = state.elements?.get(elementId);
          
          if (section && element) {
            // Add element to section's child list
            if (!section.childElementIds.includes(elementId)) {
              section.childElementIds.push(elementId);
            }
            
            // Update element's section reference
            if (state.elements) {
              const updatedElement = { ...element, sectionId };
              state.elements.set(elementId, updatedElement);
            }
          }
        });
      },

      updateElementCoordinatesOnSectionMove: (sectionId, deltaX, deltaY) => {
        set(state => {
          const section = state.sections.get(sectionId);
          if (section && state.elements) {
            section.childElementIds.forEach((elementId: ElementId) => {
              const element = state.elements?.get(elementId);
              if (element) {
                const updatedElement = {
                  ...element,
                  x: element.x + deltaX,
                  y: element.y + deltaY
                };
                state.elements.set(elementId, updatedElement);
              }
            });
          }
        });
      },
    },
  };
};