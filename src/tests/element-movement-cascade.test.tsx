/**
 * Element Movement Cascade Test
 * 
 * This test validates that when sections are moved, their child elements move with them.
 * This is critical for maintaining relative positioning in section-based layouts.
 */

import { vi } from 'vitest';
import { act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

/**
 * Create a fresh store instance for testing
 */
const createTestStore = () => {
  return createCanvasStore();
};

/**
 * Helper to create test elements
 */
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

describe('Element Movement Cascade Integration Test', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createTestStore();
  });

  test('should move child elements when section is moved', async () => {
    const state = testStore.getState();
    
    // 1. Create a section
    const sectionId = state.createSection(100, 100, 300, 200, 'Parent Section');
    
    // 2. Create elements and manually assign them to the section
    const element1 = createTestElement(150, 150, 'child-element-1');
    const element2 = createTestElement(200, 180, 'child-element-2');
    
    state.addElement(element1);
    state.addElement(element2);
    
    // 3. Simulate element capture by manually assigning them to the section
    await act(async () => {
      testStore.setState((state) => {
        // Update elements to belong to section
        const elem1 = state.elements.get(element1.id);
        const elem2 = state.elements.get(element2.id);
        
        if (elem1) {
          elem1.sectionId = sectionId;
          state.elements.set(element1.id, elem1);
        }
        
        if (elem2) {
          elem2.sectionId = sectionId;
          state.elements.set(element2.id, elem2);
        }
        
        // Update section to track children
        const section = state.sections.get(sectionId);
        if (section) {
          section.childElementIds = [element1.id as ElementId, element2.id as ElementId];
          state.sections.set(sectionId, section);
        }
      });
    });
    
    // 4. Verify initial positions
    let currentState = testStore.getState();
    let elem1 = currentState.elements.get(element1.id);
    let elem2 = currentState.elements.get(element2.id);
    
    expect(elem1?.x).toBe(150);
    expect(elem1?.y).toBe(150);
    expect(elem2?.x).toBe(200);
    expect(elem2?.y).toBe(180);
    
    // 5. Move the section
    const deltaX = 50;
    const deltaY = 30;
    const newSectionX = 100 + deltaX; // 150
    const newSectionY = 100 + deltaY; // 130
    
    await act(async () => {
      state.updateSection(sectionId, { x: newSectionX, y: newSectionY });
    });
    
    // 6. Verify child elements moved with the section
    currentState = testStore.getState();
    elem1 = currentState.elements.get(element1.id);
    elem2 = currentState.elements.get(element2.id);
    
    expect(elem1?.x).toBe(150 + deltaX); // 200
    expect(elem1?.y).toBe(150 + deltaY); // 180
    expect(elem2?.x).toBe(200 + deltaX); // 250
    expect(elem2?.y).toBe(180 + deltaY); // 210
    
    // 7. Verify section position was also updated
    const updatedSection = currentState.sections.get(sectionId);
    expect(updatedSection?.x).toBe(newSectionX);
    expect(updatedSection?.y).toBe(newSectionY);
    
    console.log('✅ [CASCADE TEST] Element movement cascade working correctly:', {
      deltaX,
      deltaY,
      element1: { 
        before: { x: 150, y: 150 }, 
        after: { x: elem1?.x, y: elem1?.y } 
      },
      element2: { 
        before: { x: 200, y: 180 }, 
        after: { x: elem2?.x, y: elem2?.y } 
      }
    });
  });

  test('should handle section movement with no child elements', async () => {
    const state = testStore.getState();
    
    // Create a section with no children
    const sectionId = state.createSection(100, 100, 300, 200, 'Empty Section');
    
    // Move the section
    await act(async () => {
      state.updateSection(sectionId, { x: 200, y: 150 });
    });
    
    // Should not crash and section should be updated
    const currentState = testStore.getState();
    const updatedSection = currentState.sections.get(sectionId);
    expect(updatedSection?.x).toBe(200);
    expect(updatedSection?.y).toBe(150);
  });

  test('should handle section movement with child elements that no longer exist', async () => {
    const state = testStore.getState();
    
    // Create a section
    const sectionId = state.createSection(100, 100, 300, 200, 'Section With Orphaned References');
    
    // Manually add non-existent child references to test robustness
    await act(async () => {
      testStore.setState((state) => {
        const section = state.sections.get(sectionId);
        if (section) {
          section.childElementIds = [ElementId('non-existent-1'), ElementId('non-existent-2')];
          state.sections.set(sectionId, section);
        }
      });
    });
    
    // Move the section - should not crash even with orphaned references
    await act(async () => {
      state.updateSection(sectionId, { x: 200, y: 150 });
    });
    
    // Should not crash and section should be updated
    const currentState = testStore.getState();
    const updatedSection = currentState.sections.get(sectionId);
    expect(updatedSection?.x).toBe(200);
    expect(updatedSection?.y).toBe(150);
  });
});
