import { jest } from '@jest/globals';
jest.unmock('@/features/canvas/stores/canvasStore.enhanced');

import { describe, test, expect, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';
import { canvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

describe('Canvas Performance Tests', () => {
  beforeEach(() => {
    // Reset the store to a clean state before each test
    const state = canvasStore.getState();
    if (state.clearCanvas) {
      act(() => {
        state.clearCanvas();
      });
    }
  });

  describe('Store Performance - Element Operations', () => {
    test('should add 1000+ elements within 100ms threshold', () => {
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

      elements.forEach(element => {
        act(() => {
          canvasStore.getState().addElement(element);
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Assert performance threshold
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms
      expect(canvasStore.getState().elements.size).toBe(elementCount);

      // Verify data structure efficiency - Map should provide O(1) access
      const lookupStartTime = performance.now();
      const element = canvasStore.getState().elements.get(ElementId('perf-elem-500'));
      const lookupEndTime = performance.now();

      expect(lookupEndTime - lookupStartTime).toBeLessThan(1); // O(1) lookup should be instant
      expect(element).toBeDefined();
      expect(element?.id).toBe('perf-elem-500');
    });

    test('should handle 5000 elements efficiently', () => {
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
          fill: `hsl(${i % 360}, 70%, 50%)`,
          stroke: '#000000',
          strokeWidth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        let element: CanvasElement;
        switch (type) {
          case 'rectangle':
            element = { ...baseElement, width: 50, height: 50 };
            break;
          case 'circle':
            element = { ...baseElement, radius: 25 };
            break;
          case 'text':
            element = { ...baseElement, text: `Item ${i}`, fontSize: 14, fontFamily: 'Arial' };
            break;
          case 'star':
            element = { ...baseElement, radius: 25, innerRadius: 12, numPoints: 5 };
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

      elements.forEach(element => {
        act(() => {
          canvasStore.getState().addElement(element);
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Even with 5000 elements, should complete reasonably fast
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms
      expect(canvasStore.getState().elements.size).toBe(elementCount);
    });
  });

  describe('Store Performance - Update Operations', () => {
    test('should update 1000 elements efficiently', () => {
      // First, add 1000 elements
      const elementCount = 1000;
      for (let i = 0; i < elementCount; i++) {
        act(() => {
          canvasStore.getState().addElement({
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
        });
      }

      // Measure time to update all elements
      const startTime = performance.now();

      for (let i = 0; i < elementCount; i++) {
        act(() => {
          canvasStore.getState().updateElement(ElementId(`update-elem-${i}`), {
            x: i * 3,
            y: i * 3,
            fill: '#ff0000',
          });
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(150); // Updates should be fast
      
      // Verify updates were applied
      const updatedElement = canvasStore.getState().elements.get(ElementId('update-elem-500'));
      expect(updatedElement?.x).toBe(1500);
      expect(updatedElement?.fill).toBe('#ff0000');
    });
  });

  describe('Store Performance - Selection Operations', () => {
    test('should handle large selections efficiently', () => {
      // Add many elements
      const elementCount = 2000;
      const elementIds: ElementId[] = [];

      for (let i = 0; i < elementCount; i++) {
        const id = ElementId(`select-elem-${i}`);
        elementIds.push(id);
        act(() => {
          canvasStore.getState().addElement({
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
        });
      }

      // Select half of the elements
      const elementsToSelect = elementIds.slice(0, 1000);
      
      const startTime = performance.now();
      act(() => {
        canvasStore.getState().selectMultipleElements(elementsToSelect, true);
      });
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50); // Selection should be very fast with Set
      expect(canvasStore.getState().selectedElementIds.size).toBe(1000);

      // Test selection lookup performance
      const lookupStartTime = performance.now();
      const isSelected = canvasStore.getState().selectedElementIds.has(ElementId('select-elem-500'));
      const lookupEndTime = performance.now();

      expect(lookupEndTime - lookupStartTime).toBeLessThan(1); // O(1) Set lookup
      expect(isSelected).toBe(true);
    });
  });

  describe('Store Performance - Delete Operations', () => {
    test('should delete elements efficiently from large canvas', () => {
      // Add 2000 elements
      const elementCount = 2000;
      for (let i = 0; i < elementCount; i++) {
        act(() => {
          canvasStore.getState().addElement({
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
        });
      }

      // Delete 500 elements
      const startTime = performance.now();

      for (let i = 0; i < 500; i++) {
        act(() => {
          canvasStore.getState().deleteElement(ElementId(`delete-elem-${i}`));
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100); // Deletions should be fast
      expect(canvasStore.getState().elements.size).toBe(1500);

      // Verify deleted elements are gone
      expect(canvasStore.getState().elements.has(ElementId('delete-elem-0'))).toBe(false);
      expect(canvasStore.getState().elements.has(ElementId('delete-elem-1000'))).toBe(true);
    });
  });

  describe('Viewport Performance - Culling Efficiency', () => {
    test('should efficiently filter visible elements from large dataset', () => {
      // Add elements spread across large area
      const elementCount = 10000;
      for (let i = 0; i < elementCount; i++) {
        act(() => {
          canvasStore.getState().addElement({
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
        });
      }

      // Set viewport bounds
      act(() => {
        canvasStore.getState().setViewportBounds({
          left: 0,
          top: 0,
          right: 800,
          bottom: 600,
        });
      });

      // Measure viewport culling performance
      const startTime = performance.now();

      const state = canvasStore.getState();
      const visibleElements = Array.from(state.elements.values()).filter((element: CanvasElement) => {
        if (!('width' in element && 'height' in element)) return false;
        
        const viewport = state.viewportBounds!;
        const rectElement = element as CanvasElement & { width: number; height: number };
        return rectElement.x < viewport.right && 
               rectElement.x + rectElement.width > viewport.left &&
               rectElement.y < viewport.bottom && 
               rectElement.y + rectElement.height > viewport.top;
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
      // Add and clear elements multiple times
      for (let round = 0; round < 5; round++) {
        // Add 1000 elements
        for (let i = 0; i < 1000; i++) {
          act(() => {
            canvasStore.getState().addElement({
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
          });
        }

        expect(canvasStore.getState().elements.size).toBe(1000);

        // Clear canvas
        act(() => {
          canvasStore.getState().clearCanvas();
        });

        expect(canvasStore.getState().elements.size).toBe(0);
      }

      // Memory should be properly cleaned up after clearing
      // (In a real scenario, we'd use performance.measureUserAgentSpecificMemory())
      expect(canvasStore.getState().elements.size).toBe(0);
    });
  });
});
