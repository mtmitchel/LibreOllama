/**
 * Debug test for FigJam-like workflow element capture
 * Focus on understanding why elements created before section aren't captured
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

const createTestStore = () => {
  return createCanvasStore();
};

const createTestElement = (x: number, y: number, id: string): CanvasElement => ({
  id: id as ElementId,
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

describe('Debug FigJam-like Workflow', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    testStore = createTestStore();
  });

  test('should debug element capture step by step', () => {
    const state = testStore.getState();
    
    // 1. Create elements first
    console.error('\n=== Step 1: Creating elements ===');
    const element1 = createTestElement(150, 150, 'workflow-element-1');
    const element2 = createTestElement(200, 180, 'workflow-element-2');
    
    state.addElement(element1);
    state.addElement(element2);
      console.error('Elements created:');
    console.error('- Element 1:', element1.id, 'at', element1.x, element1.y, 'center:', element1.x + 50, element1.y + 25);
    console.error('- Element 2:', element2.id, 'at', element2.x, element2.y, 'center:', element2.x + 50, element2.y + 25);
    console.error('- Store elements count:', state.elements.size);
    
    // 2. Create section 
    console.log('\n=== Step 2: Creating section ===');
    const sectionId = state.createSection(100, 100, 300, 200, 'User Section');
    
    const section = state.sections.get(sectionId);
    console.log('Section created:', sectionId);
    console.log('- Section bounds:', section?.x, section?.y, 'to', (section?.x || 0) + (section?.width || 0), (section?.y || 0) + (section?.height || 0));
    console.log('- Section childElementIds (initial):', section?.childElementIds);
    
    // 3. Check containment before capture
    console.log('\n=== Step 3: Check containment logic ===');
    const elem1 = state.elements.get(element1.id);
    const elem2 = state.elements.get(element2.id);
    
    if (elem1 && elem2 && section) {
      const elem1Center = { x: elem1.x + 50, y: elem1.y + 25 };
      const elem2Center = { x: elem2.x + 50, y: elem2.y + 25 };
      
      const elem1InSection = elem1Center.x >= section.x && elem1Center.x <= section.x + section.width &&
                            elem1Center.y >= section.y && elem1Center.y <= section.y + section.height;
      const elem2InSection = elem2Center.x >= section.x && elem2Center.x <= section.x + section.width &&
                            elem2Center.y >= section.y && elem2Center.y <= section.y + section.height;
      
      console.log('Element 1 containment check:');
      console.log('- Center:', elem1Center);
      console.log('- In section bounds?', elem1InSection);
      console.log('- Has sectionId?', !!elem1.sectionId);
      
      console.log('Element 2 containment check:');
      console.log('- Center:', elem2Center);
      console.log('- In section bounds?', elem2InSection);
      console.log('- Has sectionId?', !!elem2.sectionId);
    }
    
    // 4. Manual capture test
    console.log('\n=== Step 4: Manual capture test ===');
    const manualResult = state.captureElementsInSection(sectionId, state.elements);
    console.log('Manual captureElementsInSection result:', manualResult);
    
    // 5. Automated capture test
    console.log('\n=== Step 5: Automated capture test ===');
    state.captureElementsAfterSectionCreation(sectionId);
    
    const finalState = testStore.getState();
    const finalSection = finalState.sections.get(sectionId);
    const finalElem1 = finalState.elements.get(element1.id);
    const finalElem2 = finalState.elements.get(element2.id);
    
    console.log('After captureElementsAfterSectionCreation:');
    console.log('- Section childElementIds:', finalSection?.childElementIds);
    console.log('- Element 1 sectionId:', finalElem1?.sectionId);
    console.log('- Element 2 sectionId:', finalElem2?.sectionId);
    
    // 6. Add element after section creation
    console.log('\n=== Step 6: Add element after section creation ===');
    const element3 = createTestElement(250, 220, 'workflow-element-3');
    finalState.addElement(element3);
    finalState.handleElementDrop(element3.id, { x: 250, y: 220 });
    
    const finalState2 = testStore.getState();
    const finalSection2 = finalState2.sections.get(sectionId);
    const finalElem3 = finalState2.elements.get(element3.id);
    
    console.log('After adding element 3:');
    console.log('- Section childElementIds:', finalSection2?.childElementIds);
    console.log('- Element 3 sectionId:', finalElem3?.sectionId);
    
    // Debug comparison
    console.log('\n=== Final Analysis ===');
    console.log('Elements captured in childElementIds:', finalSection2?.childElementIds);
    console.log('Expected: all three elements');
    console.log('Actual behavior: element3 gets captured, but element1 and element2 might not');
    
    // The test should succeed, but let's see what happens
    expect(finalSection2?.childElementIds?.length).toBeGreaterThan(0);
  });
});
