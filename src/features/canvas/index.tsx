/**
 * Canvas Feature - Main Entry Point
 * Phase 5.1: Feature-Based Directory Structure
 * 
 * This is the main canvas feature component that orchestrates:
 * - Canvas rendering and interaction
 * - Layer management
 * - Element creation and manipulation
 * - Performance optimizations
 */

// Core Canvas Components
export { default as KonvaCanvas } from './components/KonvaCanvas';
export { default as KonvaAppRefactored } from './components/KonvaAppRefactored'; // Current implementation
export { default as CanvasSidebar } from './components/CanvasSidebar';
export { default as EnhancedTableElement } from './components/EnhancedTableElement';

// Text Editing Components
export { default as UnifiedTextEditor } from './components/UnifiedTextEditor';

// Layer exports
export * from './layers';

// Shape exports  
export * from './shapes';

// NO STORE EXPORTS - REMOVED: export { useCanvasStore, canvasStore } from './stores';

// Hook exports (specific to avoid conflicts)
// REMOVED: export { useCanvasEvents } from './hooks'; - doesn't exist

// Utility exports
export * from './utils';
