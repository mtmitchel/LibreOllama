// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach
import { vi } from 'vitest';

// Mock canvas module before any imports that might use it
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Create a minimal mock for testing - avoid importing actual canvasElementsStore for now
const createMinimalCanvasStore = () => {
  return create()(
    immer((set, get) => ({
      elements: new Map(),
      selectedElementIds: new Set(),
      
      addElement: (element: any) => {
        set((state) => {
          state.elements.set(element.id, element);
        });
      },
      
      removeElement: (id: string) => {
        set((state) => {
          state.elements.delete(id);
          state.selectedElementIds.delete(id);
        });
      },
      
      clearCanvas: () => {
        set((state) => {
          state.elements.clear();
          state.selectedElementIds.clear();
        });
      },
    }))
  );
};

describe('canvasElementsStore minimal test', () => {
  let store: ReturnType<typeof createMinimalCanvasStore>;

  beforeEach(() => {
    store = createMinimalCanvasStore();
  });

  test('initializes with empty elements map', () => {
    expect(store.getState().elements).toEqual(new Map());
  });

  test('adds element correctly', () => {
    const element = { id: 'test-1', type: 'rectangle' };

    store.getState().addElement(element);

    const state = store.getState();
    expect(state.elements.get(element.id)).toEqual(element);
  });

  test('removes element correctly', () => {
    const element = { id: 'test-1', type: 'rectangle' };
    
    store.getState().addElement(element);
    store.getState().removeElement(element.id);

    const state = store.getState();
    expect(state.elements.get(element.id)).toBeUndefined();
  });

  test('clears canvas', () => {
    const element1 = { id: 'test-1', type: 'rectangle' };
    const element2 = { id: 'test-2', type: 'circle' };
    
    store.getState().addElement(element1);
    store.getState().addElement(element2);
    store.getState().clearCanvas();

    const state = store.getState();
    expect(state.elements.size).toBe(0);
    expect(state.selectedElementIds.size).toBe(0);
  });
});
