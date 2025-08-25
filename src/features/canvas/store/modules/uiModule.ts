import { ElementId, SnapLine } from '../../types/enhanced.types';
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
  snapLines: SnapLine[]; // Alignment/snapping guide lines
}

/**
 * UI module actions
 */
export interface UIActions {
  setSelectedTool: (tool: string) => void;
  setTextEditingElement: (id: ElementId | null) => void;
  setSelectedStickyNoteColor: (color: string) => void;
  setPenColor: (color: string) => void;
  setSnapLines: (lines: SnapLine[]) => void; // Set alignment guides
  
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
      // Prevent overlay from closing during initial placement
      blockOutsideClicks: false as any,
    },
    
    actions: {
      setSelectedTool: (tool) => set(state => { state.selectedTool = tool; }),
      setBlockOutsideClicks: (block: boolean) => set(state => { (state as any).blockOutsideClicks = block; }),

      setTextEditingElement: (id) => {
        // Log the state change for debugging in development
        if (process.env.NODE_ENV === 'development') {
          const currentId = get().textEditingElementId;
          console.log('🎯 [Store] setTextEditingElement:', { from: currentId, to: id });
          
          // If we're setting a new element while another is being edited,
          // we need to ensure cleanup happens
          if (currentId && id && currentId !== id) {
            console.log('⚠️ [Store] Switching text editing from', currentId, 'to', id);
          }
        }
        
        set(state => { state.textEditingElementId = id; });
      },

      setSelectedStickyNoteColor: (color) => set(state => { state.selectedStickyNoteColor = color; }),

      setPenColor: (color) => set(state => { state.penColor = color; }),

      setSnapLines: (lines) => set(state => { state.snapLines = lines; }),

      // Legacy compatibility
      setStickyNoteColor: (color) => set(state => { state.selectedStickyNoteColor = color; }),
      setActiveTool: (tool) => set(state => { state.selectedTool = tool; }),

      // Utility methods
      uploadImage: async (file, position) => {
        set(state => { state.isUploading = true; });
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
          get().addElement(imageElement);
        } finally {
          set(state => { state.isUploading = false; });
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