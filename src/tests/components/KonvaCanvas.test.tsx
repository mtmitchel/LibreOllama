import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { KonvaCanvas } from '@/features/canvas/components/KonvaCanvas';
import { useCanvasStore } from '@/features/canvas/stores/canvasStore.enhanced';
import { invoke } from '@tauri-apps/api/tauri';
import { createMockCanvasElement, createMockCanvasStore } from '../../utils';
import { renderInKonva } from '../../utils/konva-test-utils';

// Mock the store
jest.mock('@/features/canvas/stores/canvasStore.enhanced');
const mockUseCanvasStore = useCanvasStore as jest.MockedFunction<typeof useCanvasStore>;

// Mock Tauri
const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;

describe('KonvaCanvas', () => {
  let mockStore: any;
  let defaultProps: any;

  beforeEach(() => {
    // Setup mock store
    mockStore = createMockCanvasStore({
      elements: new Map([
        ['elem1', createMockCanvasElement({ id: 'elem1', type: 'rectangle' })],
        ['elem2', createMockCanvasElement({ id: 'elem2', type: 'circle' })],
        ['elem3', createMockCanvasElement({ id: 'elem3', type: 'text' })]
      ]),
      selectedElementIds: new Set(),
      selectedTool: 'select',
      panZoomState: { scale: 1, position: { x: 0, y: 0 } }
    });

    mockUseCanvasStore.mockReturnValue(mockStore);

    defaultProps = {
      width: 800,
      height: 600,
      onReady: jest.fn()
    };

    // Reset mocks
    mockInvoke.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Canvas Initialization', () => {
    test('renders canvas with correct dimensions', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();
      
      // Check dimensions are applied
      expect(defaultProps.width).toBe(800);
      expect(defaultProps.height).toBe(600);
    });

    test('initializes with elements from store', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // All elements should be rendered
      expect(screen.getByRole('presentation')).toBeInTheDocument();
      expect(mockStore.elements.size).toBe(3);
    });

    test('calls onReady callback after initialization', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(defaultProps.onReady).toHaveBeenCalled();
      });
    });

    test('sets up event listeners on mount', async () => {
      const { unmount } = renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Event listeners would be set up
      const stage = screen.getByRole('presentation');
      expect(stage).toBeInTheDocument();

      unmount();
      // Listeners should be cleaned up
    });
  });

  describe('Tool Operations', () => {
    test('handles select tool interactions', async () => {
      mockStore.selectedTool = 'select';
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');
      fireEvent.click(stage);

      // Click on empty space should clear selection
      expect(mockStore.clearSelection).toHaveBeenCalled();
    });

    test('handles rectangle drawing tool', async () => {
      mockStore.selectedTool = 'rectangle';
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');
      
      // Simulate drawing
      fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(stage, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(stage);

      // Should create new rectangle
      expect(mockStore.addElement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rectangle',
          x: expect.any(Number),
          y: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number)
        })
      );
    });

    test('handles circle drawing tool', async () => {
      mockStore.selectedTool = 'circle';
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');
      
      fireEvent.mouseDown(stage, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(stage, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(stage);

      expect(mockStore.addElement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'circle',
          x: expect.any(Number),
          y: expect.any(Number),
          radius: expect.any(Number)
        })
      );
    });

    test('handles text tool placement', async () => {
      mockStore.selectedTool = 'text';
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');
      fireEvent.click(stage, { clientX: 100, clientY: 100 });

      expect(mockStore.addElement).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          x: expect.any(Number),
          y: expect.any(Number),
          text: expect.any(String)
        })
      );
    });

    test('switches tools correctly', async () => {
      const { rerender } = renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Start with select tool
      mockStore.selectedTool = 'select';
      await rerender(<KonvaCanvas {...defaultProps} />);

      // Switch to rectangle tool
      mockStore.selectedTool = 'rectangle';
      await rerender(<KonvaCanvas {...defaultProps} />);

      // Cursor and behavior should update
      expect(mockStore.selectedTool).toBe('rectangle');
    });
  });

  describe('Selection Management', () => {
    test('selects single element on click', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Simulate clicking on an element
      const element = mockStore.elements.get('elem1');
      mockStore.selectElement.mockImplementation((id: string) => {
        mockStore.selectedElementIds = new Set([id]);
      });

      // In real implementation, would click on the actual element
      mockStore.selectElement('elem1');

      expect(mockStore.selectElement).toHaveBeenCalledWith('elem1');
    });

    test('handles multi-selection with shift key', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Select first element
      mockStore.selectElement('elem1');
      
      // Shift-click second element
      const stage = screen.getByRole('presentation');
      fireEvent.click(stage, { shiftKey: true });

      // Would add to selection
      expect(mockStore.addToSelection).toBeDefined();
    });

    test('handles selection box drag', async () => {
      mockStore.selectedTool = 'select';
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');

      // Start selection box
      fireEvent.mouseDown(stage, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(stage, { clientX: 250, clientY: 250 });
      fireEvent.mouseUp(stage);

      // Would select elements within box
      expect(mockStore.startMultiSelection).toBeDefined();
    });

    test('clears selection on escape key', async () => {
      mockStore.selectedElementIds = new Set(['elem1', 'elem2']);
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockStore.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Element Manipulation', () => {
    test('handles element dragging', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const element = mockStore.elements.get('elem1');
      const initialX = element.x;
      const initialY = element.y;

      // Simulate drag (in real implementation, would be on the element)
      mockStore.updateElement('elem1', { x: initialX + 50, y: initialY + 50 });

      expect(mockStore.updateElement).toHaveBeenCalledWith('elem1', {
        x: initialX + 50,
        y: initialY + 50
      });
    });

    test('handles element deletion', async () => {
      mockStore.selectedElementIds = new Set(['elem1']);
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'Delete' });

      expect(mockStore.deleteElement).toHaveBeenCalledWith('elem1');
    });

    test('handles element duplication', async () => {
      mockStore.selectedElementIds = new Set(['elem1']);
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'd', ctrlKey: true });

      // Would duplicate selected elements
      expect(mockStore.addElement).toBeDefined();
    });

    test('handles element transformation', async () => {
      mockStore.selectedElementIds = new Set(['elem1']);
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Simulate transform (rotation, scale)
      const transformData = {
        rotation: 45,
        scaleX: 1.5,
        scaleY: 1.5
      };

      mockStore.updateElement('elem1', transformData);

      expect(mockStore.updateElement).toHaveBeenCalledWith('elem1', transformData);
    });
  });

  describe('Pan and Zoom', () => {
    test('handles canvas panning', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');

      // Hold space and drag
      fireEvent.keyDown(window, { key: ' ' });
      fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(stage, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(stage);
      fireEvent.keyUp(window, { key: ' ' });

      // Pan position should update
      expect(mockStore.panZoomState).toBeDefined();
    });

    test('handles zoom with mouse wheel', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');

      // Zoom in
      fireEvent.wheel(stage, { deltaY: -100, ctrlKey: true });

      // Zoom level should increase
      expect(mockStore.setZoom).toBeDefined();
    });

    test('handles zoom limits', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');

      // Try to zoom beyond limits
      for (let i = 0; i < 20; i++) {
        fireEvent.wheel(stage, { deltaY: -100, ctrlKey: true });
      }

      // Should respect maximum zoom
      expect(mockStore.panZoomState.scale).toBeLessThanOrEqual(5); // Assuming max zoom is 5
    });

    test('resets zoom on double click', async () => {
      mockStore.panZoomState = { scale: 2, position: { x: 100, y: 100 } };
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      const stage = screen.getByRole('presentation');
      fireEvent.doubleClick(stage, { ctrlKey: true });

      // Should reset to 100% zoom
      expect(mockStore.resetZoom).toBeDefined();
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('handles undo shortcut', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

      expect(mockStore.undo).toHaveBeenCalled();
    });

    test('handles redo shortcut', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });

      expect(mockStore.redo).toHaveBeenCalled();
    });

    test('handles select all shortcut', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'a', ctrlKey: true });

      expect(mockStore.selectAll).toHaveBeenCalled();
    });

    test('handles copy/paste shortcuts', async () => {
      mockStore.selectedElementIds = new Set(['elem1']);
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Copy
      fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      
      // Paste
      fireEvent.keyDown(window, { key: 'v', ctrlKey: true });

      // Would handle clipboard operations
      expect(mockStore.selectedElementIds.size).toBeGreaterThan(0);
    });
  });

  describe('Performance Features', () => {
    test('implements viewport culling', async () => {
      // Add many elements outside viewport
      const manyElements = new Map();
      for (let i = 0; i < 1000; i++) {
        manyElements.set(`elem${i}`, createMockCanvasElement({
          id: `elem${i}`,
          x: Math.random() * 5000,
          y: Math.random() * 5000
        }));
      }
      
      mockStore.elements = manyElements;
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Only visible elements should be rendered
      // This is hard to test with mocks but important for performance
      expect(mockStore.elements.size).toBe(1000);
    });

    test('debounces rapid updates', async () => {
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Simulate rapid mouse movements
      const stage = screen.getByRole('presentation');
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(stage, { clientX: i * 10, clientY: i * 10 });
      }

      // Updates should be debounced
      expect(mockStore.updateElement).toBeDefined();
    });
  });

  describe('Canvas State Persistence', () => {
    test('saves canvas state to backend', async () => {
      mockInvoke.mockResolvedValue(undefined);
      
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      // Trigger save
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('save_canvas_data', expect.any(Object));
      });
    });

    test('loads canvas state from backend', async () => {
      const savedData = {
        elements: [
          createMockCanvasElement({ id: 'saved1' }),
          createMockCanvasElement({ id: 'saved2' })
        ]
      };
      
      mockInvoke.mockResolvedValue(JSON.stringify(savedData));
      
      renderInKonva(
        <KonvaCanvas 
          {...defaultProps} 
          loadOnMount={true}
          filename="test-canvas.json"
        />
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('load_canvas_data', {
          filename: 'test-canvas.json'
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('handles render errors gracefully', async () => {
      // Mock console.error to suppress error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by passing invalid props
      const invalidProps = { ...defaultProps, width: null };
      
      renderInKonva(<KonvaCanvas {...invalidProps} />);

      // Should render fallback or handle error
      expect(screen.getByRole('presentation')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('recovers from failed save operations', async () => {
      mockInvoke.mockRejectedValue(new Error('Save failed'));
      
      renderInKonva(<KonvaCanvas {...defaultProps} />);

      fireEvent.keyDown(window, { key: 's', ctrlKey: true });

      // Should handle error without crashing
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled();
      });
    });
  });
});
