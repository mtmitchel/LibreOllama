// Focused debug test for element capture issue
import { describe, test, expect } from 'vitest';
import { act } from '@testing-library/react';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

// Create test store helper  
const createTestStore = () => {
  return createCanvasStore();
};

// Helper to create test element - EXACT copy from working test
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

describe('Focused Element Capture Debug', () => {
  test('should debug exact capture workflow from failing test', async () => {
    const testStore = createTestStore();
    const state = testStore.getState();
    
    // Step 1: Create elements exactly as in failing test
    const element1 = createTestElement(150, 150, 'workflow-element-1');
    const element2 = createTestElement(200, 180, 'workflow-element-2');
    
    await act(async () => {
      state.addElement(element1);
      state.addElement(element2);
    });
    
    // Debug: Check elements were added and have no sectionId
    expect(state.elements.size).toBe(2);
    const preElement1 = state.elements.get(element1.id);
    const preElement2 = state.elements.get(element2.id);
    expect(preElement1).toBeDefined();
    expect(preElement2).toBeDefined(); 
    expect(preElement1?.sectionId).toBeUndefined(); // Should be undefined initially
    expect(preElement2?.sectionId).toBeUndefined(); // Should be undefined initially
    
    // Step 2: Create section exactly as in failing test
    const sectionId = await act(async () => {
      return state.createSection(100, 100, 300, 200, 'User Section');
    });
    
    // Debug: Check section was created
    expect(sectionId).toBeDefined();
    const section = state.sections.get(sectionId);
    expect(section).toBeDefined();
    expect(section?.x).toBe(100);
    expect(section?.y).toBe(100);
    expect(section?.width).toBe(300);
    expect(section?.height).toBe(200);
    
    // Step 3: Call capture method exactly as in failing test
    await act(async () => {
      state.captureElementsAfterSectionCreation(sectionId);
    });
    
    // Debug: Check what happened after capture
    const postCaptureState = testStore.getState();
    const postElement1 = postCaptureState.elements.get(element1.id);
    const postElement2 = postCaptureState.elements.get(element2.id);
    const postSection = postCaptureState.sections.get(sectionId);
    
    // The CRITICAL DEBUG INFO:
    console.log('🐛 CAPTURE DEBUG:', {
      element1: {
        exists: !!postElement1,
        sectionId: postElement1?.sectionId,
        coords: postElement1 ? { x: postElement1.x, y: postElement1.y } : null
      },
      element2: {
        exists: !!postElement2,
        sectionId: postElement2?.sectionId, 
        coords: postElement2 ? { x: postElement2.x, y: postElement2.y } : null
      },
      section: {
        exists: !!postSection,
        childElementIds: postSection?.childElementIds,
        coords: postSection ? { x: postSection.x, y: postSection.y, width: postSection.width, height: postSection.height } : null
      }
    });
    
    // Test manual coordinate checking
    if (postElement1 && postSection) {
      const elem1CenterX = postElement1.x + 50; // width/2 = 100/2 = 50
      const elem1CenterY = postElement1.y + 25; // height/2 = 50/2 = 25
      const withinSection = elem1CenterX >= postSection.x && 
                           elem1CenterX <= postSection.x + postSection.width &&
                           elem1CenterY >= postSection.y && 
                           elem1CenterY <= postSection.y + postSection.height;
      console.log('🧮 COORDINATE CHECK Element 1:', {
        centerX: elem1CenterX,
        centerY: elem1CenterY,
        sectionBounds: {
          left: postSection.x,
          right: postSection.x + postSection.width,
          top: postSection.y,
          bottom: postSection.y + postSection.height
        },
        withinSection
      });
    }
    
    // What SHOULD happen:
    expect(postElement1?.sectionId).toBe(sectionId);
    expect(postElement2?.sectionId).toBe(sectionId);
    expect(postSection?.childElementIds).toContain(element1.id);
    expect(postSection?.childElementIds).toContain(element2.id);
  });
});
