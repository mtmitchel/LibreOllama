/**
 * Base module interface for store modules
 */
export interface StoreModule<TState, TActions> {
  state: TState;
  actions: TActions;
}

/**
 * Store utilities for module creation
 */
export type StoreSet = (fn: (state: any) => void) => void;
export type StoreGet = () => any;

/**
 * Helper type for creating module factories
 */
export type ModuleFactory<TState, TActions> = (
  set: StoreSet,
  get: StoreGet
) => StoreModule<TState, TActions>;