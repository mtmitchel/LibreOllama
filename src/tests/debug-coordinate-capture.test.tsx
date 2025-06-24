// Debug coordinate capture test
import { describe, test, expect } from 'vitest';
import { act } from '@testing-library/react';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

// Create test store helper
const createTestStore = () => {
  return createCanvasStore();
};

// Helper to create test element
function createTestElement(x: number, y: number, testId: string): CanvasElement {
  return {
    id: ElementId(`element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
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
  };
}

describe('Debug Coordinate Capture', () => {  test('should debug element capture coordinates', async () => {
    const testStore = createTestStore();
    const state = testStore.getState();
    
    // Debug store structure
    expect(state).toBeDefined();
    expect(state.sections).toBeDefined();
    expect(state.elements).toBeDefined();
    expect(state.createSection).toBeDefined();
    expect(state.addElement).toBeDefined();
    
    console.log('Store methods available:', Object.keys(state).filter(key => typeof (state as any)[key] === 'function'));
    
    // Create elements with exact coordinates from the test
    const element1 = createTestElement(150, 150, 'debug-element-1');
    const element2 = createTestElement(200, 180, 'debug-element-2');
    
    await act(async () => {
      state.addElement(element1);
      state.addElement(element2);
    });
    
    expect(state.elements.size).toBe(2);
    expect(state.elements.get(element1.id)).toBeDefined();
    expect(state.elements.get(element2.id)).toBeDefined();    // Create section with exact coordinates from the test
    const sectionId = await act(async () => {
      return state.createSection(100, 100, 300, 200, 'Debug Section');
    });
    
    // Debug section creation
    expect(sectionId).toBeDefined();
    expect(typeof sectionId).toBe('string');
    
    // Get the section to verify coordinates
    const section = state.sections.get(sectionId);
    expect(section).toBeDefined();
    
    if (!section) {
      throw new Error(`Section ${sectionId} was not created properly`);
    }
    console.log('📍 Section bounds:', {
      x: section?.x,
      y: section?.y, 
      width: section?.width,
      height: section?.height,
      right: (section?.x || 0) + (section?.width || 0),
      bottom: (section?.y || 0) + (section?.height || 0)
    });
    
    // Check element coordinates and centers
    const elem1 = state.elements.get(element1.id);
    const elem2 = state.elements.get(element2.id);
      console.log('📍 Element 1:', {
      x: elem1?.x,
      y: elem1?.y,
      width: 100, // from createTestElement
      height: 50,
      centerX: (elem1?.x || 0) + 50,
      centerY: (elem1?.y || 0) + 25
    });
    
    console.log('📍 Element 2:', {
      x: elem2?.x,
      y: elem2?.y,
      width: 100,
      height: 50,
      centerX: (elem2?.x || 0) + 50,
      centerY: (elem2?.y || 0) + 25
    });
      // Test manual capture
    const capturedIds = state.captureElementsInSection(sectionId, state.elements);
    console.log('📍 Capture result:', capturedIds);
    
    // Add explicit expectations to see the values
    expect(section?.x).toBe(100);
    expect(section?.y).toBe(100); 
    expect(section?.width).toBe(300);
    expect(section?.height).toBe(200);
    
    expect(elem1?.x).toBe(150);
    expect(elem1?.y).toBe(150);
    expect(elem2?.x).toBe(200);
    expect(elem2?.y).toBe(180);
    
    // Element 1 center: (150 + 50, 150 + 25) = (200, 175)
    // Element 2 center: (200 + 50, 180 + 25) = (250, 205)
    // Section bounds: (100, 100) to (400, 300)
    // Both should be captured!
    expect(capturedIds.length).toBe(2);
    expect(capturedIds).toContain(element1.id);
    expect(capturedIds).toContain(element2.id);
    
    // Verify coordinate containment manually
    const sectionBounds = {
      left: section?.x || 0,
      top: section?.y || 0,
      right: (section?.x || 0) + (section?.width || 0),
      bottom: (section?.y || 0) + (section?.height || 0)
    };
      const element1Center = {
      x: (elem1?.x || 0) + 50,
      y: (elem1?.y || 0) + 25
    };
    
    const element2Center = {
      x: (elem2?.x || 0) + 50,
      y: (elem2?.y || 0) + 25
    };
    
    console.log('📍 Containment check:');
    console.log('Element 1 contained:', 
      element1Center.x >= sectionBounds.left && 
      element1Center.x <= sectionBounds.right &&
      element1Center.y >= sectionBounds.top && 
      element1Center.y <= sectionBounds.bottom
    );
    console.log('Element 2 contained:', 
      element2Center.x >= sectionBounds.left && 
      element2Center.x <= sectionBounds.right &&
      element2Center.y >= sectionBounds.top && 
      element2Center.y <= sectionBounds.bottom
    );
  });
});
