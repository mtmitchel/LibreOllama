// src/stores/index.ts
/**
 * Main store composition - re-exports from feature stores
 * Part of LibreOllama Canvas Architecture Enhancement - Phase 2
 */

// Re-export the main canvas store and its hooks from the feature module
export {
  useCanvasStore,
  type CanvasStoreState
} from '../features/canvas/stores';

// Import for local use
import { useCanvasStore, type CanvasStoreState } from '../features/canvas/stores';

// Legacy compatibility interface
export interface LibreOllamaCanvasStore extends CanvasStoreState {}

// Performance and debugging hooks
export const useCanvasState = () => useCanvasStore();
export const useCanvasActions = () => useCanvasStore((state) => ({
  // Element actions
  addElement: state.addElement,
  updateElement: state.updateElement,
  deleteElement: state.deleteElement,
  updateMultipleElements: state.updateMultipleElements,
  
  // Text actions (using correct method names from the actual store)
  // Note: Text editing methods are available through useTextEditing hook
  
  // Selection actions
  selectElement: state.selectElement,
  clearSelection: state.clearSelection,
  
  // Viewport actions
  setZoom: state.setZoom,
  setPan: state.setPan,
  
  // History actions
  undo: state.undo,
  redo: state.redo,
}));

export default useCanvasStore;
