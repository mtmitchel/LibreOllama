// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach, afterEach
import { vi } from 'vitest';

// Mock canvas module FIRST, before any other imports
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { renderWithKonva } from '@/tests/utils/konva-test-utils';
import KonvaCanvas from '@/features/canvas/components/KonvaCanvas';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { useTauriCanvas } from '@/features/canvas/hooks/useTauriCanvas';
import { ElementId } from '@/features/canvas/types/enhanced.types';

// Mock store using a factory function
const mockStore = {
  elements: new Map(),
  sections: new Map(),
  selectedElementIds: new Set<string>(),
  selectedSectionIds: new Set<string>(),
  selectedTool: 'select',
  isDrawing: false,
  currentPath: [],
  addElement: vi.fn(),
  updateElement: vi.fn(),
  deleteElement: vi.fn(),
  selectElement: vi.fn(),
  clearSelection: vi.fn(),
  setSelectedTool: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  addHistoryEntry: vi.fn(),
  zoom: 1,
  pan: { x: 0, y: 0 },
  setPan: vi.fn(),
  setZoom: vi.fn(),
  reset: vi.fn(),
  // Mock enhanced store properties
  canvasSize: { width: 800, height: 600 },
  viewport: { x: 0, y: 0, scale: 1 },
  performance: { renderCount: 0 },
};

vi.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

vi.mock('@/features/canvas/hooks/useTauriCanvas');

const mockUseTauriCanvas = useTauriCanvas as any;

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

// Helper to create mock canvas props
const createMockCanvasProps = (overrides = {}) => ({
  width: 800,
  height: 600,
  panZoomState: {
    scale: 1,
    position: { x: 0, y: 0 }
  },
  stageRef: { current: null },
  onWheelHandler: vi.fn(),
  ...overrides,
});

// Helper to render KonvaCanvas with required props
const renderKonvaCanvas = (props = {}) => {
  const canvasProps = createMockCanvasProps(props);
  return renderWithKonva(<KonvaCanvas {...canvasProps} />);
};

