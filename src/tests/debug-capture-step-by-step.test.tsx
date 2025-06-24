// Simple debug test to understand the coordinate capture issue
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

// Mock viewport culling hook (this might be required for store to work)
vi.mock('@/features/canvas/hooks/useViewportCulling', () => ({
  useViewportCulling: vi.fn(() => ({
    visibleElements: [],
    cullingStats: { 
      totalElements: 0, 
      visibleElements: 0, 
      culledElements: 0 
    }
  }))
}));

// Helper to create test element (same as integration test)
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

describe('Debug Element Capture', () => {
  let testStore: ReturnType<typeof createCanvasStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a fresh store instance for each test
    testStore = createCanvasStore();
  });

  test('should debug basic store operations', () => {
    const state = testStore.getState();
    
    // Test basic element creation
    const element1 = createTestElement(150, 150, 'debug-element-1');
    state.addElement(element1);
    
    expect(state.elements.size).toBe(1);
    expect(state.elements.get(element1.id)).toBeDefined();
    
    // Test basic section creation
    const sectionId = state.createSection(100, 100, 300, 200, 'Debug Section');
    expect(sectionId).toBeDefined();
    expect(state.sections.size).toBe(1);
    
    const section = state.sections.get(sectionId);
    expect(section).toBeDefined();
    expect(section?.x).toBe(100);
    expect(section?.y).toBe(100);
    expect(section?.width).toBe(300);
    expect(section?.height).toBe(200);
  });

  test('should debug coordinate capture logic step by step', () => {
    const state = testStore.getState();
    
    // Create elements with specific coordinates
    const element1 = createTestElement(150, 150, 'workflow-element-1');
    const element2 = createTestElement(200, 180, 'workflow-element-2');
    state.addElement(element1);
    state.addElement(element2);
    
    // Create section that should contain both elements
    // Section: (100, 100) to (400, 300)
    // Element 1: (150, 150) with size 100x50, center at (200, 175) - SHOULD be inside
    // Element 2: (200, 180) with size 100x50, center at (250, 205) - SHOULD be inside
    const sectionId = state.createSection(100, 100, 300, 200, 'Test Section');
    
    // Debug the capture logic step by step
    const section = state.sections.get(sectionId);
    const elem1 = state.elements.get(element1.id);
    const elem2 = state.elements.get(element2.id);
    
    // Verify elements exist and have correct coordinates
    expect(elem1?.x).toBe(150);
    expect(elem1?.y).toBe(150);
    expect(elem2?.x).toBe(200);
    expect(elem2?.y).toBe(180);
    
    // Test the captureElementsInSection method directly
    const capturedIds = state.captureElementsInSection(sectionId, state.elements);
    
    // This should capture both elements
    expect(capturedIds).toHaveLength(2);
    expect(capturedIds).toContain(element1.id);
    expect(capturedIds).toContain(element2.id);
    
    // Verify section was updated with childElementIds
    const updatedSection = testStore.getState().sections.get(sectionId);
    expect(updatedSection?.childElementIds).toHaveLength(2);
    expect(updatedSection?.childElementIds).toContain(element1.id);
    expect(updatedSection?.childElementIds).toContain(element2.id);
  });

  test('should debug captureElementsAfterSectionCreation workflow', () => {
    const state = testStore.getState();
    
    // Replicate exact workflow from failing test
    const element1 = createTestElement(150, 150, 'workflow-element-1');
    const element2 = createTestElement(200, 180, 'workflow-element-2');
    state.addElement(element1);
    state.addElement(element2);
    
    const sectionId = state.createSection(100, 100, 300, 200, 'User Section');
    
    // Call captureElementsAfterSectionCreation like the failing test does
    state.captureElementsAfterSectionCreation(sectionId);
    
    // Check if elements got sectionId assigned
    const postCaptureState = testStore.getState();
    const capturedElem1 = postCaptureState.elements.get(element1.id);
    const capturedElem2 = postCaptureState.elements.get(element2.id);
    const finalSection = postCaptureState.sections.get(sectionId);
    
    // Debug output (these won't show due to logger silencing, but will cause test failures if wrong)
    expect(capturedElem1?.sectionId).toBe(sectionId);
    expect(capturedElem2?.sectionId).toBe(sectionId);
    expect(finalSection?.childElementIds).toContain(element1.id);
    expect(finalSection?.childElementIds).toContain(element2.id);
  });
});
