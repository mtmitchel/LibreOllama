import { describe, test, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

describe('Canvas Performance Tests', () => {
  beforeEach(() => {
    // Reset the store to a clean state before each test
    const { result } = renderHook(() => useCanvasStore((state) => state));
    
    act(() => {
      // Clear all elements and reset state
      result.current.clearCanvas();
    });
  });

  describe('Store Performance - Element Operations', () => {
    test('should add 1000+ elements within 100ms threshold', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        elements: state.elements,
      })));

      const elementCount = 1000;
      const elements: CanvasElement[] = [];

      // Generate test elements
      for (let i = 0; i < elementCount; i++) {
        elements.push({
          id: ElementId(`perf-elem-${i}`),
          type: 'rectangle',
          tool: 'rectangle',
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          width: 50 + Math.random() * 150,
          height: 50 + Math.random() * 150,
          fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
          stroke: '#000000',
          strokeWidth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Measure time to add all elements
      const startTime = performance.now();

      act(() => {
        elements.forEach(element => {
          result.current.addElement(element);
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Assert performance threshold
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms
      expect(result.current.elements.size).toBe(elementCount);

      // Verify data structure efficiency - Map should provide O(1) access
      const lookupStartTime = performance.now();
      const element = result.current.elements.get(ElementId('perf-elem-500'));
      const lookupEndTime = performance.now();

      expect(lookupEndTime - lookupStartTime).toBeLessThan(1); // O(1) lookup should be instant
      expect(element).toBeDefined();
      expect(element?.id).toBe('perf-elem-500');
    });

    test('should handle 5000 elements efficiently', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        elements: state.elements,
      })));

      const elementCount = 5000;
      const elements: CanvasElement[] = [];

      // Generate diverse element types
      for (let i = 0; i < elementCount; i++) {
        const types: CanvasElement['type'][] = ['rectangle', 'circle', 'text', 'star', 'triangle'];
        const type = types[i % types.length];

        const baseElement = {
          id: ElementId(`stress-elem-${i}`),
          type,
          tool: type,
          x: (i % 100) * 10,
          y: Math.floor(i / 100) * 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        let element: CanvasElement;
        switch (type) {
          case 'circle':
            element = { ...baseElement, radius: 25, fill: '#ff0000' };
            break;
          case 'text':
            element = { ...baseElement, text: `Text ${i}`, fontSize: 14 };
            break;
          case 'star':
            element = { ...baseElement, radius: 20, innerRadius: 10, numPoints: 5, fill: '#ffff00' };
            break;
          case 'triangle':
            element = { ...baseElement, width: 50, height: 50, fill: '#00ff00' };
            break;
          default:
            element = { ...baseElement, width: 50, height: 50, fill: '#0000ff' };
        }

        elements.push(element as CanvasElement);
      }

      const startTime = performance.now();

      act(() => {
        elements.forEach(element => {
          result.current.addElement(element);
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Even with 5000 elements, should complete reasonably fast
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms
      expect(result.current.elements.size).toBe(elementCount);
    });
  });

  describe('Store Performance - Update Operations', () => {
    test('should update 1000 elements efficiently', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        updateElement: state.updateElement,
        elements: state.elements,
      })));

      // First, add 1000 elements
      const elementCount = 1000;
      act(() => {
        for (let i = 0; i < elementCount; i++) {
          result.current.addElement({
            id: ElementId(`update-elem-${i}`),
            type: 'rectangle',
            tool: 'rectangle',
            x: i * 2,
            y: i * 2,
            width: 100,
            height: 100,
            fill: '#000000',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      });

      // Measure time to update all elements
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < elementCount; i++) {
          result.current.updateElement(ElementId(`update-elem-${i}`), {
            x: i * 3,
            y: i * 3,
            fill: '#ff0000',
          });
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(150); // Updates should be fast
      
      // Verify updates were applied
      const updatedElement = result.current.elements.get(ElementId('update-elem-500'));
      expect(updatedElement?.x).toBe(1500);
      expect(updatedElement?.fill).toBe('#ff0000');
    });
  });

  describe('Store Performance - Selection Operations', () => {
    test('should handle large selections efficiently', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        selectMultipleElements: state.selectMultipleElements,
        selectedElementIds: state.selectedElementIds,
        elements: state.elements,
      })));

      // Add many elements
      const elementCount = 2000;
      const elementIds: ElementId[] = [];

      act(() => {
        for (let i = 0; i < elementCount; i++) {
          const id = ElementId(`select-elem-${i}`);
          elementIds.push(id);
          result.current.addElement({
            id,
            type: 'circle',
            tool: 'circle',
            x: i % 100,
            y: Math.floor(i / 100),
            radius: 20,
            fill: '#00ff00',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      });

      // Select half of the elements
      const elementsToSelect = elementIds.slice(0, 1000);
      
      const startTime = performance.now();

      act(() => {
        result.current.selectMultipleElements(elementsToSelect, true);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50); // Selection should be very fast with Set
      expect(result.current.selectedElementIds.size).toBe(1000);

      // Test selection lookup performance
      const lookupStartTime = performance.now();
      const isSelected = result.current.selectedElementIds.has(ElementId('select-elem-500'));
      const lookupEndTime = performance.now();

      expect(lookupEndTime - lookupStartTime).toBeLessThan(1); // O(1) Set lookup
      expect(isSelected).toBe(true);
    });
  });

  describe('Store Performance - Delete Operations', () => {
    test('should delete elements efficiently from large canvas', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        deleteElement: state.deleteElement,
        elements: state.elements,
      })));

      // Add 2000 elements
      const elementCount = 2000;
      act(() => {
        for (let i = 0; i < elementCount; i++) {
          result.current.addElement({
            id: ElementId(`delete-elem-${i}`),
            type: 'star',
            tool: 'star',
            x: i * 5,
            y: i * 5,
            radius: 30,
            innerRadius: 15,
            numPoints: 5,
            fill: '#ff00ff',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      });

      // Delete 500 elements
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 500; i++) {
          result.current.deleteElement(ElementId(`delete-elem-${i}`));
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100); // Deletions should be fast
      expect(result.current.elements.size).toBe(1500);

      // Verify deleted elements are gone
      expect(result.current.elements.has(ElementId('delete-elem-0'))).toBe(false);
      expect(result.current.elements.has(ElementId('delete-elem-1000'))).toBe(true);
    });
  });

  describe('Viewport Performance - Culling Efficiency', () => {
    test('should efficiently filter visible elements from large dataset', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        elements: state.elements,
        viewportBounds: state.viewportBounds,
        setViewportBounds: state.setViewportBounds,
      })));

      // Add elements spread across large area
      const elementCount = 10000;
      act(() => {
        for (let i = 0; i < elementCount; i++) {
          result.current.addElement({
            id: ElementId(`viewport-elem-${i}`),
            type: 'rectangle',
            tool: 'rectangle',
            x: (i % 100) * 100, // 0-9900
            y: Math.floor(i / 100) * 100, // 0-9900
            width: 80,
            height: 80,
            fill: '#888888',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      });

      // Set viewport bounds
      act(() => {
        result.current.setViewportBounds({
          left: 0,
          top: 0,
          right: 800,
          bottom: 600,
        });
      });

      // Measure viewport culling performance
      const startTime = performance.now();

      const visibleElements = Array.from(result.current.elements.values()).filter(element => {
        if (!('width' in element && 'height' in element)) return false;
        
        const viewport = result.current.viewportBounds!;
        return element.x < viewport.right && 
               element.x + element.width > viewport.left &&
               element.y < viewport.bottom && 
               element.y + element.height > viewport.top;
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Even with 10k elements, viewport culling should be reasonably fast
      expect(totalTime).toBeLessThan(50);
      expect(visibleElements.length).toBeLessThan(100); // Only elements in viewport
      expect(visibleElements.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Efficiency', () => {
    test('should maintain reasonable memory usage with large datasets', () => {
      const { result } = renderHook(() => useCanvasStore((state) => ({
        addElement: state.addElement,
        elements: state.elements,
        clearCanvas: state.clearCanvas,
      })));

      // Add and clear elements multiple times
      for (let round = 0; round < 5; round++) {
        act(() => {
          // Add 1000 elements
          for (let i = 0; i < 1000; i++) {
            result.current.addElement({
              id: ElementId(`memory-elem-${round}-${i}`),
              type: 'text',
              tool: 'text',
              x: i,
              y: i,
              text: `Memory test ${round}-${i}`,
              fontSize: 16,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        });

        expect(result.current.elements.size).toBe(1000);

        // Clear canvas
        act(() => {
          result.current.clearCanvas();
        });

        expect(result.current.elements.size).toBe(0);
      }

      // Memory should be properly cleaned up after clearing
      // (In a real scenario, we'd use performance.measureUserAgentSpecificMemory())
      expect(result.current.elements.size).toBe(0);
    });
  });
});