describe('KonvaCanvas', () => {
  // Mock Tauri canvas methods
  const saveCanvasMock = vi.fn() as any;
  const loadCanvasMock = vi.fn() as any;

  let mockTauriCanvas: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock store state
    mockStore.elements.clear();
    mockStore.elements.set(ElementId('elem1'), createMockElement({ id: 'elem1', type: 'rectangle', x: 10, y: 10 }));
    mockStore.elements.set(ElementId('elem2'), createMockElement({ id: 'elem2', type: 'circle', x: 100, y: 100 }));
    mockStore.selectedElementIds.clear();
    mockStore.selectedTool = 'select';
    mockStore.isDrawing = false;
    mockStore.currentPath = [];
    mockStore.zoom = 1;
    mockStore.pan = { x: 0, y: 0 };

    // Setup mock Tauri canvas
    mockTauriCanvas = {
      saveCanvas: saveCanvasMock,
      loadCanvas: loadCanvasMock,
      isLoading: false,
      error: null,
      isSaved: true,
    };

    mockUseTauriCanvas.mockReturnValue(mockTauriCanvas);
  });

  afterEach(() => {
    act(() => {
      vi.clearAllMocks();
    });
  });

  describe('Drawing Actions', () => {
    test('should create a rectangle element when drawing with rectangle tool', async () => {
      // Set tool to rectangle
      mockStore.selectedTool = 'rectangle';
      
      renderKonvaCanvas();

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
      expect(mockStore.addElement).toHaveBeenCalledTimes(1);
      expect(mockStore.addElement).toHaveBeenCalledWith(
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
      
      renderKonvaCanvas();

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Simulate drawing a circle
      act(() => {
        fireEvent.mouseDown(canvas!, { clientX: 150, clientY: 150 });
        fireEvent.mouseMove(canvas!, { clientX: 250, clientY: 250 });
        fireEvent.mouseUp(canvas!, { clientX: 250, clientY: 250 });
      });

      expect(mockStore.addElement).toHaveBeenCalledWith(
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
      
      renderKonvaCanvas();

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

      expect(mockStore.addElement).toHaveBeenCalledWith(
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
      
      renderKonvaCanvas();

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Simulate clicking on an element's position
      act(() => {
        fireEvent.click(canvas!, { 
          clientX: 15, // Near elem1's position
          clientY: 15,
        });
      });

      // Verify selectElement was called with the element at that position
      expect(mockStore.selectElement).toHaveBeenCalledWith('elem1');
    });

    test('should clear selection when clicking empty space', async () => {
      mockStore.selectedTool = 'select';
      mockStore.selectedElementIds = new Set(['elem1']);
      
      renderKonvaCanvas();

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Click on empty space
      act(() => {
        fireEvent.click(canvas!, { 
          clientX: 400, // Empty area
          clientY: 400,
        });
      });

      expect(mockStore.clearSelection).toHaveBeenCalled();
    });

    test('should handle multi-selection with Shift key', async () => {
      mockStore.selectedTool = 'select';
      mockStore.selectedElementIds = new Set(['elem1']);
      
      renderKonvaCanvas();

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Shift-click to add to selection
      act(() => {
        fireEvent.click(canvas!, { 
          clientX: 105, // Near elem2's position
          clientY: 105,
          shiftKey: true,
        });
      });

      // Verify selectElement was called with multi-select flag
      expect(mockStore.selectElement).toHaveBeenCalledWith('elem2', true);
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should handle undo/redo shortcuts', async () => {
      renderKonvaCanvas();

      // Undo
      act(() => {
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      });
      expect(mockStore.undo).toHaveBeenCalledTimes(1);

      // Redo
      act(() => {
        fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      });
      expect(mockStore.redo).toHaveBeenCalledTimes(1);
    });

    test('should delete selected elements on Delete key', async () => {
      mockStore.selectedElementIds = new Set(['elem1']);
      
      renderKonvaCanvas();

      act(() => {
        fireEvent.keyDown(window, { key: 'Delete' });
      });

      expect(mockStore.deleteElement).toHaveBeenCalledWith('elem1');
    });

    test('should clear selection on Escape key', async () => {
      mockStore.selectedElementIds = new Set(['elem1', 'elem2']);
      
      renderKonvaCanvas();

      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(mockStore.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Canvas Transformation', () => {
    test('should handle element dragging', async () => {
      mockStore.selectedTool = 'select';
      const elem1 = mockStore.elements.get(ElementId('elem1'));
      
      renderKonvaCanvas();

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Simulate dragging an element
      act(() => {
        fireEvent.mouseDown(canvas!, { clientX: 15, clientY: 15 });
        fireEvent.mouseMove(canvas!, { clientX: 50, clientY: 50 });
        fireEvent.mouseUp(canvas!, { clientX: 50, clientY: 50 });
      });

      // Verify the element update was called with new position
      expect(mockStore.updateElement).toHaveBeenCalledWith(
        'elem1',
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
    });

    test('should handle canvas panning with space key', async () => {
      // Add setPan mock to the store
      const setPanMock = vi.fn();
      mockStore.setPan = setPanMock;
      
      renderKonvaCanvas();

      const canvas = screen.getByRole('presentation').querySelector('canvas');

      // Hold space and drag to pan
      act(() => {
        fireEvent.keyDown(window, { key: ' ' });
        fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas!, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas!, { clientX: 150, clientY: 150 });
        fireEvent.keyUp(window, { key: ' ' });
      });

      // Verify setPan was called with the pan delta
      expect(setPanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
    });

    test('should handle zoom with Ctrl+wheel', async () => {
      // Add setZoom mock to the store
      const setZoomMock = vi.fn();
      mockStore.setZoom = setZoomMock;
      
      renderKonvaCanvas();

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

      // Verify setZoom was called with new zoom level
      expect(setZoomMock).toHaveBeenCalledWith(
        expect.any(Number)
      );
    });
  });

  describe('Save/Load Operations', () => {
    test('should save canvas with Ctrl+S', async () => {
      saveCanvasMock.mockResolvedValue(void 0);
      
      renderKonvaCanvas();

      act(() => {
        fireEvent.keyDown(window, { key: 's', ctrlKey: true });
      });

      await waitFor(() => {
        expect(saveCanvasMock).toHaveBeenCalled();
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
        expect(loadCanvasMock).toHaveBeenCalled();
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
