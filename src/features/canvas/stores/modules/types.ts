import { WritableDraft } from 'immer';
import { UnifiedCanvasStore } from '../unifiedCanvasStore';

/**
 * Base module interface for store modules
 */
export interface StoreModule<TState, TActions> {
  state: TState;
  actions: TActions;
}

/**
 * Store utilities for module creation
 * Using generic constraints to maintain type safety while allowing flexibility
 */
export type StoreSet = (fn: (draft: WritableDraft<UnifiedCanvasStore>) => void) => void;
export type StoreGet = () => UnifiedCanvasStore;

/**
 * Helper type for creating module factories
 */
export type ModuleFactory<TState, TActions> = (
  set: StoreSet,
  get: StoreGet
) => StoreModule<TState, TActions>;