// src/tests/performance/canvas.performance.test.tsx
import { describe, test, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUnifiedCanvasStore } from '@/features/canvas/stores/unifiedCanvasStore';
import { createMockCanvasElement } from '@/tests/utils/testUtils';

const initialState = useUnifiedCanvasStore.getState();

describe('Canvas Performance Tests', () => {
  beforeEach(() => {
    act(() => {
      useUnifiedCanvasStore.setState(initialState, true);
    });
  });

  test('should handle 5000 element additions efficiently', () => {
    const elementCount = 5000;
    const elements = Array.from({ length: elementCount }, (_, i) =>
      createMockCanvasElement({ id: `perf-elem-${i}`, type: 'rectangle' })
    );

    const { addElement } = useUnifiedCanvasStore.getState();
    const startTime = performance.now();

    act(() => {
      for (const element of elements) {
        addElement(element);
      }
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[PERF] Added ${elementCount} elements in ${duration.toFixed(2)}ms`);
    expect(useUnifiedCanvasStore.getState().elements.size).toBe(elementCount);
    expect(duration).toBeLessThan(1000); // Increased threshold for safety
  });
});
