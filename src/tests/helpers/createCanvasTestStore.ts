/**
 * Legacy Canvas Test Store - DEPRECATED
 * 
 * This file is deprecated in favor of the unified architecture.
 * New tests should use createUnifiedTestStore from './createUnifiedTestStore.ts'
 * 
 * Phase 1.2 Migration: This file now delegates to the unified test store factory
 */

import { createUnifiedTestStore } from './createUnifiedTestStore';

/**
 * @deprecated Use createUnifiedTestStore instead
 * This export maintains backward compatibility during Phase 1.2 migration
 */
export const createCanvasTestStore = createUnifiedTestStore;
