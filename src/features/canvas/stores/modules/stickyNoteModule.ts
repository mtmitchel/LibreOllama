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
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get as any;

  return {
    state: {
      selectedStickyNoteColor: '#FFF2CC',
    },
    
    actions: {
      enableStickyNoteContainer: (stickyNoteId, options = {}) => {
        setState((state: any) => {
          const stickyNote = state.elements.get(stickyNoteId);
          if (stickyNote && stickyNote.type === 'sticky-note') {
            const updatedStickyNote = {
              ...stickyNote,
              isContainer: true,
              childElementIds: stickyNote.childElementIds || [],
              allowedChildTypes: options.allowedTypes || ['pen', 'marker', 'highlighter', 'text', 'rich-text', 'connector', 'image', 'table'],
              clipChildren: options.clipChildren ?? true,
              maxChildElements: options.maxChildren || 20
            };
            state.elements.setState(stickyNoteId, updatedStickyNote);
          }
        });
        getState().addToHistory('enableStickyNoteContainer');
      },

      addElementToStickyNote: (elementId, stickyNoteId) => {
        setState((state: any) => {
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
            state.elements.setState(stickyNoteId, updatedStickyNote);

            // Update element to reference its parent
            const updatedElement = {
              ...element,
              parentId: stickyNoteId,
              stickyNoteId: stickyNoteId
            };
            state.elements.setState(elementId, updatedElement);
          }
        });
        getState().addToHistory('addElementToStickyNote');
      },

      removeElementFromStickyNote: (elementId, stickyNoteId) => {
        setState((state: any) => {
          const stickyNote = state.elements.get(stickyNoteId);
          const element = state.elements.get(elementId);
          
          if (stickyNote && element && stickyNote.type === 'sticky-note') {
            // Update sticky note
            const updatedStickyNote = {
              ...stickyNote,
              childElementIds: (stickyNote.childElementIds || []).filter((id: ElementId) => id !== elementId)
            };
            state.elements.setState(stickyNoteId, updatedStickyNote);

            // Update element to remove parent reference
            const updatedElement = {
              ...element,
              parentId: undefined,
              stickyNoteId: undefined
            };
            state.elements.setState(elementId, updatedElement);
          }
        });
        getState().addToHistory('removeElementFromStickyNote');
      },

      findStickyNoteAtPoint: (point) => {
        const { elements } = getState();
        
        for (const [id, element] of elements) {
          if (element.type === 'sticky-note' && element.isContainer) {
            const withinBounds = point.x >= element.x && 
                                point.x <= element.x + element.width &&
                                point.y >= element.y && 
                                point.y <= element.y + element.height;
            
            if (withinBounds) {
              return id as ElementId;
            }
          }
        }
        
        return null;
      },

      isStickyNoteContainer: (stickyNoteId) => {
        const { elements } = getState();
        const stickyNote = elements.get(stickyNoteId);
        return stickyNote?.type === 'sticky-note' && stickyNote.isContainer === true;
      },

      getStickyNoteChildren: (stickyNoteId) => {
        const { elements } = getState();
        const stickyNote = elements.get(stickyNoteId);
        if (stickyNote?.type === 'sticky-note' && stickyNote.childElementIds) {
          return stickyNote.childElementIds
            .map((id: ElementId) => elements.get(id))
            .filter(Boolean) as CanvasElement[];
        }
        return [];
      },

      constrainElementToStickyNote: (elementId, stickyNoteId) => {
        setState((state: any) => {
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
              state.elements.setState(elementId, updatedElement);
            }
          }
        });
      },

      clearStickyNoteChildren: (stickyNoteId) => {
        const { getStickyNoteChildren, removeElementFromStickyNote } = getState();
        const children = getStickyNoteChildren(stickyNoteId);
        
        children.forEach((child: CanvasElement) => {
          removeElementFromStickyNote(child.id, stickyNoteId);
        });
        
        getState().addToHistory('clearStickyNoteChildren');
      },

      // Demo function for sticky note containers
      createStickyNoteContainerDemo: () => {
        const { addElement, enableStickyNoteContainer } = getState();
        
        // Creating sticky note container demo
        
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
          allowedChildTypes: ['pen', 'marker', 'highlighter', 'text', 'rich-text', 'connector', 'image', 'table'],
          clipChildren: true,
          maxChildElements: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isLocked: false,
          isHidden: false
        };
        
        addElement(stickyNote);
        
        // Created sticky note container
        
        // Test the detection
        setTimeout(() => {
          const testPoint = { x: 350, y: 275 }; // Center of sticky note
          const foundStickyNote = getState().findStickyNoteAtPoint(testPoint);
          // Testing detection at center point
        }, 100);
        
        return stickyNote.id;
      },
    },
  };
};