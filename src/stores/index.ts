// src/stores/index.ts
/**
 * Main store composition - re-exports from feature stores
 * Part of LibreOllama Canvas Architecture Enhancement - Phase 2
 */

// Re-export the main canvas store and its hooks from the feature module
export {
  useCanvasStore,  type CanvasStoreState
} from '../features/canvas/stores/canvasStore.enhanced';

// Import for local use
import { useCanvasStore, type CanvasStoreState } from '../features/canvas/stores/canvasStore.enhanced';

// Legacy compatibility interface
export interface LibreOllamaCanvasStore extends CanvasStoreState {}

// Performance and debugging hooks
export const useCanvasState = () => useCanvasStore(state => state);

// Individual action selectors for React 19 compatibility - use these instead of useCanvasActions
// Note: Element and selection actions are provided by feature store slices to avoid conflicts
export const useUpdateMultipleElements = () => useCanvasStore(state => state.updateMultipleElements);
export const useSetZoom = () => useCanvasStore(state => state.setZoom);
export const useSetPan = () => useCanvasStore(state => state.setPan);

// Note: History actions are provided by canvasHistoryStore slice

export default useCanvasStore;
