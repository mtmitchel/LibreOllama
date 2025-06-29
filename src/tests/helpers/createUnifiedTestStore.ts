/**
 * Unified Test Store Factory - Phase 1.2 Completion
 * 
 * Replaces legacy createCanvasTestStore.ts with unified architecture support
 * Uses the production unifiedCanvasStore for authentic testing
 */

import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { UnifiedCanvasState } from '../../features/canvas/stores/unifiedCanvasStore';

enableMapSet();

/**
 * Creates a test-specific vanilla Zustand store that mirrors the unified canvas store.
 * This factory follows the same patterns as the production store to ensure
 * authentic test conditions without React hook dependencies.
 */
export const createUnifiedTestStore = () => {
  // Import the store factory function dynamically to avoid circular dependencies
  const { useUnifiedCanvasStore } = require('../../stores');
  
  // Create a vanilla store instance for testing
  return createStore<UnifiedCanvasState>()(
    subscribeWithSelector(
      immer(() => {
        // Get initial state from the production store
        const productionState = useUnifiedCanvasStore.getState();
        
        // Return clean initial state with same structure
        return {
          ...productionState,
          // Reset to clean test state
          elements: new Map(),
          elementOrder: [],
          selectedElementIds: new Set(),
          lastSelectedElementId: null,
          history: [],
          currentHistoryIndex: -1,
          sections: new Map(),
          sectionElementMap: new Map(),
        };
      })
    )
  );
};

/**
 * Legacy compatibility export - gradually migrate tests to use createUnifiedTestStore
 * @deprecated Use createUnifiedTestStore instead
 */
export const createCanvasTestStore = createUnifiedTestStore;