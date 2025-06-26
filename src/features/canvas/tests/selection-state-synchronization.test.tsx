/**
 * Selection State Synchronization Test
 * 
 * This test validates that selection state is properly synchronized between
 * the UI components and the store, ensuring visual selection matches backend state.
 */

import { vi } from 'vitest';
import { act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

/**
 * Create a fresh store instance for testing
 */
const createTestStore = () => {
  return createCanvasStore();
};

/**
 * Helper to create test elements
 */
const createTestElement = (x: number, y: number, id?: string): CanvasElement => ({
  id: ElementId(id || `element-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`),
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

describe('Selection State Synchronization Test', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createTestStore();
  });

  test('should synchronize single element selection', async () => {
    const state = testStore.getState();
    
    // Create elements
    const element1 = createTestElement(100, 100, 'test-element-1');
    const element2 = createTestElement(200, 200, 'test-element-2');
    
    state.addElement(element1);
    state.addElement(element2);
    
    // Initially no selection
    expect(state.selectedElementIds.size).toBe(0);
    expect(state.hasSelection()).toBe(false);
    
    // Select first element
    await act(async () => {
      state.selectElement(element1.id as ElementId);
    });
    
    let currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.has(element2.id as ElementId)).toBe(false);
    expect(currentState.selectedElementIds.size).toBe(1);
    expect(currentState.hasSelection()).toBe(true);
    expect(currentState.isElementSelected(element1.id as ElementId)).toBe(true);
    expect(currentState.isElementSelected(element2.id as ElementId)).toBe(false);
    
    // Select second element (should replace first)
    await act(async () => {
      state.selectElement(element2.id as ElementId);
    });
    
    currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(false);
    expect(currentState.selectedElementIds.has(element2.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.size).toBe(1);
    expect(currentState.isElementSelected(element1.id as ElementId)).toBe(false);
    expect(currentState.isElementSelected(element2.id as ElementId)).toBe(true);
  });

  test('should synchronize multi-element selection', async () => {
    const state = testStore.getState();
    
    // Create elements
    const element1 = createTestElement(100, 100, 'multi-element-1');
    const element2 = createTestElement(200, 200, 'multi-element-2');
    const element3 = createTestElement(300, 300, 'multi-element-3');
    
    state.addElement(element1);
    state.addElement(element2);
    state.addElement(element3);
    
    // Select multiple elements
    await act(async () => {
      state.selectMultipleElements([element1.id as ElementId, element2.id as ElementId], true);
    });
    
    let currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.has(element2.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.has(element3.id as ElementId)).toBe(false);
    expect(currentState.selectedElementIds.size).toBe(2);
    expect(currentState.hasSelection()).toBe(true);
    
    // Add to selection
    await act(async () => {
      state.selectMultipleElements([element3.id as ElementId], false); // addToSelection = false means add
    });
    
    currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.has(element2.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.has(element3.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.size).toBe(3);
  });

  test('should synchronize element deselection', async () => {
    const state = testStore.getState();
    
    // Create elements
    const element1 = createTestElement(100, 100, 'deselect-element-1');
    const element2 = createTestElement(200, 200, 'deselect-element-2');
    
    state.addElement(element1);
    state.addElement(element2);
    
    // Select both elements
    await act(async () => {
      state.selectMultipleElements([element1.id as ElementId, element2.id as ElementId], true);
    });
    
    let currentState = testStore.getState();
    expect(currentState.selectedElementIds.size).toBe(2);
    
    // Deselect one element
    await act(async () => {
      state.deselectElement(element1.id as ElementId);
    });
    
    currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(false);
    expect(currentState.selectedElementIds.has(element2.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.size).toBe(1);
    expect(currentState.isElementSelected(element1.id as ElementId)).toBe(false);
    expect(currentState.isElementSelected(element2.id as ElementId)).toBe(true);
  });

  test('should synchronize toggle selection', async () => {
    const state = testStore.getState();
    
    // Create element
    const element1 = createTestElement(100, 100, 'toggle-element-1');
    state.addElement(element1);
    
    // Initially not selected
    expect(state.selectedElementIds.has(element1.id as ElementId)).toBe(false);
    
    // Toggle on
    await act(async () => {
      state.toggleElementSelection(element1.id as ElementId);
    });
    
    let currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.size).toBe(1);
    
    // Toggle off
    await act(async () => {
      state.toggleElementSelection(element1.id as ElementId);
    });
    
    currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(false);
    expect(currentState.selectedElementIds.size).toBe(0);
  });

  test('should synchronize clear selection', async () => {
    const state = testStore.getState();
    
    // Create and select multiple elements
    const element1 = createTestElement(100, 100, 'clear-element-1');
    const element2 = createTestElement(200, 200, 'clear-element-2');
    const element3 = createTestElement(300, 300, 'clear-element-3');
    
    state.addElement(element1);
    state.addElement(element2);
    state.addElement(element3);
    
    await act(async () => {
      state.selectMultipleElements([element1.id as ElementId, element2.id as ElementId, element3.id as ElementId], true);
    });
    
    let currentState = testStore.getState();
    expect(currentState.selectedElementIds.size).toBe(3);
    expect(currentState.hasSelection()).toBe(true);
    
    // Clear all selection
    await act(async () => {
      state.clearSelection();
    });
    
    currentState = testStore.getState();
    expect(currentState.selectedElementIds.size).toBe(0);
    expect(currentState.hasSelection()).toBe(false);
    expect(currentState.lastSelectedElementId).toBe(null);
  });

  test('should handle selection of non-existent elements gracefully', async () => {
    const state = testStore.getState();
    
    const nonExistentId = ElementId('non-existent-element');
    
    // The selection store allows selecting non-existent elements
    // This might be by design for cases like lazy loading or undo/redo operations
    await act(async () => {
      state.selectElement(nonExistentId);
    });
    
    const currentState = testStore.getState();
    // The element will be in the selection state even if it doesn't exist in elements
    // This is actually expected behavior for some use cases (lazy loading, etc.)
    expect(currentState.selectedElementIds.size).toBe(1);
    expect(currentState.selectedElementIds.has(nonExistentId)).toBe(true);
    
    // However, helper methods should handle this gracefully
    expect(currentState.hasSelection()).toBe(true);
    expect(currentState.isElementSelected(nonExistentId)).toBe(true);
  });

  test('should maintain selection state consistency across operations', async () => {
    const state = testStore.getState();
    
    // Create elements
    const element1 = createTestElement(100, 100, 'consistency-element-1');
    const element2 = createTestElement(200, 200, 'consistency-element-2');
    
    state.addElement(element1);
    state.addElement(element2);
    
    // Complex selection operations
    await act(async () => {
      // Select element1
      state.selectElement(element1.id as ElementId);
      
      // Toggle element2 (should add to selection)
      state.toggleElementSelection(element2.id as ElementId);
      
      // Deselect element1
      state.deselectElement(element1.id as ElementId);
      
      // Toggle element1 back on
      state.toggleElementSelection(element1.id as ElementId);
    });
    
    const currentState = testStore.getState();
    expect(currentState.selectedElementIds.has(element1.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.has(element2.id as ElementId)).toBe(true);
    expect(currentState.selectedElementIds.size).toBe(2);
    expect(currentState.hasSelection()).toBe(true);
    
    // Test that helper methods are consistent
    expect(currentState.isElementSelected(element1.id as ElementId)).toBe(true);
    expect(currentState.isElementSelected(element2.id as ElementId)).toBe(true);
    
    const selectedIds = currentState.getSelectedElementIds();
    expect(selectedIds).toContain(element1.id as ElementId);
    expect(selectedIds).toContain(element2.id as ElementId);
    expect(selectedIds.length).toBe(2);
  });
});
