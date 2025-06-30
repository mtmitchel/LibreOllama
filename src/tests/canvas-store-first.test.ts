/**
 * Canvas Store-First Testing Example
 * 
 * This test demonstrates the preferred testing approach using real store instances
 * instead of mocks, following our testing philosophy.
 * 
 * Key Principles Demonstrated:
 * 1. Real store instances using createUnifiedTestStore()
 * 2. Direct testing of business logic through store methods
 * 3. Minimal external mocking (only for browser APIs)
 * 4. Focused, deterministic test cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import type { RectangleElement, CircleElement, TextElement } from '@/features/canvas/types/enhanced.types';

// Example: Store-First Canvas Testing
describe('Canvas Store-First Testing Examples', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    // ✅ GOOD: Use real store instance for each test
    store = createUnifiedTestStore();
  });

  describe('Element Management', () => {
    it('should add and retrieve elements correctly', () => {
      // ✅ Test business logic directly through store methods
      const rectangle: RectangleElement = {
        id: 'rect-1' as any,
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Test addition
      store.getState().addElement(rectangle);
      
      // Test retrieval
      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(rectangle.id)).toEqual(rectangle);
      expect(store.getState().elementOrder).toContain(rectangle.id);
    });

    it('should update element properties', () => {
      const circle: CircleElement = {
        id: 'circle-1' as any,
        type: 'circle',
        x: 50,
        y: 50,
        radius: 25,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(circle);
      
      // Test update
      const updates = { x: 75, y: 75, radius: 30 };
      store.getState().updateElement(circle.id, updates);
      
      const updatedCircle = store.getState().elements.get(circle.id);
      expect(updatedCircle).toMatchObject({
        ...circle,
        ...updates
      });
    });

    it('should delete elements correctly', () => {
      const text: TextElement = {
        id: 'text-1' as any,
        type: 'text',
        x: 200,
        y: 200,
        text: 'Test Text',
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#000000',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(text);
      expect(store.getState().elements.size).toBe(1);
      
      // Test deletion
      store.getState().deleteElement(text.id);
      
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(text.id)).toBe(false);
      expect(store.getState().elementOrder).not.toContain(text.id);
    });
  });

  describe('Selection Management', () => {
    it('should handle single element selection', () => {
      const rectangle: RectangleElement = {
        id: 'rect-select' as any,
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#blue',
        stroke: '#black',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(rectangle);
      
      // Test selection
      store.getState().selectElement(rectangle.id);
      
      expect(store.getState().selectedElementIds.has(rectangle.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(rectangle.id);
    });

    it('should handle multiple element selection', () => {
      const rect1: RectangleElement = {
        id: 'rect-1' as any,
        type: 'rectangle',
        x: 0, y: 0, width: 50, height: 50,
        fill: '#red', stroke: '#black', strokeWidth: 1,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      const rect2: RectangleElement = {
        id: 'rect-2' as any,
        type: 'rectangle',
        x: 100, y: 100, width: 50, height: 50,
        fill: '#blue', stroke: '#black', strokeWidth: 1,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      store.getState().addElement(rect1);
      store.getState().addElement(rect2);
      
      // Test multiple selection
      store.getState().selectMultipleElements([rect1.id, rect2.id]);
      
      expect(store.getState().selectedElementIds.size).toBe(2);
      expect(store.getState().selectedElementIds.has(rect1.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(rect2.id)).toBe(true);
    });

    it('should clear selection correctly', () => {
      const element: CircleElement = {
        id: 'circle-clear' as any,
        type: 'circle',
        x: 50, y: 50, radius: 25,
        fill: '#green', stroke: '#black', strokeWidth: 1,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      store.getState().addElement(element);
      store.getState().selectElement(element.id);
      
      expect(store.getState().selectedElementIds.size).toBe(1);
      
      // Test clear selection
      store.getState().clearSelection();
      
      expect(store.getState().selectedElementIds.size).toBe(0);
      expect(store.getState().lastSelectedElementId).toBe(null);
    });
  });

  describe('Tool Management', () => {
    it('should switch tools correctly', () => {
      expect(store.getState().selectedTool).toBe('select');
      
      store.getState().setSelectedTool('rectangle');
      expect(store.getState().selectedTool).toBe('rectangle');
      
      store.getState().setSelectedTool('circle');
      expect(store.getState().selectedTool).toBe('circle');
      
      store.getState().setSelectedTool('text');
      expect(store.getState().selectedTool).toBe('text');
    });

    it('should maintain available tools list', () => {
      const availableTools = store.getState().availableTools;
      
      expect(availableTools).toContain('select');
      expect(availableTools).toContain('rectangle');
      expect(availableTools).toContain('circle');
      expect(availableTools).toContain('text');
      expect(availableTools).toContain('pen');
      expect(availableTools).toContain('section');
    });
  });

  describe('Viewport Management', () => {
    it('should update viewport properties', () => {
      const initialViewport = store.getState().viewport;
      expect(initialViewport.scale).toBe(1);
      expect(initialViewport.x).toBe(0);
      expect(initialViewport.y).toBe(0);
      
      // Test viewport updates
      store.getState().setViewport({ 
        scale: 1.5, 
        x: 100, 
        y: 50 
      });
      
      const updatedViewport = store.getState().viewport;
      expect(updatedViewport.scale).toBe(1.5);
      expect(updatedViewport.x).toBe(100);
      expect(updatedViewport.y).toBe(50);
    });

    it('should handle zoom operations', () => {
      expect(store.getState().viewport.scale).toBe(1);
      
      store.getState().zoomIn();
      expect(store.getState().viewport.scale).toBeGreaterThan(1);
      
      const scaleBefore = store.getState().viewport.scale;
      store.getState().zoomOut();
      expect(store.getState().viewport.scale).toBeLessThan(scaleBefore);
    });
  });

  describe('Complex Workflows', () => {
    it('should handle create-select-modify-delete workflow', () => {
      // Create element
      const element: RectangleElement = {
        id: 'workflow-rect' as any,
        type: 'rectangle',
        x: 10, y: 10, width: 100, height: 100,
        fill: '#purple', stroke: '#black', strokeWidth: 2,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      store.getState().addElement(element);
      expect(store.getState().elements.size).toBe(1);
      
      // Select element
      store.getState().selectElement(element.id);
      expect(store.getState().selectedElementIds.has(element.id)).toBe(true);
      
      // Modify element
      store.getState().updateElement(element.id, { 
        x: 50, 
        y: 50, 
        fill: '#orange' 
      });
      
      const modifiedElement = store.getState().elements.get(element.id);
      expect(modifiedElement?.x).toBe(50);
      expect(modifiedElement?.y).toBe(50);
      expect((modifiedElement as any)?.fill).toBe('#orange');
      
      // Delete element
      store.getState().deleteElement(element.id);
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().selectedElementIds.size).toBe(0);
    });

    it('should handle multi-element operations', () => {
      // Create multiple elements
      const elements = [
        { id: 'multi-1' as any, type: 'rectangle' as const, x: 0, y: 0, width: 50, height: 50 },
        { id: 'multi-2' as any, type: 'circle' as const, x: 100, y: 100, radius: 25 },
        { id: 'multi-3' as any, type: 'text' as const, x: 200, y: 200, text: 'Test' }
      ].map(base => ({
        ...base,
        fill: '#gray',
        stroke: '#black',
        strokeWidth: 1,
        fontSize: base.type === 'text' ? 14 : undefined,
        fontFamily: base.type === 'text' ? 'Arial' : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      elements.forEach(element => {
        store.getState().addElement(element as any);
      });
      
      expect(store.getState().elements.size).toBe(3);
      
      // Select multiple elements
      const elementIds = elements.map(e => e.id);
      store.getState().selectMultipleElements(elementIds);
      expect(store.getState().selectedElementIds.size).toBe(3);
      
      // Delete selected elements
      store.getState().deleteElements(elementIds);
      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().selectedElementIds.size).toBe(0);
    });
  });
});

/**
 * Testing Philosophy Notes:
 * 
 * ✅ What this test demonstrates:
 * - Real store instances instead of mocks
 * - Direct testing of business logic
 * - Focused, deterministic test cases
 * - Type-safe test data
 * - Proper test isolation with beforeEach
 * 
 * ❌ What this test avoids:
 * - Complex store mocking
 * - Testing implementation details
 * - Brittle integration tests
 * - External dependency coupling
 * - Overly broad test scenarios
 * 
 * This approach provides:
 * - High confidence in actual behavior
 * - Easy debugging when tests fail
 * - Maintainable test code
 * - Fast test execution
 * - Clear test intent
 */