/**
 * Debug test that exactly mimics the working test pattern
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

const createTestStore = () => {
  return createCanvasStore();
};

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

describe('Debug Element Addition Issue', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    testStore = createTestStore();
  });

  test('should add elements using exact same pattern as working test', () => {
    const state = testStore.getState();
    
    // Use exact same pattern as working test
    const element1 = createTestElement(120, 120, 'element-1');
    const element2 = createTestElement(200, 150, 'element-2');
    
    console.error('DEBUG: Element 1 created:', element1.id, typeof element1.id);
    console.error('DEBUG: Element 2 created:', element2.id, typeof element2.id);
    
    state.addElement(element1);
    state.addElement(element2);
    
    console.error('DEBUG: Store size after adding:', state.elements.size);
    console.error('DEBUG: Store keys:', Array.from(state.elements.keys()));
    
    // Check if elements exist using the element.id property directly
    expect(state.elements.has(element1.id as string)).toBe(true);
    expect(state.elements.has(element2.id as string)).toBe(true);
    
    // Also try retrieving them
    const retrieved1 = state.elements.get(element1.id as string);
    const retrieved2 = state.elements.get(element2.id as string);
    
    expect(retrieved1).toBeDefined();
    expect(retrieved2).toBeDefined();
    expect(retrieved1?.id).toBe(element1.id);
    expect(retrieved2?.id).toBe(element2.id);
  });

  test('should test section creation and element capture exactly like working test', () => {
    const state = testStore.getState();
    
    // Create elements first (exact same as working test)
    const element1 = createTestElement(120, 120, 'element-1');
    const element2 = createTestElement(200, 150, 'element-2');
    const element3 = createTestElement(50, 50, 'element-3'); // Outside section
    
    state.addElement(element1);
    state.addElement(element2);
    state.addElement(element3);

    // Verify they were added
    expect(state.elements.size).toBe(3);
    
    // Create section with exact same bounds as working test
    const sectionId = state.createSection(100, 100, 300, 200, 'Capture Section');

    // Check if automatic capture happened (this is what the working test checks)
    const updatedState = testStore.getState();
    const updatedElement1 = updatedState.elements.get(element1.id as string);
    const updatedElement2 = updatedState.elements.get(element2.id as string);
    const updatedElement3 = updatedState.elements.get(element3.id as string);
    
    console.error('DEBUG: After section creation:');
    console.error('- Element 1 sectionId:', updatedElement1?.sectionId);
    console.error('- Element 2 sectionId:', updatedElement2?.sectionId);
    console.error('- Element 3 sectionId:', updatedElement3?.sectionId);
    console.error('- Section exists:', !!updatedState.sections.get(sectionId));
    
    // If automatic capture works, these should pass
    // (The working test expects this to work)
    if (updatedElement1?.sectionId && updatedElement2?.sectionId) {
      expect(updatedElement1.sectionId).toBe(sectionId);
      expect(updatedElement2.sectionId).toBe(sectionId);
      expect(updatedElement3?.sectionId).toBeUndefined();
      console.error('✅ Automatic capture is working!');
    } else {
      console.error('❌ Automatic capture failed - testing manual capture');
      
      // Test manual capture
      const manualResult = state.captureElementsAfterSectionCreation(sectionId);
      console.error('Manual capture result:', manualResult);
      
      const finalState = testStore.getState();
      const finalElement1 = finalState.elements.get(element1.id as string);
      const finalElement2 = finalState.elements.get(element2.id as string);
      
      console.error('After manual capture:');
      console.error('- Element 1 sectionId:', finalElement1?.sectionId);
      console.error('- Element 2 sectionId:', finalElement2?.sectionId);
    }
    
    // This test should help us understand where the disconnect is
    expect(updatedState.sections.has(sectionId)).toBe(true);
  });
});
