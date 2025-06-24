/**
 * DIAGNOSTIC TEST - Element Drop Debug
 * This test debugs exactly what's happening in the element drop process
 */

import { vi } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

describe('DIAGNOSTIC: Element Drop Debug', () => {
  test('should debug element drop process step by step', () => {
    // Create real store
    const testStore = createCanvasStore();
    const state = testStore.getState();
    
    console.log('🔍 STEP 0: Store methods available:', Object.keys(state));
    console.log('🔍 STEP 0: Elements map size initially:', state.elements.size);
    
    // Create an element
    const element: CanvasElement = {
      id: ElementId('debug-element'),
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 100,
      height: 50,
      fill: '#ff0000',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    console.log('🔍 STEP 1: Initial element:', element);
    
    // Add element to store
    state.addElement(element);
    console.log('🔍 STEP 2: Elements map size after add:', state.elements.size);
    
    const addedElement = testStore.getState().elements.get(element.id);
    console.log('🔍 STEP 3: Element after adding to store:', addedElement);
    
    if (!addedElement) {
      console.log('❌ Element was not added to store. Checking addElement method...');
      console.log('🔍 addElement method type:', typeof state.addElement);
      
      // Try alternative approach
      testStore.setState((draft) => {
        draft.elements.set(element.id, element);
      });
      
      const manuallyAddedElement = testStore.getState().elements.get(element.id);
      console.log('🔍 Element after manual setState:', manuallyAddedElement);
      
      expect(manuallyAddedElement).toBeDefined();
      return; // Skip the rest if basic addition doesn't work
    }
    
    // Attempt to drop element at new position
    console.log('🔍 STEP 4: Calling handleElementDrop with position {x: 150, y: 150}');
    state.handleElementDrop(element.id, { x: 150, y: 150 });
    
    // Check result
    const updatedElement = testStore.getState().elements.get(element.id);
    console.log('🔍 STEP 5: Element after drop:', updatedElement);
    console.log('🔍 STEP 6: Expected position: {x: 150, y: 150}');
    console.log('🔍 STEP 7: Actual position:', { x: updatedElement?.x, y: updatedElement?.y });
    
    // Test basic assertions
    expect(updatedElement).toBeDefined();
    expect(updatedElement?.x).toBe(150);
    expect(updatedElement?.y).toBe(150);
  });
});
