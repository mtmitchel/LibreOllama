// src/tests/canvas-store-simple.test.tsx
import { describe, test, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { createMockCanvasElement } from '@/tests/utils/testUtils';
import type { CanvasStoreState } from '@/features/canvas/stores/canvasStore.enhanced';

describe('Canvas Store - Simple Operations', () => {
  let store: ReturnType<typeof createCanvasStore>;

  beforeEach(() => {
    // Create a fresh store instance for each test
    store = createCanvasStore();
  });
  test('should add a single element correctly', () => {
    const element = createMockCanvasElement({ type: 'rectangle' });
    store.getState().addElement(element);
    expect(store.getState().elements.size).toBe(1);
    const addedElement = store.getState().elements.get(element.id);
    expect(addedElement).toBeDefined();
    expect(addedElement!.id).toBe(element.id);
    expect(addedElement!.type).toBe(element.type);
    expect(addedElement!.x).toBe(element.x);
    expect(addedElement!.y).toBe(element.y);
  });
    test('should update an element correctly', () => {
    const element = createMockCanvasElement({ type: 'rectangle' });
    store.getState().addElement(element);
    store.getState().updateElement(element.id, { fill: '#ff0000' });
    const updatedElement = store.getState().elements.get(element.id);
    expect(updatedElement && 'fill' in updatedElement ? updatedElement.fill : undefined).toBe('#ff0000');
  });

  test('should delete an element correctly', () => {
    const element = createMockCanvasElement({ type: 'rectangle' });
    store.getState().addElement(element);
    expect(store.getState().elements.size).toBe(1);
    store.getState().deleteElement(element.id);
    expect(store.getState().elements.size).toBe(0);
  });
});
