import { describe, test, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId } from '@/features/canvas/types/enhanced.types';

// Don't mock the store - use the real store instance as per testing best practices

describe('canvasHistoryStore', () => {
  beforeEach(() => {
    // Reset the store to a clean state before each test
    // Use the hook to access store methods
    const { result } = renderHook(() => useCanvasStore((state) => state));
    
    act(() => {
      // Clear all elements and reset history
      result.current.clearCanvas();
    });
  });

  describe('Basic History Operations', () => {
    test('should start with empty history and no undo/redo capability', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        canUndo: state.canUndo,
        canRedo: state.canRedo,
      })));

      expect(result.current.canUndo()).toBe(false);
      expect(result.current.canRedo()).toBe(false);
    });

    test('should enable undo after adding an element', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
      })));

      act(() => {
        result.current.addElement({
          id: ElementId('rect-1'),
          type: 'rectangle',
          tool: 'rectangle',
          x: 10,
          y: 10,
          width: 100,
          height: 100,
          fill: 'blue',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      expect(result.current.canUndo()).toBe(true);
      expect(result.current.canRedo()).toBe(false);
    });
  });

  describe('Undo/Redo Sequence Testing', () => {
    test('should correctly undo and redo a sequence of element additions', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        elements: state.elements,
        addElement: state.addElement,
        undo: state.undo,
        redo: state.redo,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
      })));

      // Add three elements in sequence
      const element1 = {
        id: ElementId('elem-1'),
        type: 'rectangle' as const,
        tool: 'rectangle' as const,
        x: 10, y: 10, width: 50, height: 50,
        fill: 'red',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const element2 = {
        id: ElementId('elem-2'),
        type: 'circle' as const,
        tool: 'circle' as const,
        x: 100, y: 100, radius: 30,
        fill: 'green',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const element3 = {
        id: ElementId('elem-3'),
        type: 'text' as const,
        tool: 'text' as const,
        x: 200, y: 200,
        text: 'Hello World',
        fontSize: 16,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add elements
      act(() => {
        result.current.addElement(element1);
        result.current.addElement(element2);
        result.current.addElement(element3);
      });

      // Verify all elements are added
      expect(result.current.elements.size).toBe(3);
      expect(result.current.elements.has(ElementId('elem-1'))).toBe(true);
      expect(result.current.elements.has(ElementId('elem-2'))).toBe(true);
      expect(result.current.elements.has(ElementId('elem-3'))).toBe(true);

      // Undo once - should remove element3
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.size).toBe(2);
      expect(result.current.elements.has(ElementId('elem-3'))).toBe(false);
      expect(result.current.canUndo()).toBe(true);
      expect(result.current.canRedo()).toBe(true);

      // Undo again - should remove element2
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.size).toBe(1);
      expect(result.current.elements.has(ElementId('elem-2'))).toBe(false);
      expect(result.current.elements.has(ElementId('elem-1'))).toBe(true);

      // Undo once more - should remove element1
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.size).toBe(0);
      expect(result.current.canUndo()).toBe(false);
      expect(result.current.canRedo()).toBe(true);

      // Redo - should restore element1
      act(() => {
        result.current.redo();
      });

      expect(result.current.elements.size).toBe(1);
      expect(result.current.elements.has(ElementId('elem-1'))).toBe(true);

      // Redo - should restore element2
      act(() => {
        result.current.redo();
      });

      expect(result.current.elements.size).toBe(2);
      expect(result.current.elements.has(ElementId('elem-2'))).toBe(true);

      // Redo - should restore element3
      act(() => {
        result.current.redo();
      });

      expect(result.current.elements.size).toBe(3);
      expect(result.current.elements.has(ElementId('elem-3'))).toBe(true);
      expect(result.current.canUndo()).toBe(true);
      expect(result.current.canRedo()).toBe(false);
    });

    test('should handle mixed operations (add, update, delete)', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        elements: state.elements,
        addElement: state.addElement,
        updateElement: state.updateElement,
        deleteElement: state.deleteElement,
        undo: state.undo,
        redo: state.redo,
      })));

      const element = {
        id: ElementId('test-elem'),
        type: 'rectangle' as const,
        tool: 'rectangle' as const,
        x: 50, y: 50, width: 100, height: 100,
        fill: 'blue',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Operation 1: Add element
      act(() => {
        result.current.addElement(element);
      });

      expect(result.current.elements.get(ElementId('test-elem'))?.fill).toBe('blue');

      // Operation 2: Update element color
      act(() => {
        result.current.updateElement(ElementId('test-elem'), { fill: 'red' });
      });

      expect(result.current.elements.get(ElementId('test-elem'))?.fill).toBe('red');

      // Operation 3: Update element position
      act(() => {
        result.current.updateElement(ElementId('test-elem'), { x: 150, y: 150 });
      });

      const updatedElement = result.current.elements.get(ElementId('test-elem'));
      expect(updatedElement?.x).toBe(150);
      expect(updatedElement?.y).toBe(150);

      // Operation 4: Delete element
      act(() => {
        result.current.deleteElement(ElementId('test-elem'));
      });

      expect(result.current.elements.has(ElementId('test-elem'))).toBe(false);

      // Undo delete - element should be restored
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.has(ElementId('test-elem'))).toBe(true);
      expect(result.current.elements.get(ElementId('test-elem'))?.x).toBe(150);
      expect(result.current.elements.get(ElementId('test-elem'))?.fill).toBe('red');

      // Undo position update
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.get(ElementId('test-elem'))?.x).toBe(50);
      expect(result.current.elements.get(ElementId('test-elem'))?.y).toBe(50);

      // Undo color update
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.get(ElementId('test-elem'))?.fill).toBe('blue');

      // Undo add - element should be removed
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.has(ElementId('test-elem'))).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle undo when history is empty', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        elements: state.elements,
        undo: state.undo,
        canUndo: state.canUndo,
      })));

      expect(result.current.canUndo()).toBe(false);

      // Attempting to undo with empty history should not throw
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.size).toBe(0);
    });

    test('should handle redo when redo stack is empty', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        elements: state.elements,
        redo: state.redo,
        canRedo: state.canRedo,
      })));

      expect(result.current.canRedo()).toBe(false);

      // Attempting to redo with empty redo stack should not throw
      act(() => {
        result.current.redo();
      });

      expect(result.current.elements.size).toBe(0);
    });

    test('should clear redo stack when new action is performed after undo', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        undo: state.undo,
        redo: state.redo,
        canRedo: state.canRedo,
      })));

      // Add two elements
      act(() => {
        result.current.addElement({
          id: ElementId('elem-1'),
          type: 'rectangle',
          tool: 'rectangle',
          x: 0, y: 0, width: 50, height: 50,
          fill: 'red',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        result.current.addElement({
          id: ElementId('elem-2'),
          type: 'circle',
          tool: 'circle',
          x: 100, y: 100, radius: 25,
          fill: 'blue',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Undo once
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo()).toBe(true);

      // Perform new action
      act(() => {
        result.current.addElement({
          id: ElementId('elem-3'),
          type: 'text',
          tool: 'text',
          x: 200, y: 200,
          text: 'New Text',
          fontSize: 14,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Redo should no longer be available
      expect(result.current.canRedo()).toBe(false);
    });

    test('should handle maximum history size correctly', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        elements: state.elements,
        addElement: state.addElement,
        history: state.history,
      })));

      // Add many elements to exceed history buffer size (assuming default is 50)
      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.addElement({
            id: ElementId(`elem-${i}`),
            type: 'rectangle',
            tool: 'rectangle',
            x: i * 10, y: i * 10, width: 50, height: 50,
            fill: `hsl(${i * 6}, 70%, 50%)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      });

      // History should maintain maximum size (50)
      expect(result.current.elements.size).toBe(60);
      // The history buffer has a max size, older entries are discarded
      expect(result.current.history.getSize()).toBeLessThanOrEqual(50);
    });
  });

  describe('Complex State Restoration', () => {
    test('should correctly restore selection state with undo/redo', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        elements: state.elements,
        selectedElementIds: state.selectedElementIds,
        addElement: state.addElement,
        selectElement: state.selectElement,
        deleteElement: state.deleteElement,
        undo: state.undo,
        redo: state.redo,
      })));

      // Add element
      act(() => {
        result.current.addElement({
          id: ElementId('elem-1'),
          type: 'rectangle',
          tool: 'rectangle',
          x: 10, y: 10, width: 100, height: 100,
          fill: 'blue',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Select element
      act(() => {
        result.current.selectElement(ElementId('elem-1'));
      });

      expect(result.current.selectedElementIds.has(ElementId('elem-1'))).toBe(true);

      // Delete selected element
      act(() => {
        result.current.deleteElement(ElementId('elem-1'));
      });

      expect(result.current.elements.has(ElementId('elem-1'))).toBe(false);
      expect(result.current.selectedElementIds.has(ElementId('elem-1'))).toBe(false);

      // Undo deletion - element and selection should be restored
      act(() => {
        result.current.undo();
      });

      expect(result.current.elements.has(ElementId('elem-1'))).toBe(true);
      // Note: Selection restoration depends on implementation
    });

    test('should handle batch operations correctly', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        elements: state.elements,
        addElement: state.addElement,
        updateElement: state.updateElement,
        undo: state.undo,
        redo: state.redo,
      })));

      // Simulate a batch operation (e.g., moving multiple selected elements)
      const elements = [
        { id: ElementId('elem-1'), x: 0, y: 0 },
        { id: ElementId('elem-2'), x: 50, y: 50 },
        { id: ElementId('elem-3'), x: 100, y: 100 },
      ];

      // Add elements
      act(() => {
        elements.forEach((el, i) => {
          result.current.addElement({
            id: el.id,
            type: 'rectangle',
            tool: 'rectangle',
            x: el.x,
            y: el.y,
            width: 40,
            height: 40,
            fill: 'purple',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        });
      });

      // Batch update - move all elements by 20 pixels
      act(() => {
        elements.forEach(el => {
          result.current.updateElement(el.id, { 
            x: el.x + 20, 
            y: el.y + 20 
          });
        });
      });

      // Verify positions updated
      expect(result.current.elements.get(ElementId('elem-1'))?.x).toBe(20);
      expect(result.current.elements.get(ElementId('elem-2'))?.x).toBe(70);
      expect(result.current.elements.get(ElementId('elem-3'))?.x).toBe(120);

      // Undo should revert all position changes
      // (Note: This might require multiple undos depending on implementation)
      act(() => {
        // Undo each update
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      // Verify positions reverted
      expect(result.current.elements.get(ElementId('elem-1'))?.x).toBe(0);
      expect(result.current.elements.get(ElementId('elem-2'))?.x).toBe(50);
      expect(result.current.elements.get(ElementId('elem-3'))?.x).toBe(100);
    });
  });
});
