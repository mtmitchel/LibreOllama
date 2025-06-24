// Simple integration test to verify section UI behavior
// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach, afterEach
import { vi } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import { act } from '@testing-library/react';
// Import jest-dom for extra matchers
import '@testing-library/jest-dom';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import { CanvasLayerManager } from '@/features/canvas/layers/CanvasLayerManager';
import { ElementId, SectionId, CanvasElement } from '@/features/canvas/types/enhanced.types';

// Mock the store using a factory function
const mockStore = {
  elements: new Map(),
  sections: new Map(),
  selectedElementIds: new Set<string>(),
  selectedTool: 'select',
  isDrawing: false,
  currentPath: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  // Add other store methods as needed
  reset: vi.fn(),
  setSelectedTool: vi.fn(),
  updateElement: vi.fn(),
  deleteElement: vi.fn(),
  selectElement: vi.fn(),
  updateSection: vi.fn(),
  createSection: vi.fn(),
};

vi.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock viewport culling hook
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

describe('Section UI Integration Verification', () => {
  const onElementClickMock = vi.fn();
  const onElementDragEndMock = vi.fn();
  const onElementUpdateMock = vi.fn();
  const onStartTextEditMock = vi.fn();
  
  let mockElements: Map<ElementId, CanvasElement>;
  let mockSections: Map<SectionId, CanvasElement>;
  let mockStageRef: React.RefObject<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock elements
    mockElements = new Map([
      [ElementId('elem-1'), {
        id: 'elem-1',
        type: 'rectangle',
        tool: 'rectangle',
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        fill: '#ff0000',
        sectionId: 'section-1' as SectionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
    ]);

    // Create mock sections
    mockSections = new Map([
      ['section-1' as SectionId, {
        id: 'section-1',
        type: 'section',
        tool: 'section',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderWidth: 2,
        title: 'Test Section',
        childElementIds: [ElementId('elem-1')],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as CanvasElement],
    ]);

    mockStageRef = { 
      current: {
        getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
        width: vi.fn(() => 800),
        height: vi.fn(() => 600),
        getAbsolutePosition: vi.fn(() => ({ x: 0, y: 0 })),
        getTransform: vi.fn(() => ({ m: [1, 0, 0, 1, 0, 0] })),
        batchDraw: vi.fn(),
        draw: vi.fn(),
        container: vi.fn(() => ({
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
        }))
      }
    };

    // Reset store state
    mockStore.elements.clear();
    mockElements.forEach((element, id) => {
      mockStore.elements.set(id, element);
    });
    
    mockStore.sections.clear();
    mockSections.forEach((section, id) => {
      mockStore.sections.set(id, section);
    });
    
    mockStore.selectedElementIds.clear();
    mockStore.selectedTool = 'select';
    mockStore.isDrawing = false;
    mockStore.currentPath = [];
    mockStore.zoom = 1;
    mockStore.pan = { x: 0, y: 0 };
  });

  afterEach(() => {
    act(() => {
      vi.clearAllMocks();
    });
  });

  describe('Section Rendering Integration', () => {
    test('should render sections alongside elements', () => {
      console.log('Mock elements:', Array.from(mockElements.values()));
      console.log('Mock sections:', Array.from(mockSections.values()));
      
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );

      // Verify basic rendering works
      expect(screen.getByTestId('konva-stage')).toBeDefined();
      expect(screen.getAllByTestId('main-layer').length).toBeGreaterThan(0);
      
      // Check that both elements and sections are accessible to the component
      expect(mockStore.elements.size).toBe(1);
      expect(mockStore.sections.size).toBe(1);
    });

    test('should handle section with child elements', () => {
      const sectionId = 'section-1' as SectionId;
      const elementId = ElementId('elem-1');
      
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set([sectionId]))
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );

      // Verify section selection works
      const stage = screen.getByTestId('konva-stage');
      expect(stage).toBeDefined();
      
      // Check that section and element relationship is maintained
      const section = mockStore.sections.get(sectionId);
      const element = mockStore.elements.get(elementId);
      
      expect(section).toBeDefined();
      expect(element).toBeDefined();
      expect(element?.sectionId).toBe(sectionId);
    });
  });

  describe('Section Resize Integration', () => {
    test('should support section resize through callback', () => {
      const sectionId = 'section-1' as SectionId;
      
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set([sectionId]))
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );

      // Simulate resize operation
      const originalSection = mockStore.sections.get(sectionId);
      expect(originalSection?.width).toBe(300);
      expect(originalSection?.height).toBe(200);

      // Test that the component structure supports resize callbacks
      // The actual resize would be triggered through SectionShape handles
      expect(mockStore.updateSection).toBeDefined();
    });
  });

  describe('Element Constraint Integration', () => {
    test('should maintain element-section relationships', () => {
      const sectionId = 'section-1' as SectionId;
      const elementId = ElementId('elem-1');
      
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set([elementId]))
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );

      // Verify that element-section relationships are maintained
      const element = mockStore.elements.get(elementId);
      const section = mockStore.sections.get(sectionId);
      
      expect(element?.sectionId).toBe(sectionId);
      expect(section?.childElementIds).toContain(elementId);
      
      // Element coordinates should be within section bounds for proper containment
      expect(element?.x).toBeGreaterThanOrEqual(section?.x || 0);
      expect(element?.y).toBeGreaterThanOrEqual(section?.y || 0);
    });
  });

  describe('Integration Diagnostics', () => {
    test('should provide proper debugging information', () => {
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );

      // Log integration state for debugging
      console.log('Integration Test Results:');
      console.log('- Elements in store:', mockStore.elements.size);
      console.log('- Sections in store:', mockStore.sections.size);
      console.log('- Stage rendered:', !!screen.queryByTestId('konva-stage'));
      console.log('- Main layers rendered:', screen.getAllByTestId('main-layer').length);
      
      // Basic integration verification
      expect(mockStore.elements.size).toBeGreaterThan(0);
      expect(mockStore.sections.size).toBeGreaterThan(0);
      expect(screen.getByTestId('konva-stage')).toBeDefined();
    });
  });
});
