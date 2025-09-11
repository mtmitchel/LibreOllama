import type { CanvasSnapshot, StoreAdapter } from '../../modular/types';

type Unsubscribe = () => void;

export class StoreAdapterUnified implements StoreAdapter {
  subscribe(listener: () => void): Unsubscribe {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      if (store?.subscribe) return store.subscribe(listener);
    } catch {}
    return () => {};
  }

  getSnapshot(): CanvasSnapshot {
    const empty: CanvasSnapshot = {
      elements: new Map(),
      selection: new Set(),
      viewport: { x: 0, y: 0, scale: 1 },
      history: {},
      edges: new Map(),
    };
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const st = store?.getState?.();
      if (!st) return empty;
      const elements: Map<string, any> = st.elements instanceof Map ? st.elements : new Map();
      const selection: Set<string> = st.selectedElementIds instanceof Set ? st.selectedElementIds : new Set();
      const viewport = st.viewport || { x: 0, y: 0, scale: 1 };
      const history = { canUndo: !!st.canUndo, canRedo: !!st.canRedo };
      const edges: Map<string, any> = st.edges instanceof Map ? st.edges : new Map();
      return { elements, selection, viewport, history, edges } as any;
    } catch {
      return empty;
    }
  }

  selectElement(id: string | null, multi?: boolean): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().selectElement?.(id, !!multi);
    } catch {}
  }
}


