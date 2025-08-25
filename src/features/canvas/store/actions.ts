/**
 * Legacy actions - deprecated in favor of modular store actions
 * All canvas actions are now available through the unified store modules
 */

// Re-export the main store for backward compatibility
export { useUnifiedCanvasStore } from './useCanvasStore';
export type { UnifiedCanvasStore, UnifiedCanvasState, UnifiedCanvasActions } from './useCanvasStore';

// Re-export selectors
export { canvasSelectors } from './selectors/index';