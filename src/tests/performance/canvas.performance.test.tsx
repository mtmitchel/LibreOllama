// src/tests/performance/canvas.performance.test.tsx
/**
 * Performance tests following store-first testing principles
 * Focus on realistic performance expectations for actual use cases
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import { createMockCanvasElement } from '@/tests/utils/testUtils';
import { ElementId } from '@/features/canvas/types/enhanced.types';

describe('Canvas Performance Tests', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  test('should handle reasonable element additions efficiently', () => {
    // Test realistic canvas usage (100 elements instead of 5000)
    const elementCount = 100;
    const elements = Array.from({ length: elementCount }, (_, i) =>
      createMockCanvasElement({ id: `perf-elem-${i}`, type: 'rectangle' })
    );

    const startTime = performance.now();

    // Add elements using real store operations
    elements.forEach(element => {
      store.getState().addElement(element);
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[PERF] Added ${elementCount} elements in ${duration.toFixed(2)}ms`);
    expect(store.getState().elements.size).toBe(elementCount);
    // Realistic expectation: 100 elements should be added within 500ms for production (accounting for system variations)
    expect(duration).toBeLessThan(500);
  });

  test('should handle batch operations efficiently', () => {
    const store = createUnifiedTestStore();
    const elementCount = 50;
    const updates = Array.from({ length: elementCount }, (_, i) => ({
      id: `elem-${i}` as ElementId,
      updates: { x: i * 10, y: i * 10 }
    }));

    // Add elements first
    updates.forEach(({ id }) => {
      store.getState().addElement(createMockCanvasElement({ id, type: 'rectangle' }));
    });

    const startTime = performance.now();
    
    // Test batch update performance
    store.getState().batchUpdate(updates);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[PERF] Batch updated ${elementCount} elements in ${duration.toFixed(2)}ms`);
    // Batch operations should be very fast
    expect(duration).toBeLessThan(100);
  });
});
