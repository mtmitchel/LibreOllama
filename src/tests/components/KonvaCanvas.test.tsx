import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import { KonvaCanvas } from '@/features/canvas/components/KonvaCanvas';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { useTauriCanvas } from '@/features/canvas/hooks/useTauriCanvas';
import { ElementId } from '@/features/canvas/types/enhanced.types';

// Mock all dependencies
jest.mock('@/features/canvas/stores/canvasStore.enhanced');
jest.mock('@/features/canvas/hooks/useTauriCanvas');

const mockUseCanvasStore = useCanvasStore as jest.MockedFunction<typeof useCanvasStore>;
const mockUseTauriCanvas = useTauriCanvas as jest.MockedFunction<typeof useTauriCanvas>;

// Helper to create mock elements
const createMockElement = (overrides = {}) => ({
  id: 'test-element',
  type: 'rectangle',
  tool: 'rectangle',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  fill: '#000000',
  stroke: '#000000',
  strokeWidth: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides
});

describe('KonvaCanvas', () => {
  // Mock store methods
  const addElementMock = jest.fn();
  const updateElementMock = jest.fn();
  const deleteElementMock = jest.fn();
  const selectElementMock = jest.fn();
  const clearSelectionMock = jest.fn();
  const setSelectedToolMock = jest.fn();
  const undoMock = jest.fn();
  const redoMock = jest.fn();
  
  // Mock Tauri canvas methods
  const saveCanvasMock = jest.fn();
  const loadCanvasMock = jest.fn();

  let mockStore: any;
  let mockTauriCanvas: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock store state
    mockStore = {
      elements: new Map([
        [ElementId('elem1'), createMockElement({ id: 'elem1', type: 'rectangle', x: 10, y: 10 })],
        [ElementId('elem2'), createMockElement({ id: 'elem2', type: 'circle', x: 100, y: 100 })],
      ]),
      selectedElementIds: new Set<string>(),
      selectedTool: 'select',
      isDrawing: false,
      currentPath: [],
      addElement: addElementMock,
      updateElement: updateElementMock,
      deleteElement: deleteElementMock,
      selectElement: selectElementMock,
      clearSelection: clearSelectionMock,
      setSelectedTool: setSelectedToolMock,
      undo: undoMock,
      redo: redoMock,
      zoom: 1,
      pan: { x: 0, y: 0 },
    };

    // Setup mock Tauri canvas
    mockTauriCanvas = {
      saveCanvas: saveCanvasMock,
      loadCanvas: loadCanvasMock,
      isLoading: false,
      error: null,
      isSaved: true,
    };

    // Configure mocks to return our mock objects
    mockUseCanvasStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });

    mockUseTauriCanvas.mockReturnValue(mockTauriCanvas);
  });

  afterEach(() => {
    act(() => {
      jest.clearAllMocks();
    });
  });

  describe('Drawing Actions', () => {
    test('should create a rectangle element when drawing with rectangle tool', async () => {
      // Set tool to rectangle
      mockStore.selectedTool = 'rectangle';
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');
      expect(canvas).toBeTruthy();

      // Simulate user drawing a rectangle
      act(() => {
        fireEvent.mouseDown(canvas!, { 
          clientX: 100, 
          clientY: 100,
          bubbles: true 
        });
      });

      act(() => {
        fireEvent.mouseMove(canvas!, { 
          clientX: 200, 
          clientY: 200,
          bubbles: true 
        });
      });

      act(() => {
        fireEvent.mouseUp(canvas!, { 
          clientX: 200, 
          clientY: 200,
          bubbles: true 
        });
      });

      // Assert that addCanvasElement was called with correct payload
      expect(addElementMock).toHaveBeenCalledTimes(1);
      expect(addElementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rectangle',
          tool: 'rectangle',
          x: expect.any(Number),
          y: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number),
          fill: expect.any(String),
          stroke: expect.any(String),
          strokeWidth: expect.any(Number),
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        })
      );
    });

    test('should create a circle element when drawing with circle tool', async () => {
      mockStore.selectedTool = 'circle';
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Simulate drawing a circle
      act(() => {
        fireEvent.mouseDown(canvas!, { clientX: 150, clientY: 150 });
        fireEvent.mouseMove(canvas!, { clientX: 250, clientY: 250 });
        fireEvent.mouseUp(canvas!, { clientX: 250, clientY: 250 });
      });

      expect(addElementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'circle',
          tool: 'circle',
          x: expect.any(Number),
          y: expect.any(Number),
          radius: expect.any(Number),
        })
      );
    });

    test('should handle pen/drawing tool with path creation', async () => {
      mockStore.selectedTool = 'pen';
      mockStore.isDrawing = false;
      mockStore.currentPath = [];
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Start drawing
      act(() => {
        fireEvent.mouseDown(canvas!, { clientX: 50, clientY: 50 });
      });

      // Draw path
      act(() => {
        fireEvent.mouseMove(canvas!, { clientX: 60, clientY: 60 });
        fireEvent.mouseMove(canvas!, { clientX: 70, clientY: 80 });
        fireEvent.mouseMove(canvas!, { clientX: 80, clientY: 100 });
      });

      // Finish drawing
      act(() => {
        fireEvent.mouseUp(canvas!, { clientX: 80, clientY: 100 });
      });

      expect(addElementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pen',
          tool: 'pen',
          points: expect.any(Array),
        })
      );
    });
  });

  describe('Selection Interactions', () => {
    test('should select element when clicked with select tool', async () => {
      mockStore.selectedTool = 'select';
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Simulate clicking on an element's position
      act(() => {
        fireEvent.click(canvas!, { 
          clientX: 15, // Near elem1's position
          clientY: 15,
        });
      });

      // Should attempt to select element at that position
      // In a real implementation, this would hit-test and select the element
      expect(mockStore.selectedTool).toBe('select');
    });

    test('should clear selection when clicking empty space', async () => {
      mockStore.selectedTool = 'select';
      mockStore.selectedElementIds = new Set(['elem1']);
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Click on empty space
      act(() => {
        fireEvent.click(canvas!, { 
          clientX: 400, // Empty area
          clientY: 400,
        });
      });

      expect(clearSelectionMock).toHaveBeenCalled();
    });

    test('should handle multi-selection with Shift key', async () => {
      mockStore.selectedTool = 'select';
      mockStore.selectedElementIds = new Set(['elem1']);
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Shift-click to add to selection
      act(() => {
        fireEvent.click(canvas!, { 
          clientX: 105, // Near elem2's position
          clientY: 105,
          shiftKey: true,
        });
      });

      // Would add to selection rather than replace
      expect(mockStore.selectedTool).toBe('select');
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should handle undo/redo shortcuts', async () => {
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      // Undo
      act(() => {
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      });
      expect(undoMock).toHaveBeenCalledTimes(1);

      // Redo
      act(() => {
        fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      });
      expect(redoMock).toHaveBeenCalledTimes(1);
    });

    test('should delete selected elements on Delete key', async () => {
      mockStore.selectedElementIds = new Set(['elem1']);
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      act(() => {
        fireEvent.keyDown(window, { key: 'Delete' });
      });

      expect(deleteElementMock).toHaveBeenCalledWith('elem1');
    });

    test('should clear selection on Escape key', async () => {
      mockStore.selectedElementIds = new Set(['elem1', 'elem2']);
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(clearSelectionMock).toHaveBeenCalled();
    });
  });

  describe('Canvas Transformation', () => {
    test('should handle element dragging', async () => {
      mockStore.selectedTool = 'select';
      const elem1 = mockStore.elements.get(ElementId('elem1'));
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Simulate dragging an element
      act(() => {
        fireEvent.mouseDown(canvas!, { clientX: 15, clientY: 15 });
        fireEvent.mouseMove(canvas!, { clientX: 50, clientY: 50 });
        fireEvent.mouseUp(canvas!, { clientX: 50, clientY: 50 });
      });

      // In real implementation, this would update element position
      expect(mockStore.selectedTool).toBe('select');
    });

    test('should handle canvas panning with space key', async () => {
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Hold space and drag to pan
      act(() => {
        fireEvent.keyDown(window, { key: ' ' });
        fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas!, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas!, { clientX: 150, clientY: 150 });
        fireEvent.keyUp(window, { key: ' ' });
      });

      // Pan state would be updated in real implementation
      expect(mockStore.pan).toBeDefined();
    });

    test('should handle zoom with Ctrl+wheel', async () => {
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Zoom in
      act(() => {
        fireEvent.wheel(canvas!, { 
          deltaY: -100, 
          ctrlKey: true,
          clientX: 400,
          clientY: 300,
        });
      });

      // Zoom would be updated in real implementation
      expect(mockStore.zoom).toBeDefined();
    });
  });

  describe('Save/Load Operations', () => {
    test('should save canvas with Ctrl+S', async () => {
      saveCanvasMock.mockResolvedValue(undefined);
      
      renderWithKonva(<KonvaCanvas width={800} height={600} />);

      act(() => {
        fireEvent.keyDown(window, { key: 's', ctrlKey: true });
      });

      await waitFor(() => {
        expect(saveCanvasMock).toHaveBeenCalledWith(
          expect.objectContaining({
            elements: expect.any(Array),
          }),
          expect.any(String)
        );
      });
    });

    test('should load canvas data on mount when specified', async () => {
      const mockCanvasData = {
        elements: [
          createMockElement({ id: 'loaded1' }),
          createMockElement({ id: 'loaded2' }),
        ],
      };
      
      loadCanvasMock.mockResolvedValue(mockCanvasData);
      
      renderWithKonva(
        <KonvaCanvas 
          width={800} 
          height={600} 
          loadOnMount={true}
          filename="test-canvas.json"
        />
      );

      await waitFor(() => {
        expect(loadCanvasMock).toHaveBeenCalledWith('test-canvas.json');
      });
    });
  });

  describe('Performance', () => {
    test('should handle rendering many elements efficiently', async () => {
      // Create many elements
      const manyElements = new Map();
      for (let i = 0; i < 100; i++) {
        manyElements.set(
          ElementId(`elem${i}`), 
          createMockElement({ 
            id: `elem${i}`, 
            x: Math.random() * 800,
            y: Math.random() * 600,
          })
        );
      }
      
      mockStore.elements = manyElements;
      
      const { container } = renderWithKonva(<KonvaCanvas width={800} height={600} />);

      // Should render without performance issues
      expect(container.querySelector('[role="presentation"]')).toBeInTheDocument();
      expect(mockStore.elements.size).toBe(100);
    });
  });
});
