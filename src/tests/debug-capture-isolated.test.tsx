/**
 * DEBUG: Isolated element capture analysis
 * Focus on understanding why automatic capture during createSection isn't working
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

describe('DEBUG: Isolated Element Capture Analysis', () => {
  it('should debug step-by-step why capture fails', () => {
    console.log('🔍 Creating fresh store...');
    const testStore = createCanvasStore();
    testStore.getState().clearCanvas();

    // Step 1: Add elements with exact same positions as failing test
    console.log('🔍 Step 1: Adding elements...');
    const element1 = createTestElement(150, 150, 'workflow-element-1');
    const element2 = createTestElement(200, 180, 'workflow-element-2');
    
    const state = testStore.getState();
    state.addElement(element1);
    state.addElement(element2);

    console.log('✅ Elements added:', {
      elem1: state.elements.get('workflow-element-1'),
      elem2: state.elements.get('workflow-element-2'),
      totalElements: state.elements.size
    });

    // Step 2: Create section with exact same bounds as failing test
    console.log('🔍 Step 2: Creating section with bounds (100,100,300,200)...');
    const sectionId = state.createSection(100, 100, 300, 200, 'Debug Section');
    
    console.log('✅ Section created:', sectionId);

    // Step 3: Check if section exists in both stores
    const postCreateState = testStore.getState();
    const section = postCreateState.sections.get(sectionId);
    const sectionAsElement = postCreateState.elements.get(sectionId);
    
    console.log('🔍 Step 3: Section store check:', {
      sectionExists: !!section,
      sectionCoords: section ? { x: section.x, y: section.y, width: section.width, height: section.height } : null,
      sectionChildIds: section?.childElementIds,
      sectionChildCount: section?.childElementIds?.length
    });
    
    console.log('🔍 Step 3: Elements store check:', {
      sectionAsElementExists: !!sectionAsElement,
      sectionAsElementType: sectionAsElement?.type,
      sectionAsElementChildIds: (sectionAsElement as any)?.childElementIds
    });

    // Step 4: Check element positions and calculate centers manually
    const elem1After = postCreateState.elements.get('workflow-element-1');
    const elem2After = postCreateState.elements.get('workflow-element-2');
    
    console.log('🔍 Step 4: Element analysis:');
    
    if (elem1After) {
      const centerX = elem1After.x + 50; // width/2
      const centerY = elem1After.y + 25; // height/2
      const withinBounds = centerX >= 100 && centerX <= 400 && centerY >= 100 && centerY <= 300;
      
      console.log('- Element 1:', {
        position: { x: elem1After.x, y: elem1After.y },
        center: { x: centerX, y: centerY },
        sectionId: elem1After.sectionId,
        withinBounds,
        boundaryCheck: {
          xOk: `${centerX} >= 100 && ${centerX} <= 400 = ${centerX >= 100 && centerX <= 400}`,
          yOk: `${centerY} >= 100 && ${centerY} <= 300 = ${centerY >= 100 && centerY <= 300}`
        }
      });
    }
    
    if (elem2After) {
      const centerX = elem2After.x + 50;
      const centerY = elem2After.y + 25;
      const withinBounds = centerX >= 100 && centerX <= 400 && centerY >= 100 && centerY <= 300;
      
      console.log('- Element 2:', {
        position: { x: elem2After.x, y: elem2After.y },
        center: { x: centerX, y: centerY },
        sectionId: elem2After.sectionId,
        withinBounds,
        boundaryCheck: {
          xOk: `${centerX} >= 100 && ${centerX} <= 400 = ${centerX >= 100 && centerX <= 400}`,
          yOk: `${centerY} >= 100 && ${centerY} <= 300 = ${centerY >= 100 && centerY <= 300}`
        }
      });
    }

    // Step 5: Test manual capture to compare with automatic
    console.log('🔍 Step 5: Testing manual capture...');
    const manualCaptureResult = postCreateState.captureElementsInSection(sectionId, postCreateState.elements);
    console.log('Manual capture result:', manualCaptureResult);
    
    // Step 6: Final analysis
    const automaticCaptureWorked = elem1After?.sectionId === sectionId && elem2After?.sectionId === sectionId;
    const sectionHasChildren = section && section.childElementIds && section.childElementIds.length > 0;
    
    console.log('🎯 Final Analysis:', {
      automaticCaptureWorked,
      sectionHasChildren,
      manualCaptureCount: manualCaptureResult.length,
      issueIdentified: !automaticCaptureWorked ? 'Automatic capture failed during createSection' : 'Test passed'
    });

    // Basic assertions to keep test valid
    expect(section).toBeDefined();
    expect(elem1After).toBeDefined();
    expect(elem2After).toBeDefined();
    
    // Debug assertion to identify the specific issue
    if (!automaticCaptureWorked) {
      console.error('❌ AUTOMATIC CAPTURE FAILURE CONFIRMED');
      console.error('This indicates createSection is not properly calling capture logic');
      
      // Test the assertion that will fail
      expect(automaticCaptureWorked).toBe(true);
    } else {
      console.log('✅ AUTOMATIC CAPTURE WORKING CORRECTLY');
    }
  });
});