/**
 * Store Adapter Module
 * Thin wrapper around Zustand store for the renderer
 * Provides a clean interface and enables easy testing
 */

import type { StoreApi } from 'zustand';
import type { ElementId, CanvasElement } from './types';

export interface StoreState {
  elements: Map<ElementId, CanvasElement>;
  selectedIds: Set<ElementId>;
  hoveredId: ElementId | null;
  isDragging: boolean;
  isTransforming: boolean;
}

export interface StoreActions {
  updateElement: (id: ElementId, updates: Partial<CanvasElement>) => void;
  batchUpdateElements: (updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>) => void;
  setSelectedIds: (ids: ElementId[]) => void;
  setHoveredId: (id: ElementId | null) => void;
  setDragging: (isDragging: boolean) => void;
  setTransforming: (isTransforming: boolean) => void;
}

export type Store = StoreState & StoreActions;

/**
 * Store adapter for renderer
 */
export class StoreAdapter {
  private store: StoreApi<Store> | null = null;
  private subscriptions = new Map<string, () => void>();

  /**
   * Connect to a Zustand store
   */
  connect(store: StoreApi<Store>): void {
    this.store = store;
  }

  /**
   * Disconnect from store
   */
  disconnect(): void {
    this.unsubscribeAll();
    this.store = null;
  }

  /**
   * Get element by ID
   */
  get(id: ElementId): CanvasElement | undefined {
    if (!this.store) return undefined;
    const state = this.store.getState();
    return state.elements.get(id);
  }

  /**
   * Get all elements
   */
  getAll(): CanvasElement[] {
    if (!this.store) return [];
    const state = this.store.getState();
    return Array.from(state.elements.values());
  }

  /**
   * Get elements by IDs
   */
  getMany(ids: ElementId[]): CanvasElement[] {
    if (!this.store) return [];
    const state = this.store.getState();
    return ids
      .map(id => state.elements.get(id))
      .filter((el): el is CanvasElement => el !== undefined);
  }

  /**
   * Update element
   */
  update(id: ElementId, updates: Partial<CanvasElement>): void {
    if (!this.store) return;
    this.store.getState().updateElement(id, updates);
  }

  /**
   * Batch update elements
   */
  batchUpdate(updates: Array<{ id: ElementId; updates: Partial<CanvasElement> }>): void {
    if (!this.store) return;
    this.store.getState().batchUpdateElements(updates);
  }

  /**
   * Get selected element IDs
   */
  getSelectedIds(): ElementId[] {
    if (!this.store) return [];
    const state = this.store.getState();
    return Array.from(state.selectedIds);
  }

  /**
   * Set selected element IDs
   */
  setSelectedIds(ids: ElementId[]): void {
    if (!this.store) return;
    this.store.getState().setSelectedIds(ids);
  }

  /**
   * Get hovered element ID
   */
  getHoveredId(): ElementId | null {
    if (!this.store) return null;
    return this.store.getState().hoveredId;
  }

  /**
   * Set hovered element ID
   */
  setHoveredId(id: ElementId | null): void {
    if (!this.store) return;
    this.store.getState().setHoveredId(id);
  }

  /**
   * Get drag state
   */
  isDragging(): boolean {
    if (!this.store) return false;
    return this.store.getState().isDragging;
  }

  /**
   * Set drag state
   */
  setDragging(isDragging: boolean): void {
    if (!this.store) return;
    this.store.getState().setDragging(isDragging);
  }

  /**
   * Get transform state
   */
  isTransforming(): boolean {
    if (!this.store) return false;
    return this.store.getState().isTransforming;
  }

  /**
   * Set transform state
   */
  setTransforming(isTransforming: boolean): void {
    if (!this.store) return;
    this.store.getState().setTransforming(isTransforming);
  }

  /**
   * Subscribe to store changes
   */
  subscribe<T>(
    selector: (state: Store) => T,
    callback: (value: T) => void,
    key?: string
  ): () => void {
    if (!this.store) return () => {};

    const unsubscribe = this.store.subscribe(
      (state) => callback(selector(state))
    );

    // Store subscription for cleanup
    const subKey = key || `sub_${Date.now()}_${Math.random()}`;
    this.subscriptions.set(subKey, unsubscribe);

    // Return unsubscribe function
    return () => {
      unsubscribe();
      this.subscriptions.delete(subKey);
    };
  }

  /**
   * Subscribe to element changes
   */
  subscribeToElement(
    id: ElementId,
    callback: (element: CanvasElement | undefined) => void
  ): () => void {
    return this.subscribe(
      (state) => state.elements.get(id),
      callback,
      `element_${id}`
    );
  }

  /**
   * Subscribe to selection changes
   */
  subscribeToSelection(
    callback: (selectedIds: ElementId[]) => void
  ): () => void {
    return this.subscribe(
      (state) => Array.from(state.selectedIds),
      callback,
      'selection'
    );
  }

  /**
   * Unsubscribe all subscriptions
   */
  private unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  /**
   * Get state snapshot (for testing)
   */
  getSnapshot(): StoreState | null {
    if (!this.store) return null;
    const state = this.store.getState();
    return {
      elements: new Map(state.elements),
      selectedIds: new Set(state.selectedIds),
      hoveredId: state.hoveredId,
      isDragging: state.isDragging,
      isTransforming: state.isTransforming
    };
  }
}

/**
 * Create a mock store for testing
 */
export function createMockStore(initialState?: Partial<StoreState>): StoreApi<Store> {
  const state: StoreState = {
    elements: new Map(),
    selectedIds: new Set(),
    hoveredId: null,
    isDragging: false,
    isTransforming: false,
    ...initialState
  };

  const listeners = new Set<(state: Store) => void>();

  const actions: StoreActions = {
    updateElement: (id, updates) => {
      const element = state.elements.get(id);
      if (element) {
        state.elements.set(id, { ...element, ...updates } as CanvasElement);
        notifyListeners();
      }
    },
    batchUpdateElements: (updates) => {
      updates.forEach(({ id, updates }) => {
        const element = state.elements.get(id);
        if (element) {
          state.elements.set(id, { ...element, ...updates } as CanvasElement);
        }
      });
      notifyListeners();
    },
    setSelectedIds: (ids) => {
      state.selectedIds = new Set(ids);
      notifyListeners();
    },
    setHoveredId: (id) => {
      state.hoveredId = id;
      notifyListeners();
    },
    setDragging: (isDragging) => {
      state.isDragging = isDragging;
      notifyListeners();
    },
    setTransforming: (isTransforming) => {
      state.isTransforming = isTransforming;
      notifyListeners();
    }
  };

  const notifyListeners = () => {
    const fullState = { ...state, ...actions };
    listeners.forEach(listener => listener(fullState));
  };

  return {
    getState: () => ({ ...state, ...actions }),
    setState: (partial) => {
      Object.assign(state, partial);
      notifyListeners();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => {
      listeners.clear();
    }
  } as StoreApi<Store>;
}