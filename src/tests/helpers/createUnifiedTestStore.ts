/**
 * Test Store Factory for Unified Canvas Store
 * 
 * Creates isolated test instances of the unified canvas store for testing.
 * Replaces legacy createCanvasTestStore.ts with unified architecture support.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { createCanvasStoreSlice } from '@/features/canvas/stores/unifiedCanvasStore';
import type { UnifiedCanvasStore } from '@/features/canvas/stores/unifiedCanvasStore';

// Enable Map and Set support for Immer
enableMapSet();

/**
 * Creates a fresh instance of the unified canvas store for testing.
 * Each call returns a completely isolated store instance.
 */
export function createUnifiedTestStore() {
  return create<UnifiedCanvasStore>()(
    subscribeWithSelector(
      immer(createCanvasStoreSlice)
    )
  );
}

/**
 * Legacy compatibility export - gradually migrate tests to use createUnifiedTestStore
 * @deprecated Use createUnifiedTestStore instead
 */
export const createCanvasTestStore = createUnifiedTestStore; 