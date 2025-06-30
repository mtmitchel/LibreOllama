/**
 * Real Store createElement Test
 * Tests the actual production createElement method from the unified store
 * This verifies the real implementation works correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useUnifiedCanvasStore } from '../features/canvas/stores/unifiedCanvasStore';

describe('Real Store createElement Method', () => {
  beforeEach(() => {
    // Clear store before each test
    useUnifiedCanvasStore.getState().clearAllElements();
    useUnifiedCanvasStore.getState().clearSelection();
  });

  afterEach(() => {
    // Clean up after each test
    useUnifiedCanvasStore.getState().clearAllElements();
    useUnifiedCanvasStore.getState().clearSelection();
  });

  it('should create rectangle elements correctly', () => {
    const store = useUnifiedCanvasStore;
    const initialSize = store.getState().elements.size;

    // Create rectangle using production method
    store.getState().createElement('rectangle', { x: 100, y: 100 });

    // Verify element was created
    const newState = store.getState();
    expect(newState.elements.size).toBe(initialSize + 1);

    // Get the created element
    const elements = Array.from(newState.elements.values());
    const rectangle = elements.find(el => el.type === 'rectangle');

    expect(rectangle).toBeDefined();
    expect(rectangle!.type).toBe('rectangle');
    expect(rectangle!.x).toBe(100);
    expect(rectangle!.y).toBe(100);
    expect(rectangle!.width).toBeDefined();
    expect(rectangle!.height).toBeDefined();
    expect(rectangle!.fill).toBeDefined();
    expect(rectangle!.createdAt).toBeDefined();
    expect(rectangle!.updatedAt).toBeDefined();
  });

  it('should create circle elements correctly', () => {
    const store = useUnifiedCanvasStore;
    
    store.getState().createElement('circle', { x: 200, y: 200 });

    const newState = store.getState();
    const elements = Array.from(newState.elements.values());
    const circle = elements.find(el => el.type === 'circle');

    expect(circle).toBeDefined();
    expect(circle!.type).toBe('circle');
    expect(circle!.x).toBe(200);
    expect(circle!.y).toBe(200);
    expect((circle as any).radius).toBeDefined();
    expect(circle!.fill).toBeDefined();
  });

  it('should create text elements correctly', () => {
    const store = useUnifiedCanvasStore;
    
    store.getState().createElement('text', { x: 50, y: 50 });

    const newState = store.getState();
    const elements = Array.from(newState.elements.values());
    const text = elements.find(el => el.type === 'text');

    expect(text).toBeDefined();
    expect(text!.type).toBe('text');
    expect(text!.x).toBe(50);
    expect(text!.y).toBe(50);
    expect((text as any).text).toBeDefined();
    expect((text as any).fontSize).toBeDefined();
    expect(text!.fill).toBeDefined();
  });

  it('should create sticky-note elements correctly', () => {
    const store = useUnifiedCanvasStore;
    
    store.getState().createElement('sticky-note', { x: 300, y: 300 });

    const newState = store.getState();
    const elements = Array.from(newState.elements.values());
    const stickyNote = elements.find(el => el.type === 'sticky-note');

    expect(stickyNote).toBeDefined();
    expect(stickyNote!.type).toBe('sticky-note');
    expect(stickyNote!.x).toBe(300);
    expect(stickyNote!.y).toBe(300);
    expect((stickyNote as any).text).toBeDefined();
    expect((stickyNote as any).backgroundColor).toBeDefined();
    expect((stickyNote as any).width).toBeDefined();
    expect((stickyNote as any).height).toBeDefined();
  });

  it('should create multiple different elements correctly', () => {
    const store = useUnifiedCanvasStore;
    
    // Create multiple element types
    store.getState().createElement('rectangle', { x: 0, y: 0 });
    store.getState().createElement('circle', { x: 100, y: 100 });
    store.getState().createElement('text', { x: 200, y: 200 });
    store.getState().createElement('sticky-note', { x: 300, y: 300 });

    const finalState = store.getState();
    expect(finalState.elements.size).toBe(4);

    // Verify all types exist
    const elements = Array.from(finalState.elements.values());
    const types = elements.map(el => el.type);
    
    expect(types).toContain('rectangle');
    expect(types).toContain('circle');
    expect(types).toContain('text');
    expect(types).toContain('sticky-note');

    // Verify positions are correct
    elements.forEach(element => {
      expect(element.x).toBeGreaterThanOrEqual(0);
      expect(element.y).toBeGreaterThanOrEqual(0);
      expect(element.createdAt).toBeTypeOf('number');
      expect(element.updatedAt).toBeTypeOf('number');
    });
  });

  it('should handle rapid element creation correctly', () => {
    const store = useUnifiedCanvasStore;
    
    // Create elements rapidly to test for race conditions
    for (let i = 0; i < 10; i++) {
      store.getState().createElement('rectangle', { x: i * 50, y: i * 50 });
    }

    const finalState = store.getState();
    expect(finalState.elements.size).toBe(10);

    // Verify all elements have unique IDs and correct positions
    const elements = Array.from(finalState.elements.values());
    const ids = elements.map(el => el.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(10); // All IDs should be unique
    
    elements.forEach((element, index) => {
      expect(element.x).toBe(index * 50);
      expect(element.y).toBe(index * 50);
      expect(element.type).toBe('rectangle');
    });
  });
});