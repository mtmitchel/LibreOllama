/**
 * Canvas Selection Workflow Test
 * Tests the complete element creation → selection → transformation workflow
 * Following testing philosophy: Use real store instances for authentic behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createUnifiedTestStore } from './helpers/createUnifiedTestStore';
import { ElementId } from '@/features/canvas/types/enhanced.types';

describe('Canvas Selection Workflow', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    // Create fresh store instance for each test (testing philosophy: real stores)
    store = createUnifiedTestStore();
  });

  it('should create elements and handle selection correctly', () => {
    const actions = store.getState();
    
    // 1. Create a test rectangle element
    const testElement = {
      id: 'test-rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 150,
      height: 100,
      fill: '#4CAF50',
      stroke: '#333333',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    actions.addElement(testElement);
    
    // 2. Verify element was created
    const state1 = store.getState();
    expect(state1.elements.size).toBe(1);
    expect(state1.elements.get('test-rect-1')).toEqual(testElement);
    
    // 3. Select the element
    actions.selectElement('test-rect-1' as ElementId);
    
    // 4. Verify selection
    const state2 = store.getState();
    expect(state2.selectedElementIds.has('test-rect-1')).toBe(true);
    expect(state2.selectedElementIds.size).toBe(1);
    expect(state2.lastSelectedElementId).toBe('test-rect-1');
  });

  it('should handle multi-selection correctly', () => {
    const actions = store.getState();
    
    // Create two test elements
    const rect = { id: 'rect-1', type: 'rectangle', x: 100, y: 100, width: 100, height: 80, fill: '#4CAF50', createdAt: Date.now(), updatedAt: Date.now() };
    const circle = { id: 'circle-1', type: 'circle', x: 200, y: 200, radius: 50, fill: '#2196F3', createdAt: Date.now(), updatedAt: Date.now() };
    
    actions.addElement(rect);
    actions.addElement(circle);
    
    const state1 = store.getState();
    expect(state1.elements.size).toBe(2);
    
    // Select first element
    actions.selectElement('rect-1' as ElementId, false);
    expect(store.getState().selectedElementIds.size).toBe(1);
    
    // Multi-select second element
    actions.selectElement('circle-1' as ElementId, true);
    const state2 = store.getState();
    expect(state2.selectedElementIds.size).toBe(2);
    expect(state2.selectedElementIds.has('rect-1')).toBe(true);
    expect(state2.selectedElementIds.has('circle-1')).toBe(true);
  });

  it('should clear selection correctly', () => {
    const actions = store.getState();
    
    // Create and select an element
    const textElement = { id: 'text-1', type: 'text' as const, x: 50, y: 50, text: 'Test Text', fontSize: 16, fill: '#333', width: 200, height: 30, segments: [], createdAt: Date.now(), updatedAt: Date.now() };
    actions.addElement(textElement);
    actions.selectElement('text-1' as ElementId);
    
    // Verify selection
    expect(store.getState().selectedElementIds.size).toBe(1);
    
    // Clear selection
    actions.clearSelection();
    
    // Verify cleared
    const finalState = store.getState();
    expect(finalState.selectedElementIds.size).toBe(0);
    expect(finalState.lastSelectedElementId).toBe(null);
  });

  it('should handle selection toggle in multi-select mode', () => {
    const actions = store.getState();
    
    // Create element
    const stickyNote = { id: 'sticky-1', type: 'sticky-note' as const, x: 150, y: 150, text: 'Note', backgroundColor: '#ffeb3b', textColor: '#333', borderColor: '#ffeb3b', fontSize: 14, fontFamily: 'Arial', width: 150, height: 150, createdAt: Date.now(), updatedAt: Date.now() };
    actions.addElement(stickyNote);
    
    // Select element with multi-select mode
    actions.selectElement('sticky-1' as ElementId, true);
    expect(store.getState().selectedElementIds.has('sticky-1')).toBe(true);
    expect(store.getState().selectedElementIds.size).toBe(1);
    
    // Toggle deselect (multi-select same element again)
    actions.selectElement('sticky-1' as ElementId, true);
    const finalState = store.getState();
    expect(finalState.selectedElementIds.has('sticky-1')).toBe(false);
    expect(finalState.selectedElementIds.size).toBe(0);
  });

  it('should create different element types correctly', () => {
    const actions = store.getState();
    
    // Create different element types manually with all required properties
    const elements = [
      { id: 'rect-test', type: 'rectangle' as const, x: 0, y: 0, width: 100, height: 80, fill: '#4CAF50', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'circle-test', type: 'circle' as const, x: 100, y: 100, radius: 50, fill: '#2196F3', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'text-test', type: 'text' as const, x: 200, y: 200, text: 'Test', fontSize: 16, fill: '#333', width: 100, height: 30, segments: [], createdAt: Date.now(), updatedAt: Date.now() },
      { id: 'sticky-test', type: 'sticky-note' as const, x: 300, y: 300, text: 'Note', backgroundColor: '#ffeb3b', textColor: '#333', borderColor: '#ffeb3b', fontSize: 14, fontFamily: 'Arial', width: 150, height: 150, createdAt: Date.now(), updatedAt: Date.now() }
    ];
    
    elements.forEach(element => {
      actions.addElement(element);
    });
    
    const state = store.getState();
    expect(state.elements.size).toBe(4);
    
    // Verify each element was created correctly
    elements.forEach(expectedElement => {
      const actualElement = state.elements.get(expectedElement.id);
      expect(actualElement).toBeDefined();
      expect(actualElement!.type).toBe(expectedElement.type);
      expect(actualElement!.x).toBe(expectedElement.x);
      expect(actualElement!.y).toBe(expectedElement.y);
    });
  });
});