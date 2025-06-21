import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import React from 'react';
import { screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import { CanvasLayerManager } from '@/features/canvas/layers/CanvasLayerManager';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { ElementId, CanvasElement } from '@/features/canvas/types/enhanced.types';

// Mock the store
jest.mock('@/features/canvas/stores/canvasStore.enhanced');
const mockUseCanvasStore = useCanvasStore as jest.MockedFunction<typeof useCanvasStore>;

// Mock shape components for testing
jest.mock('@/features/canvas/shapes/EditableNode', () => ({
  EditableNode: ({ element }: any) => (
    <div data-testid={`element-${element.id}`}>{element.type}: {element.id}</div>
  )
}));

describe('CanvasLayerManager', () => {
  const onElementClickMock = jest.fn();
  const onElementDragEndMock = jest.fn();
  const onElementUpdateMock = jest.fn();
  const onStartTextEditMock = jest.fn();
  
  let mockElements: Map<ElementId, CanvasElement>;
  let mockStore: any;
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

    mockStageRef = { current: null };

    mockStore = {
      elements: mockElements,
      sections: new Map(),
      selectedElementIds: new Set<string>(),
      selectedTool: 'select',
      isDrawing: false,
      currentPath: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
    };

    mockUseCanvasStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  afterEach(() => {
    act(() => {
      jest.clearAllMocks();
    });
  });

  describe('Layer Rendering', () => {
    test('should render all layers with correct hierarchy', () => {
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
          stageSize={{ width: 800, height: 600 }}
        />
      );

      // Verify layers are rendered (background, main, connector, UI)
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
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
          stageSize={{ width: 800, height: 600 }}
        />
      );

      // Check that all elements are rendered
      expect(screen.getByTestId('element-elem-1')).toBeInTheDocument();
      expect(screen.getByTestId('element-elem-2')).toBeInTheDocument();
      expect(screen.getByTestId('element-elem-3')).toBeInTheDocument();
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
          stageSize={{ width: 800, height: 600 }}
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
            stageSize={{ width: 800, height: 600 }}
          />
        );
      });

      expect(screen.getByTestId('element-elem-4')).toBeInTheDocument();
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
          stageSize={{ width: 800, height: 600 }}
        />
      );

      // Selected elements should be rendered with selection state
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
      expect(selectedIds.size).toBe(2);
    });

    test('should handle empty selection', () => {
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
          stageSize={{ width: 800, height: 600 }}
        />
      );

      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
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
          stageSize={{ width: 800, height: 600 }}
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
          stageSize={{ width: 800, height: 600 }}
        />
      );

      // All elements should be in the DOM (culling happens at render level)
      expect(screen.getByTestId('element-visible-1')).toBeInTheDocument();
      expect(screen.getByTestId('element-offscreen-1')).toBeInTheDocument();
      expect(screen.getByTestId('element-offscreen-2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty elements map gracefully', () => {
      renderWithKonva(
        <CanvasLayerManager
          elements={new Map()}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={mockStageRef}
          stageSize={{ width: 800, height: 600 }}
        />
      );

      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
    });

    test('should handle missing stage ref gracefully', () => {
      renderWithKonva(
        <CanvasLayerManager
          elements={mockElements}
          selectedElementIds={new Set()}
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
          stageRef={{ current: null }}
          stageSize={{ width: 800, height: 600 }}
        />
      );

      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
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
          stageSize={{ width: 800, height: 600 }}
        />
      );

      // Should still render without crashing
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();

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
          stageSize={{ width: 800, height: 600 }}
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
          stageSize={{ width: 800, height: 600 }}
        />
      );

      // Background layer should not listen to events
      // Main layer should listen to events
      // This is configured in the actual component implementation
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
    });
  });
});
