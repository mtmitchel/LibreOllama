import { ElementId } from '../../types/enhanced.types';
import { StoreModule, StoreSet, StoreGet } from './types';

/**
 * UI module state
 */
export interface UIState {
  selectedTool: string;
  textEditingElementId: ElementId | null;
  selectedStickyNoteColor: string;
  penColor: string;
  showGrid: boolean;
  snapToGrid: boolean;
  isUploading: boolean;
  snapLines: number[]; // Added snapLines state
  visibleElementIds: Set<ElementId>;
}

/**
 * UI module actions
 */
export interface UIActions {
  setSelectedTool: (tool: string) => void;
  setTextEditingElement: (id: ElementId | null) => void;
  setSelectedStickyNoteColor: (color: string) => void;
  setPenColor: (color: string) => void;
  setSnapLines: (lines: number[]) => void; // Added setSnapLines action
  setVisibleElementIds: (ids: Set<ElementId>) => void;
  
  // Legacy compatibility
  setStickyNoteColor: (color: string) => void;
  setActiveTool: (tool: string) => void;
  
  // Utility methods
  uploadImage: (file: File, position: { x: number; y: number }) => Promise<void>;
  findNearestSnapPoint: (pointer: { x: number; y: number }, snapRadius?: number) => any;
  toggleLayersPanel: () => void;
}

/**
 * Creates the UI module
 */
export const createUIModule = (
  set: StoreSet,
  get: StoreGet
): StoreModule<UIState, UIActions> => {
  // Cast the set and get functions to work with any state for flexibility
  const setState = set as any;
  const getState = get as any;

  return {
    state: {
      selectedTool: 'select',
      textEditingElementId: null,
      selectedStickyNoteColor: '#FFF2CC',
      penColor: '#000000',
      showGrid: true,
      snapToGrid: false,
      isUploading: false,
      snapLines: [], // Initialize snapLines
      visibleElementIds: new Set<ElementId>(),
    },
    
    actions: {
      setSelectedTool: (tool) => setState((state: any) => { state.selectedTool = tool; }),

      setTextEditingElement: (id) => {
        // Log the state change for debugging in development
        if (process.env.NODE_ENV === 'development') {
          const currentId = getState().textEditingElementId;
          // Removed excessive logging
          
          // If we're setting a new element while another is being edited,
          // we need to ensure cleanup happens
          if (currentId && id && currentId !== id) {
            // Switching text editing focus
          }
        }
        
        setState((state: any) => { state.textEditingElementId = id; });
      },

      setSelectedStickyNoteColor: (color) => setState((state: any) => { state.selectedStickyNoteColor = color; }),

      setPenColor: (color) => setState((state: any) => { state.penColor = color; }),

      setSnapLines: (lines) => setState((state: any) => { state.snapLines = lines; }), // Added implementation for setSnapLines

      setVisibleElementIds: (ids) => setState((state: any) => { state.visibleElementIds = ids; }),

      // Legacy compatibility
      setStickyNoteColor: (color) => setState((state: any) => { state.selectedStickyNoteColor = color; }),
      setActiveTool: (tool) => setState((state: any) => { state.selectedTool = tool; }),

      // Utility methods
      uploadImage: async (file, position) => {
        setState((state: any) => { state.isUploading = true; });
        try {
          // Create image element from uploaded file
          const imageUrl = URL.createObjectURL(file);
          const imageElement = {
            id: `image-${Date.now()}`,
            type: 'image',
            x: position.x,
            y: position.y,
            width: 200,
            height: 150,
            src: imageUrl,
            draggable: true,
            visible: true,
          };
          getState().addElement(imageElement);
        } finally {
          setState((state: any) => { state.isUploading = false; });
        }
      },

      findNearestSnapPoint: (pointer, snapRadius) => {
        // Implementation placeholder for snap point finding
        return {};
      },

      toggleLayersPanel: () => {
        // Implementation placeholder for layers panel toggle
      },
    },
  };
};