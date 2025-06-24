/**
 * FRONTEND CRITICAL BUG TEST - Element Capture
 * This test verifies if element capture during section creation is working
 */

import { describe, test, expect } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

// Temporarily bypass logger silencing for this test
const originalLog = console.log;
const originalError = console.error;

describe('FRONTEND CRITICAL BUG: Element Capture', () => {
  test('should capture elements when creating section', () => {
    // Enable console output for this test
    console.log = originalLog;
    console.error = originalError;
    
    const testStore = createCanvasStore();
    const state = testStore.getState();
    
    console.log('🔍 FRONTEND DEBUG: Starting element capture test');
    console.log('🔍 Available store methods:', Object.keys(state));
    
    // Create test elements at specific coordinates
    const element1: CanvasElement = {
      id: ElementId('test-elem-1'),
      type: 'rectangle',
      x: 150,  // Center will be at 175, 175 
      y: 150,
      width: 50,
      height: 50,
      fill: '#ff0000',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const element2: CanvasElement = {
      id: ElementId('test-elem-2'),
      type: 'circle',
      x: 200,  // Center will be at 225, 205
      y: 180,
      radius: 25,
      fill: '#00ff00',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    console.log('🔹 Adding elements to store...');
    state.addElement(element1);
    state.addElement(element2);
    
    const postAddState = testStore.getState();
    console.log('🔹 Elements after add:', {
      storeSize: postAddState.elements.size,
      element1Added: !!postAddState.elements.get(element1.id),
      element2Added: !!postAddState.elements.get(element2.id),
    });
    
    console.log('🔹 Creating section at (100, 100) with size 300x200...');
    console.log('🔹 This should capture both elements (centers at 175,175 and 225,205)');
    
    // Create section that should capture both elements
    // Section bounds: x=100, y=100, width=300, height=200 → (100,100) to (400,300)
    const sectionId = state.createSection(100, 100, 300, 200, 'Test Section');
    
    const finalState = testStore.getState();
    const section = finalState.sections.get(sectionId);
    const elem1Final = finalState.elements.get(element1.id);
    const elem2Final = finalState.elements.get(element2.id);
    
    console.log('🔍 RESULTS after section creation:');
    console.log('📦 Section details:', {
      id: sectionId,
      exists: !!section,
      coordinates: section ? { x: section.x, y: section.y, width: section.width, height: section.height } : 'N/A',
      childElementIds: section?.childElementIds,
      childCount: section?.childElementIds?.length
    });
    
    console.log('🟢 Element 1 final state:', {
      exists: !!elem1Final,
      sectionId: elem1Final?.sectionId,
      coordinates: elem1Final ? { x: elem1Final.x, y: elem1Final.y } : 'N/A',
      center: elem1Final ? { x: elem1Final.x + 25, y: elem1Final.y + 25 } : 'N/A'
    });
    
    console.log('🔵 Element 2 final state:', {
      exists: !!elem2Final,
      sectionId: elem2Final?.sectionId,
      coordinates: elem2Final ? { x: elem2Final.x, y: elem2Final.y } : 'N/A',
      center: elem2Final ? { x: elem2Final.x + 25, y: elem2Final.y + 25 } : 'N/A'
    });
    
    // Test assertions
    expect(section).toBeDefined();
    expect(section?.childElementIds).toBeDefined();
    expect(Array.isArray(section?.childElementIds)).toBe(true);
    
    // THE CRITICAL TEST: Are elements being captured?
    console.log('🧪 CRITICAL TEST: Element capture verification');
    console.log('- Element 1 should have sectionId:', sectionId);
    console.log('- Element 1 actually has sectionId:', elem1Final?.sectionId);
    console.log('- Element 2 should have sectionId:', sectionId);
    console.log('- Element 2 actually has sectionId:', elem2Final?.sectionId);
    
    // These should pass if the frontend is working correctly
    expect(elem1Final?.sectionId).toBe(sectionId);
    expect(elem2Final?.sectionId).toBe(sectionId);
    expect(section?.childElementIds).toContain(element1.id);
    expect(section?.childElementIds).toContain(element2.id);
  });
});
