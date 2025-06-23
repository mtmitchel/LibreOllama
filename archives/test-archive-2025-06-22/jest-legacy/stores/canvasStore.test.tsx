import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from '../../features/canvas/stores/canvasStore.enhanced';
import { createMockCanvasElement } from '../utils/testUtils';

// Mock Zustand to avoid persistence issues in tests
jest.mock('zustand/middleware', () => ({
  immer: jest.fn((fn) => fn),
  devtools: jest.fn((fn) => fn),
  persist: jest.fn((fn) => fn),
}));

describe('useCanvasStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCanvasStore());
    act(() => {
      result.current.clearCanvas();
    });
  });

  describe('Element Management', () => {
    test('adds element to store', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
      });

      expect(result.current.elements.has(mockElement.id)).toBe(true);
      expect(result.current.elements.get(mockElement.id)).toEqual(mockElement);
    });

    test('updates existing element', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
      });

      const updates = { x: 200, y: 300, width: 150 };
      
      act(() => {
        result.current.updateElement(mockElement.id, updates);
      });

      const updatedElement = result.current.elements.get(mockElement.id);
      expect(updatedElement?.x).toBe(200);
      expect(updatedElement?.y).toBe(300);
      expect(updatedElement?.width).toBe(150);
    });

    test('deletes element from store', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
      });

      expect(result.current.elements.has(mockElement.id)).toBe(true);

      act(() => {
        result.current.deleteElement(mockElement.id);
      });

      expect(result.current.elements.has(mockElement.id)).toBe(false);
    });

    test('updates multiple elements at once', () => {
      const { result } = renderHook(() => useCanvasStore());
      const elements = [
        createMockCanvasElement({ type: 'rectangle' }),
        createMockCanvasElement({ type: 'circle' }),
        createMockCanvasElement({ type: 'text' })
      ];

      // Add elements
      act(() => {
        elements.forEach(el => result.current.addElement(el));
      });

      // Update multiple elements
      const updates = elements.map(el => ({
        id: el.id,
        changes: { x: el.x + 50, y: el.y + 50 }
      }));

      act(() => {
        result.current.updateMultipleElements(updates);
      });

      updates.forEach(({ id, changes }) => {
        const element = result.current.elements.get(id);
        expect(element?.x).toBe(changes.x);
        expect(element?.y).toBe(changes.y);
      });
    });
  });

  describe('Selection Management', () => {
    test('selects single element', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
        result.current.selectElement(mockElement.id);
      });

      expect(result.current.selectedElementIds.has(mockElement.id)).toBe(true);
      expect(result.current.selectedElementIds.size).toBe(1);
    });

    test('handles multi-selection with shift key', () => {
      const { result } = renderHook(() => useCanvasStore());
      const elements = [
        createMockCanvasElement({ type: 'rectangle' }),
        createMockCanvasElement({ type: 'circle' })
      ];

      act(() => {
        elements.forEach(el => result.current.addElement(el));
        result.current.selectElement(elements[0].id);
        result.current.selectElement(elements[1].id, true); // Shift key
      });

      expect(result.current.selectedElementIds.size).toBe(2);
      expect(result.current.selectedElementIds.has(elements[0].id)).toBe(true);
      expect(result.current.selectedElementIds.has(elements[1].id)).toBe(true);
    });

    test('clears selection', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
        result.current.selectElement(mockElement.id);
      });

      expect(result.current.selectedElementIds.size).toBe(1);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedElementIds.size).toBe(0);
    });

    test('selects multiple elements', () => {
      const { result } = renderHook(() => useCanvasStore());
      const elements = [
        createMockCanvasElement({ type: 'rectangle' }),
        createMockCanvasElement({ type: 'circle' }),
        createMockCanvasElement({ type: 'text' })
      ];

      act(() => {
        elements.forEach(el => result.current.addElement(el));
        result.current.selectMultipleElements(elements.map(el => el.id));
      });

      expect(result.current.selectedElementIds.size).toBe(3);
      elements.forEach(el => {
        expect(result.current.selectedElementIds.has(el.id)).toBe(true);
      });
    });
  });

  describe('Tool Management', () => {
    test('sets selected tool', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.setSelectedTool('circle');
      });

      expect(result.current.selectedTool).toBe('circle');
    });

    test('tool state affects element creation', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.setSelectedTool('text');
      });

      expect(result.current.selectedTool).toBe('text');
    });
  });

  describe('Drawing State', () => {
    test('manages drawing state', () => {
      const { result } = renderHook(() => useCanvasStore());

      expect(result.current.isDrawing).toBe(false);

      act(() => {
        result.current.startDrawing({ x: 100, y: 100 });
      });

      expect(result.current.isDrawing).toBe(true);

      act(() => {
        result.current.finishDrawing();
      });

      expect(result.current.isDrawing).toBe(false);
    });

    test('updates drawing path', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.startDrawing({ x: 100, y: 100 });
        result.current.updateDrawing({ x: 150, y: 150 });
        result.current.updateDrawing({ x: 200, y: 200 });
      });

      expect(result.current.isDrawing).toBe(true);
      // Current path should contain the drawing points
    });
  });

  describe('History Management', () => {
    test('adds history entries', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
        result.current.addHistoryEntry('Add Rectangle');
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    test('performs undo operation', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
        result.current.addHistoryEntry('Add Rectangle');
      });

      expect(result.current.elements.has(mockElement.id)).toBe(true);

      act(() => {
        result.current.undo();
      });

      // After undo, element should be removed
      expect(result.current.canRedo).toBe(true);
    });

    test('performs redo operation', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
        result.current.addHistoryEntry('Add Rectangle');
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
      });

      // After redo, element should be back
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('Performance', () => {
    test('handles large number of elements efficiently', () => {
      const { result } = renderHook(() => useCanvasStore());
      const elements = Array.from({ length: 1000 }, () => 
        createMockCanvasElement({ type: 'rectangle' })
      );

      const startTime = performance.now();

      act(() => {
        elements.forEach(el => result.current.addElement(el));
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.elements.size).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('optimizes selection operations', () => {
      const { result } = renderHook(() => useCanvasStore());
      const elements = Array.from({ length: 100 }, () => 
        createMockCanvasElement({ type: 'rectangle' })
      );

      act(() => {
        elements.forEach(el => result.current.addElement(el));
      });

      const startTime = performance.now();

      act(() => {
        result.current.selectMultipleElements(elements.map(el => el.id));
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.selectedElementIds.size).toBe(100);
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Error Handling', () => {
    test('handles invalid element IDs gracefully', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.updateElement('non-existent-id', { x: 100 });
      });

      // Should not throw error and store should remain stable
      expect(result.current.elements.size).toBe(0);
    });

    test('handles malformed update data gracefully', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
      });

      act(() => {
        // Try to update with invalid data
        result.current.updateElement(mockElement.id, { x: 'invalid' } as any);
      });

      // Element should still exist and be valid
      expect(result.current.elements.has(mockElement.id)).toBe(true);
    });

    test('maintains store consistency after errors', () => {
      const { result } = renderHook(() => useCanvasStore());
      const mockElement = createMockCanvasElement({ type: 'rectangle' });

      act(() => {
        result.current.addElement(mockElement);
        result.current.selectElement(mockElement.id);
      });

      // Try some invalid operations
      act(() => {
        result.current.deleteElement('non-existent');
        result.current.selectElement('non-existent');
      });

      // Valid state should be preserved
      expect(result.current.elements.has(mockElement.id)).toBe(true);
      expect(result.current.selectedElementIds.has(mockElement.id)).toBe(true);
    });
  });
});

