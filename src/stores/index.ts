// src/stores/index.ts
/**
 * Main application stores - single source of truth
 * This is the ONLY place that should export the canvas store to the rest of the app
 */

// Re-export the canvas store - THIS IS THE ONLY EXPORT OF useCanvasStore
export { useCanvasStore, canvasStore, type CanvasStoreState } from '../features/canvas/stores/canvasStore.enhanced';
