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
import { createCanvasStoreSlice } from '../../features/canvas/stores/unifiedCanvasStore';

enableMapSet();

/**
 * Creates a test-specific vanilla Zustand store that uses the actual unified canvas store implementation.
 * This ensures tests run against the real store logic.
 */
export const createUnifiedTestStore = () => {
  // Create a new store instance using the same slice creator
  return createStore(
    subscribeWithSelector(
      immer(createCanvasStoreSlice)
    )
  );
};

/**
 * Legacy compatibility export - gradually migrate tests to use createUnifiedTestStore
 * @deprecated Use createUnifiedTestStore instead
 */
export const createCanvasTestStore = createUnifiedTestStore;