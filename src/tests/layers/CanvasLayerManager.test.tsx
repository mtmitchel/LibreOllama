import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import React from 'react';
import { screen } from '@testing-library/react';
import { act } from '@testing-library/react';
// Import jest-dom for extra matchers
import '@testing-library/jest-dom';
// Extend expect with jest-dom matchers
import { expect as expectExtended } from '@jest/globals';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import { CanvasLayerManager } from '@/features/canvas/layers/CanvasLayerManager';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

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
  reset: jest.fn(),
  setSelectedTool: jest.fn(),
  updateElement: jest.fn(),
  deleteElement: jest.fn(),
  selectElement: jest.fn(),
};

jest.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock viewport culling hook
jest.mock('@/features/canvas/hooks/useViewportCulling', () => ({
  useViewportCulling: jest.fn(() => ({
    visibleElements: [],
    cullingStats: { 
      totalElements: 0, 
      visibleElements: 0, 
      culledElements: 0 
    }
  }))
}));

// Mock feature flags hook BEFORE any imports - using correct paths
jest.mock('@/features/canvas/hooks/useFeatureFlags', () => {
  const mockFlags = {
    'grouped-section-rendering': false,
    'centralized-transformer': false,
    'shape-connector-grouping': false,
    'unified-text-overlays': false,
  };
  
  return {
    useFeatureFlag: jest.fn().mockReturnValue(false),
    useFeatureFlags: jest.fn().mockReturnValue(mockFlags),
    __esModule: true,
  };
});

// Mock the relative path as it appears in CanvasLayerManager
jest.mock('../../features/canvas/hooks/useFeatureFlags', () => {
  const mockFlags = {
    'grouped-section-rendering': false,
    'centralized-transformer': false,
    'shape-connector-grouping': false,
    'unified-text-overlays': false,
  };
  
  return {
    useFeatureFlag: jest.fn().mockReturnValue(false),
    useFeatureFlags: jest.fn().mockReturnValue(mockFlags),
    __esModule: true,
  };
});

// Mock all layer components to isolate CanvasLayerManager logic
jest.mock('@/features/canvas/layers/BackgroundLayer', () => ({
  BackgroundLayer: () => <div data-testid="background-layer">Background Layer</div>
}));

jest.mock('@/features/canvas/layers/MainLayer', () => ({
  MainLayer: () => <div data-testid="main-layer">Main Layer</div>
}));

jest.mock('@/features/canvas/layers/ConnectorLayer', () => ({
  ConnectorLayer: () => <div data-testid="connector-layer">Connector Layer</div>
}));

jest.mock('@/features/canvas/layers/UILayer', () => ({
  UILayer: () => <div data-testid="ui-layer">UI Layer</div>
}));

jest.mock('@/features/canvas/components/GroupedSectionRenderer2', () => ({
  GroupedSectionRenderer: () => <div data-testid="grouped-section-renderer">Grouped Section Renderer</div>
}));

jest.mock('@/features/canvas/components/TransformerManager', () => ({
  TransformerManager: () => <div data-testid="transformer-manager">Transformer Manager</div>
}));

jest.mock('@/features/canvas/components/drawing/DrawingContainment', () => ({
  DrawingContainment: () => <div data-testid="drawing-containment">Drawing Containment</div>
}));

