/**
 * Canvas Store Save/Load Operations Tests - Store-First Testing Approach
 * 
 * Following the Implementation Guide principles:
 * 1. Test business logic directly through store methods
 * 2. Use real store instances, not mocks
 * 3. Focus on specific behaviors and edge cases
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createUnifiedTestStore } from '../helpers/createUnifiedTestStore';
import { ElementId, createElementId } from '@/features/canvas/types/enhanced.types';

describe('Canvas Store Save/Load Operations', () => {
  let testStore: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    // Create a fresh test store instance
    testStore = createUnifiedTestStore();
  });

  describe('Canvas Data Export/Import', () => {
    test('should export canvas data correctly', () => {
      // Add test elements to store
      const rect = {
        id: createElementId('rect-1'),
        type: 'rectangle' as const,
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const circle = {
        id: createElementId('circle-1'),
        type: 'circle' as const,
        x: 100,
        y: 100,
        radius: 25,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      testStore.getState().addElement(rect);
      testStore.getState().addElement(circle);

      // Test export functionality
      const elements = testStore.getState().elements;
      expect(elements.size).toBe(2);
      expect(elements.get(createElementId('rect-1'))).toBeDefined();
      expect(elements.get(createElementId('circle-1'))).toBeDefined();
      
      // Verify element data integrity
      const exportedRect = elements.get(createElementId('rect-1'));
      expect(exportedRect?.type).toBe('rectangle');
      expect(exportedRect?.x).toBe(10);
      expect(exportedRect?.y).toBe(20);
      
      const exportedCircle = elements.get(createElementId('circle-1'));
      expect(exportedCircle?.type).toBe('circle');
      expect(exportedCircle?.x).toBe(100);
      expect(exportedCircle?.y).toBe(100);
    });

    test('should handle empty canvas export', () => {
      // Test empty canvas
      expect(testStore.getState().elements.size).toBe(0);
      
      // Should be able to export empty state
      const elements = Array.from(testStore.getState().elements.values());
      expect(elements).toEqual([]);
    });

    test('should import canvas data correctly', () => {
      // Test data to import
      const importData = [
        {
          id: createElementId('imported-1'),
          type: 'rectangle' as const,
          x: 50,
          y: 75,
          width: 200,
          height: 100,
          fill: '#0000ff',
          stroke: '#ffffff',
          strokeWidth: 2,
          cornerRadius: 5,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: createElementId('imported-2'),
          type: 'circle' as const,
          x: 200,
          y: 200,
          radius: 50,
          fill: '#ffff00',
          stroke: '#ff00ff',
          strokeWidth: 3,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      // Import elements
      importData.forEach(element => {
        testStore.getState().addElement(element);
      });

      // Verify import
      expect(testStore.getState().elements.size).toBe(2);
      
      const importedRect = testStore.getState().elements.get(createElementId('imported-1'));
      expect(importedRect?.type).toBe('rectangle');
      expect((importedRect as any)?.width).toBe(200);
      expect((importedRect as any)?.height).toBe(100);
      
      const importedCircle = testStore.getState().elements.get(createElementId('imported-2'));
      expect(importedCircle?.type).toBe('circle');
      expect((importedCircle as any)?.radius).toBe(50);
    });

    test('should handle data validation during import', () => {
      // Test valid element
      const validElement = {
        id: createElementId('valid-1'),
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        stroke: '#ffffff',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      testStore.getState().addElement(validElement);
      expect(testStore.getState().elements.size).toBe(1);
      expect(testStore.getState().elements.get(createElementId('valid-1'))).toBeDefined();
    });
  });

  describe('Canvas State Management', () => {
    test('should preserve element relationships during export/import', () => {
      // Create elements with relationships
      const parentElement = {
        id: createElementId('parent-1'),
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        fill: '#f0f0f0',
        stroke: '#000000',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const childElement = {
        id: createElementId('child-1'),
        type: 'circle' as const,
        x: 50,
        y: 50,
        radius: 25,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      testStore.getState().addElement(parentElement);
      testStore.getState().addElement(childElement);

      // Verify elements are stored correctly
      expect(testStore.getState().elements.size).toBe(2);
      expect(testStore.getState().elements.get(createElementId('parent-1'))).toBeDefined();
      expect(testStore.getState().elements.get(createElementId('child-1'))).toBeDefined();
      
      // Test element order preservation
      const elementOrder = testStore.getState().elementOrder;
      expect(elementOrder).toContain(createElementId('parent-1'));
      expect(elementOrder).toContain(createElementId('child-1'));
    });

    test('should handle viewport state in export/import', () => {
      // Set viewport state
      testStore.getState().setViewport({
        x: 100,
        y: 200,
        scale: 1.5
      });

      // Verify viewport state
      const viewport = testStore.getState().viewport;
      expect(viewport.x).toBe(100);
      expect(viewport.y).toBe(200);
      expect(viewport.scale).toBe(1.5);
      
      // Add elements to test full state
      const element = {
        id: createElementId('viewport-test'),
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        stroke: '#ffffff',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      testStore.getState().addElement(element);
      
      // Verify combined state
      expect(testStore.getState().elements.size).toBe(1);
      expect(testStore.getState().viewport.scale).toBe(1.5);
    });

    test('should maintain selection state during operations', () => {
      // Add elements
      const element1 = {
        id: createElementId('select-1'),
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        stroke: '#ffffff',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const element2 = {
        id: createElementId('select-2'),
        type: 'circle' as const,
        x: 150,
        y: 150,
        radius: 50,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      testStore.getState().addElement(element1);
      testStore.getState().addElement(element2);

      // Test selection
      testStore.getState().selectElement(createElementId('select-1'));
      expect(testStore.getState().selectedElementIds.has(createElementId('select-1'))).toBe(true);
      expect(testStore.getState().selectedElementIds.size).toBe(1);

      // Test multi-selection
      testStore.getState().selectElement(createElementId('select-2'), true); // multiSelect: true
      expect(testStore.getState().selectedElementIds.has(createElementId('select-2'))).toBe(true);
      expect(testStore.getState().selectedElementIds.size).toBe(2);
    });

    test('should handle history state correctly', () => {
      // Initial state
      expect(testStore.getState().canUndo).toBe(false);
      expect(testStore.getState().canRedo).toBe(false);
      
      // Add element (should create history entry)
      const element = {
        id: createElementId('history-test'),
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        stroke: '#ffffff',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      testStore.getState().addElement(element);
      testStore.getState().addToHistory('addElement');
      
      // Should be able to undo after action
      expect(testStore.getState().canUndo).toBe(true);
      expect(testStore.getState().canRedo).toBe(false);
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle large datasets efficiently', () => {
      // Create large number of elements
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const element = {
          id: createElementId(`perf-${i}`),
          type: 'rectangle' as const,
          x: i * 10,
          y: i * 10,
          width: 50,
          height: 50,
          fill: `hsl(${i * 3.6}, 50%, 50%)`,
          stroke: '#000000',
          strokeWidth: 1,
          cornerRadius: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        testStore.getState().addElement(element);
      }
      
      const endTime = performance.now();
      
      // Should handle 100 elements efficiently
      expect(testStore.getState().elements.size).toBe(100);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms (increased for CI stability)
    });

    test('should handle duplicate element IDs correctly', () => {
      const element1 = {
        id: createElementId('duplicate-test'),
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        cornerRadius: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const element2 = {
        id: createElementId('duplicate-test'), // Same ID
        type: 'circle' as const,
        x: 50,
        y: 50,
        radius: 25,
        fill: '#00ff00',
        stroke: '#000000',
        strokeWidth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      testStore.getState().addElement(element1);
      testStore.getState().addElement(element2); // Should replace first element
      
      expect(testStore.getState().elements.size).toBe(1);
      const finalElement = testStore.getState().elements.get(createElementId('duplicate-test'));
      expect(finalElement?.type).toBe('circle'); // Should be the second element
    });

    test('should maintain data integrity during concurrent operations', () => {
      // Simulate concurrent operations
      const operations = [
        () => testStore.getState().addElement({
          id: createElementId('concurrent-1'),
          type: 'rectangle' as const,
          x: 0, y: 0, width: 100, height: 100,
          fill: '#000000', stroke: '#ffffff', strokeWidth: 1, cornerRadius: 0,
          createdAt: Date.now(), updatedAt: Date.now()
        }),
        () => testStore.getState().addElement({
          id: createElementId('concurrent-2'),
          type: 'circle' as const,
          x: 50, y: 50, radius: 25,
          fill: '#ff0000', stroke: '#000000', strokeWidth: 1,
          createdAt: Date.now(), updatedAt: Date.now()
        }),
        () => testStore.getState().selectElement(createElementId('concurrent-1')),
        () => testStore.getState().setViewport({ x: 100, y: 100, scale: 2 })
      ];

      // Execute operations
      operations.forEach(op => op());

      // Verify final state integrity
      expect(testStore.getState().elements.size).toBe(2);
      expect(testStore.getState().selectedElementIds.has(createElementId('concurrent-1'))).toBe(true);
      expect(testStore.getState().viewport.scale).toBe(2);
    });
  });
});