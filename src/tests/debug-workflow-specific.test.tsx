/**
 * DEBUG TEST: Specific workflow failure analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '../features/canvas/stores/canvasStore.enhanced';
import { ElementId } from '../features/canvas/types/enhanced.types';

const createTestElement = (x: number, y: number, id: string) => ({
  id: ElementId(id),
  type: 'rectangle' as const,
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

describe('DEBUG Workflow Specific Issue', () => {
  it('should identify why workflow test fails vs others pass', () => {
    const testStore = createCanvasStore();
    testStore.getState().clearCanvas();

    // Use exact same setup as failing workflow test
    const element1 = createTestElement(150, 150, 'workflow-element-1');
    const element2 = createTestElement(200, 180, 'workflow-element-2');
    
    const state = testStore.getState();
    state.addElement(element1);
    state.addElement(element2);

    console.log('🔍 Initial state after adding elements:');
    console.log('- Elements in store:', state.elements.size);
    console.log('- Element 1:', state.elements.get('workflow-element-1'));
    console.log('- Element 2:', state.elements.get('workflow-element-2'));

    // Create section with exact same parameters as failing test
    console.log('🎯 Creating section...');
    const sectionId = state.createSection(100, 100, 300, 200, 'User Section');

    console.log('🔍 State after section creation:');
    const postCreateState = testStore.getState();
    const section = postCreateState.sections.get(sectionId);
    const elem1After = postCreateState.elements.get('workflow-element-1');
    const elem2After = postCreateState.elements.get('workflow-element-2');

    console.log('- Section:', {
      id: section?.id,
      x: section?.x,
      y: section?.y,
      width: section?.width,
      height: section?.height,
      childElementIds: section?.childElementIds,
      childCount: section?.childElementIds?.length
    });

    console.log('- Element 1 after:', {
      id: elem1After?.id,
      x: elem1After?.x,
      y: elem1After?.y,
      sectionId: elem1After?.sectionId,
      centerX: elem1After ? elem1After.x + 50 : 'N/A',
      centerY: elem1After ? elem1After.y + 25 : 'N/A'
    });

    console.log('- Element 2 after:', {
      id: elem2After?.id,
      x: elem2After?.x,
      y: elem2After?.y,
      sectionId: elem2After?.sectionId,
      centerX: elem2After ? elem2After.x + 50 : 'N/A',
      centerY: elem2After ? elem2After.y + 25 : 'N/A'
    });

    // Test manual capture to see if it works
    console.log('🧪 Testing manual capture...');
    const manualCaptureResult = postCreateState.captureElementsInSection(sectionId, postCreateState.elements);
    console.log('- Manual capture result:', manualCaptureResult);

    // Check if automatic capture worked
    const captureWorked = elem1After?.sectionId === sectionId && elem2After?.sectionId === sectionId;
    console.log('✅ Automatic capture result:', captureWorked);

    if (!captureWorked) {
      console.error('❌ WORKFLOW TEST FAILURE REPRODUCED');
      console.error('This matches the integration test failure');
    } else {
      console.log('✅ WORKFLOW TEST WORKS IN ISOLATION');
      console.log('Issue might be test environment specific');
    }

    // Basic assertions to keep test valid
    expect(section).toBeDefined();
    expect(elem1After).toBeDefined();
    expect(elem2After).toBeDefined();
  });
});