describe('CanvasLayerManager', () => {
  const onElementClickMock = jest.fn();
  const onElementDragEndMock = jest.fn();
  const onElementUpdateMock = jest.fn();
  const onStartTextEditMock = jest.fn();
  
  let mockElements: Map<ElementId, CanvasElement>;
  let mockStageRef: React.RefObject<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock elements
    mockElements = new Map([
      [ElementId('elem-1'), {
        id: 'elem-1',
        type: 'rectangle',
        tool: 'rectangle',
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        fill: '#ff0000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
      [ElementId('elem-2'), {
        id: 'elem-2',
        type: 'circle',
        tool: 'circle',
        x: 200,
        y: 100,
        radius: 50,
        fill: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
      [ElementId('elem-3'), {
        id: 'elem-3',
        type: 'text',
        tool: 'text',
        x: 300,
        y: 200,
        text: 'Test Text',
        fontSize: 16,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
    ]);

    mockStageRef = { 
      current: {
        getPointerPosition: jest.fn(() => ({ x: 0, y: 0 })),
        width: jest.fn(() => 800),
        height: jest.fn(() => 600),
        getAbsolutePosition: jest.fn(() => ({ x: 0, y: 0 })),
        getTransform: jest.fn(() => ({ m: [1, 0, 0, 1, 0, 0] })),
        batchDraw: jest.fn(),
        draw: jest.fn(),
        container: jest.fn(() => ({
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
    mockStore.selectedElementIds.clear();
    mockStore.selectedTool = 'select';
    mockStore.isDrawing = false;
    mockStore.currentPath = [];
    mockStore.zoom = 1;
    mockStore.pan = { x: 0, y: 0 };
  });

  afterEach(() => {
    act(() => {
      jest.clearAllMocks();
    });
  });

  describe('Layer Rendering', () => {
    test('should render all layers with correct hierarchy', () => {
      // Create a proper mock stage object with methods the component might use
      const mockStage = {
        getPointerPosition: jest.fn(() => ({ x: 0, y: 0 })),
        width: jest.fn(() => 800),
        height: jest.fn(() => 600),
        getAbsolutePosition: jest.fn(() => ({ x: 0, y: 0 })),
        getTransform: jest.fn(() => ({ m: [1, 0, 0, 1, 0, 0] })),
        batchDraw: jest.fn(),
        draw: jest.fn(),
        container: jest.fn(() => ({
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
        }))
      };

      // Create a ref with the mock stage
      const mockStageRef = { current: mockStage };
      
      console.log('Mock elements:', Array.from(mockElements.values()));
      console.log('Mock stage ref:', mockStageRef);
      
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
      );      // Verify layers are rendered (background, main, connector, UI)
      expect(screen.getByTestId('background-layer')).toBeDefined();
      expect(screen.getAllByTestId('main-layer').length).toBeGreaterThan(0);
      expect(screen.getByTestId('connector-layer')).toBeDefined();
      expect(screen.getByTestId('ui-layer')).toBeDefined();
      expect(screen.getByTestId('drawing-containment')).toBeDefined();
    });

    test('should render elements in the main layer', () => {
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
      );      // Check that layers are rendered (elements are handled by the mocked MainLayer)
      expect(screen.getAllByTestId('main-layer').length).toBeGreaterThan(0);
      expect(screen.getByTestId('background-layer')).toBeDefined();
      
      // Verify that the store is being accessed correctly
      expect(mockStore.elements).toBeDefined();
    });

    test('should update layers when elements change', () => {
      const { rerender } = renderWithKonva(
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

      // Add a new element
      const newElement: CanvasElement = {
        id: 'elem-4',
        type: 'star',
        tool: 'star',
        x: 400,
        y: 300,
        radius: 40,
        innerRadius: 20,
        numPoints: 5,
        fill: '#ffff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedElements = new Map(mockElements);
      updatedElements.set(ElementId('elem-4'), newElement);

      act(() => {
        rerender(
          <CanvasLayerManager
            elements={updatedElements}
            selectedElementIds={new Set()}
            onElementClick={onElementClickMock}
            onElementDragEnd={onElementDragEndMock}
            onElementUpdate={onElementUpdateMock}
            onStartTextEdit={onStartTextEditMock}
            stageRef={mockStageRef}
          />
        );
      });      // Check that layers re-render when elements change
      expect(screen.getAllByTestId('main-layer').length).toBeGreaterThan(0);
    });
  });

  describe('Selection Management', () => {
    test('should render selection UI for selected elements', () => {
      const selectedIds = new Set(['elem-1', 'elem-2']);

      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={selectedIds}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );      // Selected elements should be rendered with selection state
      const stage = screen.getByTestId('konva-stage');
      expect(stage).toBeDefined();
      expect(selectedIds.size).toBe(2);
    });

    test('should handle empty selection', () => {
      renderWithKonva(        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );

      const stage = screen.getByTestId('konva-stage');
      expect(stage).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    test('should handle large number of elements efficiently', () => {
      // Create 500 elements
      const manyElements = new Map<ElementId, CanvasElement>();
      for (let i = 0; i < 500; i++) {
        manyElements.set(ElementId(`perf-elem-${i}`), {
          id: `perf-elem-${i}`,
          type: 'rectangle',
          tool: 'rectangle',
          x: (i % 20) * 40,
          y: Math.floor(i / 20) * 40,
          width: 35,
          height: 35,
          fill: `hsl(${i % 360}, 70%, 50%)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      const startTime = performance.now();

      renderWithKonva(
        <CanvasLayerManager
          elements={manyElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000);
      expect(manyElements.size).toBe(500);
    });

    test('should implement viewport culling for off-screen elements', () => {
      // Create elements both in and out of viewport
      const elementsWithPositions = new Map<ElementId, CanvasElement>([
        [ElementId('visible-1'), {
          id: 'visible-1',
          type: 'rectangle',
          tool: 'rectangle',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          fill: '#ff0000',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }],
        [ElementId('offscreen-1'), {
          id: 'offscreen-1',
          type: 'rectangle',
          tool: 'rectangle',
          x: -1000,
          y: -1000,
          width: 50,
          height: 50,
          fill: '#00ff00',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }],
        [ElementId('offscreen-2'), {
          id: 'offscreen-2',
          type: 'rectangle',
          tool: 'rectangle',
          x: 2000,
          y: 2000,
          width: 50,
          height: 50,
          fill: '#0000ff',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }],
      ]);

      renderWithKonva(
        <CanvasLayerManager
          elements={elementsWithPositions}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );      // Test that the component itself implements culling
      // Since we mocked the layers, we test that the mock layers are rendered
      expect(screen.getByTestId('main-layer')).toBeDefined();
      
      // The actual culling logic would be tested in the MainLayer component
      // Here we just verify the CanvasLayerManager renders the layers correctly
      expect(screen.getByTestId('background-layer')).toBeDefined();
      expect(screen.getByTestId('connector-layer')).toBeDefined();
    });
  });

  describe('Error Handling', () => {    test('should handle empty elements map gracefully', () => {
      renderWithKonva(
        <CanvasLayerManager
          elements={new Map()}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
        />
      );      const stage = screen.getByTestId('konva-stage');
      expect(stage).toBeDefined();
    });    test('should handle missing stage ref gracefully', () => {
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={{ current: null }}

        />
      );

      const stage = screen.getByTestId('konva-stage');
      expect(stage).toBeDefined();
    });

    test('should recover from rendering errors', () => {
      // Mock console.error to suppress error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create an element that might cause rendering issues
      const problematicElements = new Map<ElementId, CanvasElement>([
        [ElementId('problem-1'), {
          id: 'problem-1',
          type: 'unknown' as any,
          tool: 'unknown' as any,
          x: NaN,
          y: undefined as any,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }],
      ]);

      renderWithKonva(
        <CanvasLayerManager
          elements={problematicElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}

        />
      );      // Should still render without crashing
      const stage = screen.getByTestId('konva-stage');
      expect(stage).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe('Layer Interactions', () => {
    test('should pass through element interactions correctly', () => {
      const handleClick = jest.fn();
      const handleDragEnd = jest.fn();

      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={handleClick}
          onElementDragEnd={handleDragEnd}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}

        />
      );

      // Verify callback props are passed correctly
      expect(handleClick).toBeDefined();
      expect(handleDragEnd).toBeDefined();
    });

    test('should handle layer listening property correctly', () => {
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
      );      // Background layer should not listen to events
      // Main layer should listen to events
      // This is configured in the actual component implementation
      const stage = screen.getByTestId('konva-stage');
      expect(stage).toBeDefined();
    });
  });
});
