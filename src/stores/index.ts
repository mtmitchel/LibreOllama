// src/stores/index.ts
/**
 * Main application stores - single source of truth
 * This is the ONLY place that should export the canvas store to the rest of the app
 * 
 * PHASE 2: Direct unified store export - adapter pattern removed
 */

// Import the unified store for convenience hooks
import { 
  useUnifiedCanvasStore, 
  canvasSelectors 
} from '../features/canvas/stores/unifiedCanvasStore';

// Export unified store directly as the main canvas store
export { 
  useUnifiedCanvasStore as useCanvasStore,
  useUnifiedCanvasStore, // Also export with original name for components still importing it
  canvasSelectors 
} from '../features/canvas/stores/unifiedCanvasStore';

export type { 
  UnifiedCanvasStore as CanvasStoreState,
  UnifiedCanvasState,
  UnifiedCanvasStore
} from '../features/canvas/stores/unifiedCanvasStore';

// Convenience selector hooks
export const useCanvasElements = () => useUnifiedCanvasStore(canvasSelectors.elements);
export const useSelectedElements = () => useUnifiedCanvasStore(canvasSelectors.selectedElements);
export const useSelectedElementIds = () => useUnifiedCanvasStore(canvasSelectors.selectedElementIds);
export const useSelectedTool = () => useUnifiedCanvasStore(canvasSelectors.selectedTool);
export const useViewport = () => useUnifiedCanvasStore(canvasSelectors.viewport);

// Direct access to store instance
export const canvasStore = {
  getState: () => useUnifiedCanvasStore.getState(),
  setState: useUnifiedCanvasStore.setState,
  subscribe: useUnifiedCanvasStore.subscribe
};

// Legacy compatibility hooks
export const useCanvasEventHandler = () => useUnifiedCanvasStore(state => state.eventHandler);
