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
}

/**
 * UI module actions
 */
export interface UIActions {
  setSelectedTool: (tool: string) => void;
  setTextEditingElement: (id: ElementId | null) => void;
  setSelectedStickyNoteColor: (color: string) => void;
  setPenColor: (color: string) => void;
  
  // Legacy compatibility
  setStickyNoteColor: (color: string) => void;
  
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
    },
    
    actions: {
      setSelectedTool: (tool) => set({ selectedTool: tool }),

      setTextEditingElement: (id) => {
        // Log the state change for debugging
        const currentId = get().textEditingElementId;
        console.log('🎯 [Store] setTextEditingElement:', { from: currentId, to: id });
        
        // If we're setting a new element while another is being edited,
        // we need to ensure cleanup happens
        if (currentId && id && currentId !== id) {
          console.log('⚠️ [Store] Switching text editing from', currentId, 'to', id);
        }
        
        set({ textEditingElementId: id });
      },

      setSelectedStickyNoteColor: (color) => set({ selectedStickyNoteColor: color }),

      setPenColor: (color) => set({ penColor: color }),

      // Legacy compatibility
      setStickyNoteColor: (color) => set({ selectedStickyNoteColor: color }),

      // Utility methods
      uploadImage: async (file, position) => {
        // Implementation placeholder for image upload
        set({ isUploading: true });
        try {
          // Image upload logic would go here
          console.log('Image upload not implemented in module');
        } finally {
          set({ isUploading: false });
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