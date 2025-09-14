import type { CanvasSnapshot, StoreAdapter } from '../../modular/types';

type Unsubscribe = () => void;

export class StoreAdapterUnified implements StoreAdapter {
  get strokeConfig() {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      return store?.getState?.().strokeConfig;
    } catch {
      return null;
    }
  }

  subscribe(listener: () => void): Unsubscribe {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      console.log('[StoreAdapterUnified] Setting up subscription, store available:', !!store, 'subscribe method:', typeof store?.subscribe);
      if (store?.subscribe) {
        const wrappedListener = () => {
          console.log('[StoreAdapterUnified] Store changed - triggering listener');
          listener();
        };
        return store.subscribe(wrappedListener);
      }
    } catch (error) {
      console.error('[StoreAdapterUnified] Error setting up subscription:', error);
    }
    return () => {};
  }

  getSnapshot(): CanvasSnapshot {
    const empty: CanvasSnapshot = {
      elements: new Map(),
      selection: new Set(),
      viewport: { x: 0, y: 0, scale: 1 },
      history: {},
      edges: new Map(),
      draft: null,
    };
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const st = store?.getState?.();
      if (!st) {
        console.log('[StoreAdapterUnified] getSnapshot: No store state available');
        return empty;
      }
      const elements: Map<string, any> = st.elements instanceof Map ? st.elements : new Map();
      const selection: Set<string> = st.selectedElementIds instanceof Set ? st.selectedElementIds : new Set();
      const viewport = st.viewport || { x: 0, y: 0, scale: 1 };
      const history = { canUndo: !!st.canUndo, canRedo: !!st.canRedo };
      const edges: Map<string, any> = st.edges instanceof Map ? st.edges : new Map();
      const draft = st.draft || null;

      const snapshot = { elements, selection, viewport, history, edges, draft } as any;
      console.log('[StoreAdapterUnified] getSnapshot returning:', {
        elementsCount: elements.size,
        selectionCount: selection.size,
        textElements: Array.from(elements.values()).filter(el => el.type === 'text').length
      });
      return snapshot;
    } catch (error) {
      console.error('[StoreAdapterUnified] Error in getSnapshot:', error);
      return empty;
    }
  }

  selectElement(id: string | null, multi?: boolean): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().selectElement?.(id, !!multi);
    } catch {}
  }

  eraseAtPoint(x: number, y: number, eraserSize: number): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      console.log('[StoreAdapterUnified] Calling eraseAtPoint:', { x, y, eraserSize });

      // Explicit validation instead of optional chaining
      if (!store) {
        console.error('[StoreAdapterUnified] Store not available');
        return;
      }

      const state = store.getState();
      if (!state) {
        console.error('[StoreAdapterUnified] State not available');
        return;
      }

      if (typeof state.eraseAtPoint !== 'function') {
        console.error('[StoreAdapterUnified] eraseAtPoint method not available');
        return;
      }

      // Get shapes count before erase
      const shapesBefore = state.elements?.size || 0;
      console.log('[StoreAdapterUnified] Shapes before erase:', shapesBefore);

      // Call the actual erase method
      const result = state.eraseAtPoint(x, y, eraserSize);

      // Verify the update
      setTimeout(() => {
        const shapesAfter = store.getState().elements?.size || 0;
        console.log('[StoreAdapterUnified] Shapes after erase:', shapesBefore, '->', shapesAfter);
        console.log('[StoreAdapterUnified] Erased element IDs:', result);
      }, 0);

    } catch (error) {
      console.error('[StoreAdapterUnified] Error in eraseAtPoint:', error);
    }
  }

  eraseInPath(path: number[], eraserSize: number): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      console.log('[StoreAdapterUnified] Calling eraseInPath:', { pathLength: path.length / 2, eraserSize });
      store?.getState?.().eraseInPath?.(path, eraserSize);
    } catch (error) {
      console.error('[StoreAdapterUnified] Error in eraseInPath:', error);
    }
  }

  startDrawing(tool: 'pen' | 'pencil' | 'marker' | 'highlighter' | 'eraser', point: { x: number; y: number }): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().startDrawing?.(tool, point);
    } catch (error) {
      console.error('[StoreAdapterUnified] Error in startDrawing:', error);
    }
  }

  updateDrawing(point: { x: number; y: number }): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().updateDrawing?.(point);
    } catch (error) {
      console.error('[StoreAdapterUnified] Error in updateDrawing:', error);
    }
  }

  finishDrawing(): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().finishDrawing?.();
    } catch (error) {
      console.error('[StoreAdapterUnified] Error in finishDrawing:', error);
    }
  }

  addElementDrawing?(element: any): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().addElementDrawing?.(element);
    } catch (error) {
      console.error('[StoreAdapterUnified] Error in addElementDrawing:', error);
    }
  }
}


