/**
 * Simple test to isolate the element capture issue
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

describe('Element Capture Issue Analysis', () => {
  let testStore: ReturnType<typeof createCanvasStore>;

  beforeEach(() => {
    testStore = createCanvasStore();
  });

  test('should capture elements created before section', () => {
    const state = testStore.getState();
      // Create elements at known positions
    const element1: CanvasElement = {
      id: ElementId('element1'),
      type: 'rectangle',
      x: 150, y: 150, width: 100, height: 50,
      fill: '#blue', stroke: '#darkblue', strokeWidth: 2,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    
    const element2: CanvasElement = {
      id: ElementId('element2'),
      type: 'rectangle',
      x: 200, y: 180, width: 100, height: 50,
      fill: '#red', stroke: '#darkred', strokeWidth: 2,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    
    // Add elements first
    state.addElement(element1);
    state.addElement(element2);    // Verify elements are in store
    expect(state.elements.has('element1')).toBe(true);
    expect(state.elements.has('element2')).toBe(true);
    
    // Create section that should contain both elements
    // Section: x=100-400, y=100-300
    // Element1 center: (200, 175) - should be inside
    // Element2 center: (250, 205) - should be inside
    const sectionId = state.createSection(100, 100, 300, 200, 'Test Section');
    
    // Verify section exists
    const section = state.sections.get(sectionId);
    expect(section).toBeDefined();
    expect(section?.x).toBe(100);
    expect(section?.y).toBe(100);
    expect(section?.width).toBe(300);
    expect(section?.height).toBe(200);
      // Manual test of captureElementsInSection
    const manualCaptureResult = state.captureElementsInSection(sectionId, state.elements);
    expect(manualCaptureResult).toEqual(['element1', 'element2']);
    
    // Now test the automatic capture
    state.captureElementsAfterSectionCreation(sectionId);
      // Get fresh state
    const newState = testStore.getState();
    const updatedSection = newState.sections.get(sectionId);
    const elem1 = newState.elements.get('element1');
    const elem2 = newState.elements.get('element2');
    
    // Verify the results
    expect(updatedSection?.childElementIds).toContain(ElementId('element1'));
    expect(updatedSection?.childElementIds).toContain(ElementId('element2'));
    expect(elem1?.sectionId).toBe(sectionId);
    expect(elem2?.sectionId).toBe(sectionId);
  });

  test('should capture elements added after section', () => {
    const state = testStore.getState();
    
    // Create section first
    const sectionId = state.createSection(100, 100, 300, 200, 'Test Section');
      // Add element after section creation
    const element3: CanvasElement = {
      id: ElementId('element3'),
      type: 'rectangle',
      x: 250, y: 220, width: 100, height: 50,
      fill: '#green', stroke: '#darkgreen', strokeWidth: 2,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    
    state.addElement(element3);
    
    // Use handleElementDrop to place it in the section
    state.handleElementDrop(ElementId('element3'), { x: 250, y: 220 });
      // Check if it was captured
    const newState = testStore.getState();
    const section = newState.sections.get(sectionId);
    const elem3 = newState.elements.get('element3');
    
    expect(section?.childElementIds).toContain(ElementId('element3'));
    expect(elem3?.sectionId).toBe(sectionId);
  });
});
