/**
 * EXACT COPY of integration test pattern to debug store issue
 */

import { vi } from 'vitest';
import React from 'react';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

// Mock viewport culling hook only (we need real store) - EXACT copy from integration test
vi.mock('@/features/canvas/hooks/useViewportCulling', () => ({
  useViewportCulling: vi.fn(() => ({
    visibleElements: [],
    cullingStats: { 
      totalElements: 0, 
      visibleElements: 0, 
      culledElements: 0 
    }
  }))
}));

/**
 * Create a fresh store instance for testing - EXACT copy from integration test
 * This uses the REAL store implementation, not mocks
 */
const createTestStore = () => {
  // Create a new store instance for isolation
  return createCanvasStore();
};

/**
 * Helper to create test elements - EXACT copy from integration test
 */
const createTestElement = (x: number, y: number, id?: string): CanvasElement => ({
  id: (id || `element-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`) as ElementId,
  type: 'rectangle',
  x,
  y,
  width: 100,
  height: 50,
  fill: '#3B82F6',
  stroke: '#1E40AF',
  strokeWidth: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('EXACT COPY OF INTEGRATION TEST PATTERN', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a fresh store instance for each test - EXACT copy from integration test
    testStore = createTestStore();
  });

  test('should work exactly like the passing integration test', () => {
    // Get initial state - EXACT copy from integration test
    const initialState = testStore.getState();
    expect(initialState.sections.size).toBe(0);
    expect(initialState.elements.size).toBe(0);

    // Create element - EXACT copy pattern
    const element = createTestElement(50, 50, 'test-element-1');
    initialState.addElement(element);

    // This should work if the store is working
    const stateAfterAdd = testStore.getState();
    expect(stateAfterAdd.elements.size).toBe(1);
    expect(stateAfterAdd.elements.get(element.id)).toBeDefined();
  });
});
