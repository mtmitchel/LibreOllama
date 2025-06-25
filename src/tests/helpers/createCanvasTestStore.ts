import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { CanvasStoreState, createEnhancedCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';

enableMapSet();

/**
 * Creates a test-specific Zustand store that mirrors the application's real store structure.
 * It uses the same factory function as the production store to ensure all enhanced methods are available.
 */
export const createCanvasTestStore = () => createEnhancedCanvasStore();
