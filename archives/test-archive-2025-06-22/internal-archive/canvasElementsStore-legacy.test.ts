// src/tests/stores/canvasElementsStore.test.ts
import { describe, test, expect, beforeEach, vi } from 'vitest';

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
import { createMockCanvasElement } from '../utils/testUtils';
import { RectangleElement, CircleElement } from '../../features/canvas/types/enhanced.types';

// Dynamic import for store
let CanvasElementsStore: any;

describe('canvasElementsStore (legacy)', () => {
  let store: any;

  beforeEach(async () => {
    // Dynamically import the store to avoid canvas loading issues
    if (!CanvasElementsStore) {
      CanvasElementsStore = await import('../../features/canvas/stores/slices/canvasElementsStore');
    }
    
    store = create()(immer(CanvasElementsStore.createCanvasElementsStore));
  });

  describe('Element Management', () => {
    test('initializes with empty elements map', () => {
      expect(store.getState().elements).toEqual(new Map());
    });

    test('adds element correctly', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });

      store.getState().addElement(element);

      const state = store.getState();
      expect(state.elements.has(element.id)).toBe(true);
      
      const storedElement = state.elements.get(element.id);
      expect(storedElement).toBeDefined();
      expect(storedElement.id).toBe(element.id);
      expect(storedElement.type).toBe(element.type);
      expect(storedElement.x).toBe(element.x);
      expect(storedElement.y).toBe(element.y);
    });

    test('updates element properties', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });

      // Add the element first
      store.getState().addElement(element);

      const updates: Partial<RectangleElement> = { x: 200, y: 300, fill: '#00ff00' };
      store.getState().updateElement(element.id, updates);

      const updatedElement = store.getState().elements.get(element.id) as RectangleElement;
      expect(updatedElement.x).toBe(200);
      expect(updatedElement.y).toBe(300);
      expect(updatedElement.fill).toBe('#00ff00');
    });

    test('updates multiple elements in batch', () => {
      const element1 = createMockCanvasElement({ id: 'elem1', type: 'rectangle' });
      const element2 = createMockCanvasElement({ id: 'elem2', type: 'circle' });

      store.getState().addElement(element1);
      store.getState().addElement(element2);

      const updates = {
        'elem1': { x: 100, y: 200 },
        'elem2': { x: 300, y: 400 }
      };

      store.getState().updateMultipleElements(updates);

      const updatedElement1 = store.getState().elements.get(element1.id) as RectangleElement;
      const updatedElement2 = store.getState().elements.get(element2.id) as CircleElement;

      expect(updatedElement1.x).toBe(100);
      expect(updatedElement1.y).toBe(200);
      expect(updatedElement2.x).toBe(300);
      expect(updatedElement2.y).toBe(400);
    });

    test('deletes an element', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });
      store.getState().addElement(element);
      expect(store.getState().elements.has(element.id)).toBe(true);

      store.getState().deleteElement(element.id);
      expect(store.getState().elements.has(element.id)).toBe(false);
    });

    test('deletes multiple elements', () => {
      const element1 = createMockCanvasElement({ id: 'elem1' });
      const element2 = createMockCanvasElement({ id: 'elem2' });
      store.getState().addElement(element1);
      store.getState().addElement(element2);

      store.getState().deleteElements([element1.id, element2.id]);

      expect(store.getState().elements.has(element1.id)).toBe(false);
      expect(store.getState().elements.has(element2.id)).toBe(false);
    });
  });
});
