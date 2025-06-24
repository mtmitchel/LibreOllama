/**
 * DEBUG TEST: Store timing and race condition analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '../features/canvas/stores/canvasStore.enhanced';
import { ElementId } from '../features/canvas/types/enhanced.types';

describe('DEBUG Store Timing Analysis', () => {
  it('should identify the difference between global store vs new store instances', () => {
    console.log('=== STORE TIMING DEBUG ===');

    // Test with fresh store instance (like integration test)
    const freshStore = createCanvasStore();
    freshStore.getState().clearCanvas();

    // Create elements
    const element1 = {
      id: ElementId('timing-element-1'),
      type: 'rectangle' as const,
      x: 150,
      y: 150,
      width: 100,
      height: 50,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const element2 = {
      id: ElementId('timing-element-2'),
      type: 'rectangle' as const,
      x: 200,
      y: 180,
      width: 100,
      height: 50,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log('🔧 Adding elements to fresh store...');
    freshStore.getState().addElement(element1);
    freshStore.getState().addElement(element2);

    // Verify elements exist
    const addedElem1 = freshStore.getState().elements.get('timing-element-1');
    const addedElem2 = freshStore.getState().elements.get('timing-element-2');
    console.log('Elements added:', {
      elem1: !!addedElem1,
      elem2: !!addedElem2,
      totalElements: freshStore.getState().elements.size
    });

    // Create section and check immediate state
    console.log('🎯 Creating section...');
    const sectionId = freshStore.getState().createSection(100, 100, 300, 200, 'Timing Test Section');
    
    // Check state immediately after section creation
    console.log('🔍 Immediate state check:');
    const immediateState = freshStore.getState();
    const section = immediateState.sections.get(sectionId);
    const elem1After = immediateState.elements.get('timing-element-1');
    const elem2After = immediateState.elements.get('timing-element-2');

    console.log('Section:', {
      exists: !!section,
      id: section?.id,
      childElementIds: section?.childElementIds,
      childCount: section?.childElementIds?.length || 0
    });

    console.log('Elements after section creation:', {
      elem1: { exists: !!elem1After, sectionId: elem1After?.sectionId },
      elem2: { exists: !!elem2After, sectionId: elem2After?.sectionId }
    });

    // Test manual capture
    console.log('🧪 Testing manual capture...');
    const elementsMap = immediateState.elements;
    console.log('Elements map size before manual capture:', elementsMap.size);
    
    // Check what elements exist in the map
    console.log('Elements in map:');
    for (const [id, element] of elementsMap) {
      if (element.type !== 'section') {
        console.log(`- ${id}: ${element.type} at (${element.x}, ${element.y}) sectionId=${element.sectionId}`);
      }
    }
    
    const manualCaptureResult = immediateState.captureElementsInSection(sectionId, elementsMap);
    console.log('Manual capture result:', manualCaptureResult);

    // Final verification
    console.log('🔍 Final state verification:');
    const finalState = freshStore.getState();
    const finalSection = finalState.sections.get(sectionId);
    const finalElem1 = finalState.elements.get('timing-element-1');
    const finalElem2 = finalState.elements.get('timing-element-2');

    console.log('Final section childElementIds:', finalSection?.childElementIds);
    console.log('Final element sectionIds:', {
      elem1: finalElem1?.sectionId,
      elem2: finalElem2?.sectionId
    });

    console.log('=== DEBUG COMPLETE ===');

    // Basic assertions to ensure test structure is correct
    expect(section).toBeDefined();
    expect(elem1After).toBeDefined();
    expect(elem2After).toBeDefined();
  });

  it('should test the exact coordinates from failing workflow test', () => {
    console.log('=== WORKFLOW COORDINATES DEBUG ===');

    const testStore = createCanvasStore();
    testStore.getState().clearCanvas();

    // Use exact same coordinates as failing workflow test
    const element1 = {
      id: ElementId('workflow-element-1'),
      type: 'rectangle' as const,
      x: 150,  // Center: 200
      y: 150,  // Center: 175
      width: 100,
      height: 50,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const element2 = {
      id: ElementId('workflow-element-2'),
      type: 'rectangle' as const,
      x: 200,  // Center: 250
      y: 180,  // Center: 205
      width: 100,
      height: 50,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    testStore.getState().addElement(element1);
    testStore.getState().addElement(element2);

    console.log('Elements added with workflow coordinates:');
    console.log('Element 1: (150,150) size 100x50 → center (200,175)');
    console.log('Element 2: (200,180) size 100x50 → center (250,205)');
    console.log('Section: (100,100) size 300x200 → bounds 100-400 x 100-300');
    console.log('Both centers should be inside section bounds');

    // Create section with exact same coordinates
    const sectionId = testStore.getState().createSection(100, 100, 300, 200, 'User Section');

    // Check results
    const result1 = testStore.getState().elements.get('workflow-element-1');
    const result2 = testStore.getState().elements.get('workflow-element-2');
    const resultSection = testStore.getState().sections.get(sectionId);

    console.log('Results after section creation:');
    console.log('Element 1 sectionId:', result1?.sectionId);
    console.log('Element 2 sectionId:', result2?.sectionId);
    console.log('Section childElementIds:', resultSection?.childElementIds);

    if (!result1?.sectionId || !result2?.sectionId) {
      console.error('❌ WORKFLOW COORDINATES FAILED - Same as integration test!');
      
      // Test manual capture
      const manualResult = testStore.getState().captureElementsInSection(sectionId, testStore.getState().elements);
      console.error('Manual capture with these coordinates:', manualResult);
    } else {
      console.log('✅ Workflow coordinates worked - different from integration test');
    }

    console.log('=== WORKFLOW DEBUG COMPLETE ===');
  });
});