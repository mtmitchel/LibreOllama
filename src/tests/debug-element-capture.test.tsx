/**
 * Debug test for element capture functionality
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { createTestStore } from '../test-utils/testStore';
import { ElementId, SectionId } from '../features/canvas/types/enhanced.types';

describe('DEBUG: Element Capture', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    testStore = createTestStore();
  });

  test('should debug element capture logic step by step', () => {
    const state = testStore.getState();

    // Create element first
    const element = {
      id: ElementId('debug-element'),
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

    state.addElement(element);
    console.log('🔍 Element added:', element);

    // Verify element was added
    const addedElement = state.elements.get(element.id);
    expect(addedElement).toBeDefined();
    console.log('🔍 Element in store:', addedElement);

    // Create section
    const sectionId = state.createSection(100, 100, 300, 200, 'Debug Section');
    console.log('🔍 Section created:', sectionId);

    // Verify section was created
    const section = state.sections.get(sectionId);
    expect(section).toBeDefined();
    console.log('🔍 Section in store:', section);

    // Check element position relative to section
    const elementCenterX = element.x + element.width / 2; // 120 + 50 = 170
    const elementCenterY = element.y + element.height / 2; // 120 + 25 = 145
    const sectionX = section!.x; // 100
    const sectionY = section!.y; // 100
    const sectionWidth = section!.width; // 300
    const sectionHeight = section!.height; // 200

    console.log('🔍 Element center:', { x: elementCenterX, y: elementCenterY });
    console.log('🔍 Section bounds:', { 
      x: sectionX, 
      y: sectionY, 
      width: sectionWidth, 
      height: sectionHeight,
      right: sectionX + sectionWidth,
      bottom: sectionY + sectionHeight
    });

    const shouldBeInside = elementCenterX >= sectionX && 
                          elementCenterX <= sectionX + sectionWidth && 
                          elementCenterY >= sectionY && 
                          elementCenterY <= sectionY + sectionHeight;

    console.log('🔍 Should be inside:', shouldBeInside);
    expect(shouldBeInside).toBe(true);

    // Now try capture
    console.log('🔍 Starting capture process...');
    state.captureElementsAfterSectionCreation(sectionId);

    // Check results
    const updatedElement = state.elements.get(element.id);
    const updatedSection = state.sections.get(sectionId);

    console.log('🔍 Updated element:', updatedElement);
    console.log('🔍 Updated section:', updatedSection);

    expect(updatedElement?.sectionId).toBe(sectionId);
    expect(updatedSection?.childElementIds).toContain(element.id);
  });
});
