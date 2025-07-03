import { nanoid } from 'nanoid';
import { 
  ElementId,
  CanvasElement,
  StickyNoteElement 
} from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * Sticky Note module state
 */
export interface StickyNoteState {
  selectedStickyNoteColor: string;
}

/**
 * Sticky Note module actions
 */
export interface StickyNoteActions {
  enableStickyNoteContainer: (stickyNoteId: ElementId, options?: { allowedTypes?: string[]; clipChildren?: boolean; maxChildren?: number }) => void;
  addElementToStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  removeElementFromStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  findStickyNoteAtPoint: (point: { x: number; y: number }) => ElementId | null;
  isStickyNoteContainer: (stickyNoteId: ElementId) => boolean;
  getStickyNoteChildren: (stickyNoteId: ElementId) => CanvasElement[];
  constrainElementToStickyNote: (elementId: ElementId, stickyNoteId: ElementId) => void;
  clearStickyNoteChildren: (stickyNoteId: ElementId) => void;
  createStickyNoteContainerDemo: () => ElementId;
}

/**
 * Creates the sticky note module
 */
export const createStickyNoteModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<StickyNoteState, StickyNoteActions> => {
  return {
    state: {
      selectedStickyNoteColor: '#FFF2CC',
    },
    
    actions: {
      enableStickyNoteContainer: (stickyNoteId, options = {}) => {
        set(state => {
          const stickyNote = state.elements.get(stickyNoteId);
          if (stickyNote && stickyNote.type === 'sticky-note') {
            const updatedStickyNote = {
              ...stickyNote,
              isContainer: true,
              childElementIds: stickyNote.childElementIds || [],
              allowedChildTypes: options.allowedTypes || ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
              clipChildren: options.clipChildren ?? true,
              maxChildElements: options.maxChildren || 20
            };
            state.elements.set(stickyNoteId, updatedStickyNote);
          }
        });
        get().addToHistory('enableStickyNoteContainer');
      },

      addElementToStickyNote: (elementId, stickyNoteId) => {
        set(state => {
          const stickyNote = state.elements.get(stickyNoteId);
          const element = state.elements.get(elementId);
          
          if (stickyNote && element && stickyNote.type === 'sticky-note') {
            // Ensure sticky note is a container
            if (!stickyNote.isContainer) {
              return; // Don't add if not enabled as container
            }

            // Check allowed types
            if (stickyNote.allowedChildTypes && !stickyNote.allowedChildTypes.includes(element.type)) {
              console.warn(`Element type ${element.type} not allowed in sticky note ${stickyNoteId}`);
              return;
            }

            // Check max elements limit
            const currentChildCount = stickyNote.childElementIds?.length || 0;
            if (stickyNote.maxChildElements && currentChildCount >= stickyNote.maxChildElements) {
              console.warn(`Sticky note ${stickyNoteId} has reached maximum child elements limit`);
              return;
            }

            // Update sticky note
            const updatedStickyNote = {
              ...stickyNote,
              childElementIds: [...(stickyNote.childElementIds || []), elementId]
            };
            state.elements.set(stickyNoteId, updatedStickyNote);

            // Update element to reference its parent
            const updatedElement = {
              ...element,
              parentId: stickyNoteId,
              stickyNoteId: stickyNoteId
            };
            state.elements.set(elementId, updatedElement);
          }
        });
        get().addToHistory('addElementToStickyNote');
      },

      removeElementFromStickyNote: (elementId, stickyNoteId) => {
        set(state => {
          const stickyNote = state.elements.get(stickyNoteId);
          const element = state.elements.get(elementId);
          
          if (stickyNote && element && stickyNote.type === 'sticky-note') {
            // Update sticky note
            const updatedStickyNote = {
              ...stickyNote,
              childElementIds: (stickyNote.childElementIds || []).filter(id => id !== elementId)
            };
            state.elements.set(stickyNoteId, updatedStickyNote);

            // Update element to remove parent reference
            const updatedElement = {
              ...element,
              parentId: undefined,
              stickyNoteId: undefined
            };
            state.elements.set(elementId, updatedElement);
          }
        });
        get().addToHistory('removeElementFromStickyNote');
      },

      findStickyNoteAtPoint: (point) => {
        const { elements } = get();
        console.log('🔍 [findStickyNoteAtPoint] Searching for sticky note at point:', point);
        
        for (const [id, element] of elements) {
          if (element.type === 'sticky-note' && element.isContainer) {
            const withinBounds = point.x >= element.x && 
                                point.x <= element.x + element.width &&
                                point.y >= element.y && 
                                point.y <= element.y + element.height;
            
            console.log('🔍 [findStickyNoteAtPoint] Checking sticky note:', {
              id,
              point,
              elementBounds: { x: element.x, y: element.y, width: element.width, height: element.height },
              withinBounds,
              isContainer: element.isContainer
            });
            
            if (withinBounds) {
              console.log('✅ [findStickyNoteAtPoint] Found sticky note container:', id);
              return id as ElementId;
            }
          }
        }
        
        console.log('❌ [findStickyNoteAtPoint] No sticky note container found at point');
        return null;
      },

      isStickyNoteContainer: (stickyNoteId) => {
        const { elements } = get();
        const stickyNote = elements.get(stickyNoteId);
        return stickyNote?.type === 'sticky-note' && stickyNote.isContainer === true;
      },

      getStickyNoteChildren: (stickyNoteId) => {
        const { elements } = get();
        const stickyNote = elements.get(stickyNoteId);
        if (stickyNote?.type === 'sticky-note' && stickyNote.childElementIds) {
          return stickyNote.childElementIds
            .map(id => elements.get(id))
            .filter(Boolean) as CanvasElement[];
        }
        return [];
      },

      constrainElementToStickyNote: (elementId, stickyNoteId) => {
        set(state => {
          const stickyNote = state.elements.get(stickyNoteId);
          const element = state.elements.get(elementId);
          
          if (stickyNote && element && stickyNote.type === 'sticky-note' && stickyNote.clipChildren) {
            const padding = 10; // Leave some padding from edges
            
            // Constrain position to sticky note bounds
            const constrainedX = Math.max(
              stickyNote.x + padding,
              Math.min(element.x, stickyNote.x + stickyNote.width - (element.width || 0) - padding)
            );
            
            const constrainedY = Math.max(
              stickyNote.y + padding,
              Math.min(element.y, stickyNote.y + stickyNote.height - (element.height || 0) - padding)
            );

            if (constrainedX !== element.x || constrainedY !== element.y) {
              const updatedElement = {
                ...element,
                x: constrainedX,
                y: constrainedY
              };
              state.elements.set(elementId, updatedElement);
            }
          }
        });
      },

      clearStickyNoteChildren: (stickyNoteId) => {
        const { getStickyNoteChildren, removeElementFromStickyNote } = get();
        const children = getStickyNoteChildren(stickyNoteId);
        
        children.forEach(child => {
          removeElementFromStickyNote(child.id, stickyNoteId);
        });
        
        get().addToHistory('clearStickyNoteChildren');
      },

      // Demo function for sticky note containers
      createStickyNoteContainerDemo: () => {
        const { addElement, enableStickyNoteContainer } = get();
        
        console.log('✨ [Demo] Creating sticky note container demo...');
        
        // Create a sticky note
        const stickyNote: StickyNoteElement = {
          id: nanoid() as ElementId,
          type: 'sticky-note',
          x: 200,
          y: 150,
          width: 300,
          height: 250,
          text: 'Container Demo\n\nTry drawing on this sticky note!',
          backgroundColor: '#FFF2CC',
          textColor: '#1F2937',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          isContainer: true,
          childElementIds: [],
          allowedChildTypes: ['pen', 'marker', 'highlighter', 'text', 'connector', 'image', 'table'],
          clipChildren: true,
          maxChildElements: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };
        
        addElement(stickyNote);
        
        console.log('✨ [Demo] Created sticky note container:', {
          id: stickyNote.id,
          position: { x: stickyNote.x, y: stickyNote.y },
          size: { width: stickyNote.width, height: stickyNote.height },
          isContainer: stickyNote.isContainer,
          allowedTypes: stickyNote.allowedChildTypes
        });
        
        // Test the detection
        setTimeout(() => {
          const testPoint = { x: 350, y: 275 }; // Center of sticky note
          const foundStickyNote = get().findStickyNoteAtPoint(testPoint);
          console.log('🧪 [Demo] Testing detection at center point:', testPoint, 'Found:', foundStickyNote);
        }, 100);
        
        return stickyNote.id;
      },
    },
  };
};