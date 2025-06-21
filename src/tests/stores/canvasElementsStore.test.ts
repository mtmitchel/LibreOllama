import { describe, test, expect, beforeEach } from '@jest/globals';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as CanvasElementsStore from '@/features/canvas/stores/slices/canvasElementsStore';
import { createMockCanvasElement } from '@/tests/utils/testUtils';
import {
  ElementId,
  RectangleElement,
} from '@/features/canvas/types/enhanced.types';

jest.unmock('@/features/canvas/stores/slices/canvasElementsStore');

const createTestStore = () =>
  create<CanvasElementsStore.CanvasElementsState>()(
    immer(CanvasElementsStore.createCanvasElementsStore),
  );

describe('canvasElementsStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Element Management', () => {
    test('initializes with empty elements map', () => {
      expect(store.getState().elements).toEqual(new Map());
    });

    test('adds element correctly', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });

      store.getState().addElement(element);

      const state = store.getState();
      expect(state.elements.get(element.id)).toEqual(
        expect.objectContaining(element),
      );
    });

    test('updates element properties', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });

      // Add the element first
      store.getState().addElement(element);

      const updates: Partial<RectangleElement> = { x: 200, y: 300, fill: '#00ff00' };
      store.getState().updateElement(element.id, updates);

      const updatedElement = store.getState().elements.get(element.id) as RectangleElement;
      expect(updatedElement).toBeDefined();
      expect(updatedElement.x).toBe(200);
      expect(updatedElement.y).toBe(300);
      expect(updatedElement.fill).toBe('#00ff00');
    });

    test('updates multiple elements in batch', () => {
      const element1 = createMockCanvasElement({ id: ElementId('elem1'), type: 'rectangle' });
      const element2 = createMockCanvasElement({ id: ElementId('elem2'), type: 'circle' });

      store.getState().addElement(element1);
      store.getState().addElement(element2);

      const updates = {
        [ElementId('elem1')]: { x: 100 },
        [ElementId('elem2')]: { radius: 75 },
      };

      store.getState().updateMultipleElements(updates as any);

      const state = store.getState();
      const updatedElement1 = state.elements.get(ElementId('elem1'));
      const updatedElement2 = state.elements.get(ElementId('elem2'));

      expect(updatedElement1).toBeDefined();
      expect(updatedElement2).toBeDefined();

      if (updatedElement1) {
        expect(updatedElement1.x).toBe(100);
      }
      if (updatedElement2 && 'radius' in updatedElement2) {
        expect(updatedElement2.radius).toBe(75);
      }
    });

    test('deletes an element', () => {
      const element = createMockCanvasElement({ type: 'rectangle' });
      store.getState().addElement(element);
      expect(store.getState().elements.has(element.id)).toBe(true);

      store.getState().deleteElement(element.id);
      expect(store.getState().elements.has(element.id)).toBe(false);
    });

    test('deletes multiple elements', () => {
      const element1 = createMockCanvasElement({ id: ElementId('elem1') });
      const element2 = createMockCanvasElement({ id: ElementId('elem2') });
      store.getState().addElement(element1);
      store.getState().addElement(element2);

      store.getState().deleteElements([ElementId('elem1'), ElementId('elem2')]);
      expect(store.getState().elements.size).toBe(0);
    });
  });
});
