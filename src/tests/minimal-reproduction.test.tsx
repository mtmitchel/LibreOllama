/**
 * MINIMAL REPRODUCTION: Element Capture Issue
 * This test reproduces the exact failing scenario to understand the issue
 */

import { describe, test, expect } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

describe('MINIMAL REPRODUCTION: Element Capture Issue', () => {
  test('should capture elements exactly like the failing test', () => {
    const testStore = createCanvasStore();
    const state = testStore.getState();
    
    // Create elements exactly like the failing test
    const element1: CanvasElement = {
      id: ElementId('workflow-element-1'),
      type: 'rectangle',
      x: 150,
      y: 150,
      width: 100,  // Different from my working test (was 50)
      height: 50,  // Different from my working test (was 50)
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const element2: CanvasElement = {
      id: ElementId('workflow-element-2'),
      type: 'rectangle',
      x: 200,
      y: 180,
      width: 100,  // Different from my working test (was radius: 25)
      height: 50,
      fill: '#3B82F6',
      stroke: '#1E40AF',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // Add elements exactly like the failing test
    state.addElement(element1);
    state.addElement(element2);
    
    const preCreateState = testStore.getState();
    expect(preCreateState.elements.size).toBe(2);
    expect(preCreateState.elements.get(element1.id)).toBeDefined();
    expect(preCreateState.elements.get(element2.id)).toBeDefined();
    
    // Create section exactly like the failing test
    const sectionId = state.createSection(100, 100, 300, 200, 'User Section');
    
    const postCreateState = testStore.getState();
    const section = postCreateState.sections.get(sectionId);
    const elem1Final = postCreateState.elements.get(element1.id);
    const elem2Final = postCreateState.elements.get(element2.id);
    
    // Debug data without console.log
    const debugData = {
      sectionExists: !!section,
      sectionChildCount: section?.childElementIds?.length || 0,
      sectionChildIds: section?.childElementIds || [],
      element1SectionId: elem1Final?.sectionId,
      element2SectionId: elem2Final?.sectionId,      element1Center: elem1Final && elem1Final.type === 'rectangle' ? { 
        x: elem1Final.x + elem1Final.width / 2, 
        y: elem1Final.y + elem1Final.height / 2 
      } : null,
      element2Center: elem2Final && elem2Final.type === 'rectangle' ? { 
        x: elem2Final.x + elem2Final.width / 2, 
        y: elem2Final.y + elem2Final.height / 2 
      } : null,
      sectionBounds: section ? {
        left: section.x,
        right: section.x + section.width,
        top: section.y,
        bottom: section.y + section.height
      } : null
    };
    
    // Use expect to "log" the debug data
    if (debugData.sectionChildCount !== 2) {
      expect(debugData).toEqual({
        sectionExists: true,
        sectionChildCount: 2,
        sectionChildIds: [element1.id, element2.id],
        element1SectionId: sectionId,
        element2SectionId: sectionId,
        element1Center: { x: 200, y: 175 },
        element2Center: { x: 250, y: 205 },
        sectionBounds: { left: 100, right: 400, top: 100, bottom: 300 }
      });
    }
    
    // The critical assertions that are failing in the original test
    expect(elem1Final?.sectionId).toBe(sectionId);
    expect(elem2Final?.sectionId).toBe(sectionId);
    expect(section?.childElementIds).toContain(element1.id);
    expect(section?.childElementIds).toContain(element2.id);
  });
});
