/**
 * DEBUG TEST: Section capture logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { canvasStore } from '../features/canvas/stores/canvasStore.enhanced';
import { ElementId } from '../features/canvas/types/enhanced.types';

describe('DEBUG Section Capture', () => {
  let store: ReturnType<typeof canvasStore>;

  beforeEach(() => {
    store = canvasStore;
    store.getState().clearCanvas();
  });

  it('should debug element capture process step by step', () => {
    // Create elements first
    const element1 = {
      id: ElementId('element-1'),
      type: 'rectangle' as const,
      x: 120,
      y: 120,
      width: 100,
      height: 50,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const element2 = {
      id: ElementId('element-2'), 
      type: 'rectangle' as const,
      x: 200,
      y: 150,
      width: 100,
      height: 50,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    store.getState().addElement(element1);
    store.getState().addElement(element2);

    // Check elements were added
    const addedElem1 = store.getState().elements.get('element-1');
    const addedElem2 = store.getState().elements.get('element-2');
    expect(addedElem1).toBeDefined();
    expect(addedElem2).toBeDefined();
    expect(addedElem1?.sectionId).toBeUndefined();
    expect(addedElem2?.sectionId).toBeUndefined();

    // Create section
    const sectionId = store.getState().createSection(100, 100, 300, 200, 'Capture Section');
    const section = store.getState().sections.get(sectionId);
    
    // Check section was created
    expect(section).toBeDefined();
    expect(section?.x).toBe(100);
    expect(section?.y).toBe(100);
    expect(section?.width).toBe(300);
    expect(section?.height).toBe(200);

    // Check elements after section creation (automatic capture should work)
    const elem1After = store.getState().elements.get('element-1');
    const elem2After = store.getState().elements.get('element-2');
    
    // Debug the capture result
    if (!elem1After?.sectionId || !elem2After?.sectionId) {
      // Manual capture test to see what's happening
      const elementsMap = store.getState().elements;
      const capturedIds = store.getState().captureElementsInSection(sectionId, elementsMap);
      
      // Use console.error so it shows up in test output
      console.error('❌ CAPTURE DEBUG - Auto capture failed');
      console.error('Element 1 center:', { x: 120 + 50, y: 120 + 25 }); // Should be (170, 145)
      console.error('Element 2 center:', { x: 200 + 50, y: 150 + 25 }); // Should be (250, 175)
      console.error('Section bounds:', { x: 100, y: 100, right: 400, bottom: 300 });
      console.error('Manual capture result:', capturedIds);
      console.error('Section childElementIds:', section?.childElementIds);
      console.error('Elem1 after:', { sectionId: elem1After?.sectionId });
      console.error('Elem2 after:', { sectionId: elem2After?.sectionId });
    }

    // Assertions for the capture
    expect(elem1After?.sectionId).toBe(sectionId);
    expect(elem2After?.sectionId).toBe(sectionId);
    expect(section?.childElementIds).toContain(ElementId('element-1'));
    expect(section?.childElementIds).toContain(ElementId('element-2'));
  });
});