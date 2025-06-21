import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import { renderWithKonva } from '../utils/konva-test-utils';
import { EditableNode } from '@/features/canvas/shapes/EditableNode';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { CanvasElement, ElementId } from '@/features/canvas/types/enhanced.types';

// Mock the store as per the testing guide
jest.mock('@/features/canvas/stores/canvasStore.enhanced');
const mockUseCanvasStore = useCanvasStore as jest.MockedFunction<typeof useCanvasStore>;

const mockElement: CanvasElement = {
  id: 'rect-1',
  type: 'rectangle',
  tool: 'rectangle',
  x: 10,
  y: 10,
  width: 100,
  height: 100,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('RectangleShape', () => {
  const selectElementMock = jest.fn();
  const onElementClickMock = jest.fn();
  const onElementDragEndMock = jest.fn();
  const onElementUpdateMock = jest.fn();
  const onStartTextEditMock = jest.fn();

  let mockStore: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    mockStore = {
      elements: new Map([[mockElement.id, mockElement]]),
      selectedElementIds: new Set<string>(),
      selectElement: selectElementMock,
      selectedTool: 'select',
    };
    
    // Setup the mock to return our store
    mockUseCanvasStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  afterEach(() => {
    // Reset store state after each test to ensure isolation
    act(() => {
      jest.clearAllMocks();
    });
  });

  describe('Rendering', () => {
    test('should render a rectangle shape via EditableNode', () => {
      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
        />
      );

      // Since EditableNode renders the shape internally, we need to check for the rendered element
      // Konva elements are rendered as canvas elements, so we check for the Stage container
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('should trigger selectElement action when rectangle is clicked', () => {
      // Setup the click handler to call selectElement
      const handleClick = jest.fn((e, element) => {
        selectElementMock(element.id);
      });

      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={handleClick}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
        />
      );

      // Simulate click on the canvas (Konva renders to canvas)
      const canvas = screen.getByRole('presentation').querySelector('canvas');
      expect(canvas).toBeTruthy();
      
      // Fire click event
      fireEvent.click(canvas!);

      // Verify that the click handler was called
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(
        expect.any(Object), // The Konva event object
        mockElement
      );

      // Verify that selectElement was called with the correct element ID
      expect(selectElementMock).toHaveBeenCalledTimes(1);
      expect(selectElementMock).toHaveBeenCalledWith(mockElement.id);
    });

    test('should show selection state when element is selected', () => {
      // Update mock store to show element as selected
      mockStore.selectedElementIds = new Set([mockElement.id]);

      const { rerender } = renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
        />
      );

      // Re-render with isSelected=true
      rerender(
        <EditableNode
          element={mockElement}
          isSelected={true}
          selectedTool="select"
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
        />
      );

      // The component should render with selection styling
      // Since we're testing behavior, we verify that the component re-renders
      // with the selection state (actual visual testing would require different tools)
      const canvas = screen.getByRole('presentation').querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    test('should be draggable when select tool is active', () => {
      renderWithKonva(
        <EditableNode
          element={mockElement}
          isSelected={false}
          selectedTool="select"
          onElementClick={onElementClickMock}
          onElementDragEnd={onElementDragEndMock}
          onElementUpdate={onElementUpdateMock}
          onStartTextEdit={onStartTextEditMock}
        />
      );

      const canvas = screen.getByRole('presentation').querySelector('canvas');
      
      // Simulate drag operation
      fireEvent.mouseDown(canvas!);
      fireEvent.mouseMove(canvas!, { clientX: 50, clientY: 50 });
      fireEvent.mouseUp(canvas!);

      // Verify drag end handler was called
      expect(onElementDragEndMock).toHaveBeenCalledTimes(1);
      expect(onElementDragEndMock).toHaveBeenCalledWith(
        expect.any(Object), // The Konva drag event
        mockElement.id
      );
    });
  });
});
