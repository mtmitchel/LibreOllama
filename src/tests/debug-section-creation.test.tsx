import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createTestStore } from './sections-ui-integration-robust.test';

describe('Debug: Section Creation Issue', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createTestStore();
  });

  test('should debug section creation', () => {
    const state = testStore.getState();
    
    // Check initial state
    console.log('Initial sections size:', state.sections.size);
    console.log('Initial elements size:', state.elements.size);
    
    // Create a section
    const sectionId = state.createSection(100, 100, 300, 200, 'Debug Section');
    console.log('Created section ID:', sectionId);
    
    // Check what was actually created
    const updatedState = testStore.getState();
    console.log('After creation sections size:', updatedState.sections.size);
    console.log('After creation elements size:', updatedState.elements.size);
    
    const section = updatedState.sections.get(sectionId);
    console.log('Section from sections store:', section ? {
      id: section.id,
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
      title: section.title
    } : 'NOT FOUND');
    
    const element = updatedState.elements.get(sectionId);
    console.log('Section from elements store:', element ? {
      id: element.id,
      x: element.x,
      y: element.y,
      type: element.type
    } : 'NOT FOUND');
  });
});
