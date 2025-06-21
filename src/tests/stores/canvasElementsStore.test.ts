// src/tests/stores/canvasElementsStore.test.ts
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock canvas module FIRST, before any other imports
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

import { createMockCanvasElement } from '../utils/testUtils';
import { RectangleElement, CircleElement } from '../../features/canvas/types/enhanced.types';

describe('canvasElementsStore (legacy)', () => {
  let store: any;

  beforeEach(async () => {
    // Use dynamic import to avoid canvas module loading issues
    const { createCanvasElementsStore } = await import('../../features/canvas/stores/slices/canvasElementsStore');
    store = createCanvasElementsStore();
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
      expect(state.elements.get(element.id)).toEqual(element);
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

      const updates = [
        { id: element1.id, updates: { x: 100, y: 200 } },
        { id: element2.id, updates: { x: 300, y: 400 } }
      ];

      store.getState().updateElements(updates);

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
