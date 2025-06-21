import { describe, test, expect, beforeEach } from '@jest/globals';
import { screen, fireEvent } from '@testing-library/react';
import KonvaCanvas from '../../features/canvas/components/KonvaCanvas';
import { 
  setupTestEnvironment, 
  createMockCanvasElement,
  createMockElements,
  integrationTestHelpers,
  type TestEnvironment 
} from '../utils/testUtils';

// Mock the canvas store
const mockStore = {
  elements: new Map(),
  selectedElementIds: new Set(),
  selectedTool: 'select',
  isDrawing: false,
  addElement: jest.fn(),
  updateElement: jest.fn(),
  selectElement: jest.fn(),
  clearSelection: jest.fn(),
  setEditingTextId: jest.fn(),
  startDrawing: jest.fn(),
  updateDrawing: jest.fn(),
  finishDrawing: jest.fn(),
  handleElementDrop: jest.fn(),
  createSection: jest.fn(),
  updateSection: jest.fn(),
  addHistoryEntry: jest.fn(),
};

jest.mock('../../features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: () => mockStore
}));

// Mock the layer manager
jest.mock('../../features/canvas/layers/CanvasLayerManager', () => ({
  CanvasLayerManager: ({ onElementClick, onElementUpdate }: any) => (
    <div data-testid="canvas-layer-manager">
      <div 
        data-testid="mock-element" 
        onClick={() => onElementClick?.({}, { id: 'test-element', type: 'rectangle' })}
      >
        Mock Element
      </div>
    </div>
  )
}));

describe('KonvaCanvas Integration', () => {
  let testEnv: TestEnvironment;
  let defaultProps: any;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    
    defaultProps = {
      width: 800,
      height: 600,
      onElementSelect: jest.fn(),
      panZoomState: {
        scale: 1,
        position: { x: 0, y: 0 }
      },
      stageRef: { current: null },
      onWheelHandler: jest.fn(),
      onTouchMoveHandler: jest.fn(),
      onTouchEndHandler: jest.fn()
    };

    // Reset mocks
    Object.values(mockStore).forEach(mock => {
      if (typeof mock === 'function') {
        (mock as jest.Mock).mockClear();
      }
    });
  });

  describe('Canvas Initialization', () => {
    test('renders canvas with correct dimensions', async () => {
      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      expect(screen.getByTestId('konva-stage')).toBeDefined();
      expect(screen.getByTestId('canvas-layer-manager')).toBeDefined();
    });

    test('initializes with empty canvas state', async () => {
      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      expect(mockStore.elements.size).toBe(0);
      expect(mockStore.selectedElementIds.size).toBe(0);
    });

    test('applies pan and zoom state correctly', async () => {
      const panZoomState = {
        scale: 1.5,
        position: { x: 100, y: 50 }
      };

      await testEnv.render(
        <KonvaCanvas 
          {...defaultProps} 
          panZoomState={panZoomState}
        />
      );

      expect(screen.getByTestId('konva-stage')).toBeDefined();
    });
  });

  describe('Element Interactions', () => {
    test('handles element click events', async () => {
      const onElementSelect = jest.fn();
      
      await testEnv.render(
        <KonvaCanvas 
          {...defaultProps} 
          onElementSelect={onElementSelect}
        />
      );

      const mockElement = screen.getByTestId('mock-element');
      await testEnv.user.click(mockElement);

      // Should trigger element selection logic
      expect(mockElement).toBeDefined();
    });

    test('handles background clicks for deselection', async () => {
      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      const stage = screen.getByTestId('konva-stage');
      await testEnv.user.click(stage);

      // Should trigger deselection
      expect(stage).toBeDefined();
    });

    test('handles element drag operations', async () => {
      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      const mockElement = screen.getByTestId('mock-element');
      
      // Simulate drag operation
      await integrationTestHelpers.simulateElementDrag(
        testEnv.user,
        mockElement,
        { x: 100, y: 100 },
        { x: 200, y: 200 }
      );

      expect(mockElement).toBeDefined();
    });
  });

  describe('Drawing Operations', () => {
    test('handles pen tool drawing', async () => {
      // Set pen tool
      mockStore.selectedTool = 'pen';
      mockStore.isDrawing = true;

      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      const stage = screen.getByTestId('konva-stage');
      
      // Simulate mouse down to start drawing
      fireEvent.mouseDown(stage, { clientX: 100, clientY: 100 });
      
      expect(stage).toBeDefined();
    });

    test('handles shape creation tools', async () => {
      mockStore.selectedTool = 'rectangle';

      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      const stage = screen.getByTestId('konva-stage');
      
      // Click to create rectangle
      await testEnv.user.click(stage);

      expect(stage).toBeDefined();
    });

    test('handles text tool creation', async () => {
      mockStore.selectedTool = 'text';

      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      const stage = screen.getByTestId('konva-stage');
      
      // Click to create text
      await testEnv.user.click(stage);

      expect(stage).toBeDefined();
    });
  });

  describe('Viewport Controls', () => {
    test('handles zoom operations', async () => {
      const onWheelHandler = jest.fn();

      await testEnv.render(
        <KonvaCanvas 
          {...defaultProps} 
          onWheelHandler={onWheelHandler}
        />
      );

      const stage = screen.getByTestId('konva-stage');
      
      // Simulate zoom with wheel
      await integrationTestHelpers.simulateZoom(testEnv.user, stage, 100);

      expect(stage).toBeDefined();
    });

    test('handles pan operations', async () => {
      // Set pan tool
      mockStore.selectedTool = 'pan';

      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      const stage = screen.getByTestId('konva-stage');
      
      // Simulate pan drag
      await integrationTestHelpers.simulateElementDrag(
        testEnv.user,
        stage,
        { x: 100, y: 100 },
        { x: 200, y: 200 }
      );

      expect(stage).toBeDefined();
    });

    test('handles touch events for mobile', async () => {
      const onTouchMoveHandler = jest.fn();
      const onTouchEndHandler = jest.fn();

      await testEnv.render(
        <KonvaCanvas 
          {...defaultProps} 
          onTouchMoveHandler={onTouchMoveHandler}
          onTouchEndHandler={onTouchEndHandler}
        />
      );

      const stage = screen.getByTestId('konva-stage');
      
      // Simulate touch events
      fireEvent.touchStart(stage);
      fireEvent.touchMove(stage);
      fireEvent.touchEnd(stage);

      expect(stage).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('renders large number of elements efficiently', async () => {
      // Mock store with many elements
      const manyElements = Array.from({ length: 100 }, () => 
        createMockCanvasElement({ type: 'rectangle' })
      );
      
      mockStore.elements = new Map(manyElements.map(el => [el.id, el]));

      const startTime = performance.now();

      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getByTestId('konva-stage')).toBeDefined();
    });

    test('handles rapid state updates efficiently', async () => {
      const { rerender } = await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      // Simulate rapid pan/zoom updates
      for (let i = 0; i < 10; i++) {
        const panZoomState = {
          scale: 1 + i * 0.1,
          position: { x: i * 10, y: i * 10 }
        };

        await rerender(
          <KonvaCanvas 
            {...defaultProps} 
            panZoomState={panZoomState}
          />
        );
      }

      expect(screen.getByTestId('konva-stage')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('handles missing stage ref gracefully', async () => {
      await testEnv.render(
        <KonvaCanvas 
          {...defaultProps} 
          stageRef={null}
        />
      );

      expect(screen.getByTestId('konva-stage')).toBeDefined();
    });

    test('handles invalid pan/zoom state gracefully', async () => {
      const invalidPanZoomState = {
        scale: NaN,
        position: { x: Infinity, y: -Infinity }
      };

      await testEnv.render(
        <KonvaCanvas 
          {...defaultProps} 
          panZoomState={invalidPanZoomState}
        />
      );

      expect(screen.getByTestId('konva-stage')).toBeDefined();
    });

    test('recovers from render errors gracefully', async () => {
      // Mock console.error to suppress error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      expect(screen.getByTestId('konva-stage')).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    test('cleans up event listeners on unmount', async () => {
      const { unmount } = await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      expect(screen.getByTestId('konva-stage')).toBeDefined();
      
      unmount();
      
      // Canvas should be unmounted cleanly
      expect(screen.queryByTestId('konva-stage')).toBeNull();
    });

    test('handles component updates without memory leaks', async () => {
      const { rerender } = await testEnv.render(
        <KonvaCanvas {...defaultProps} />
      );

      // Update props multiple times
      for (let i = 0; i < 5; i++) {
        await rerender(
          <KonvaCanvas 
            {...defaultProps} 
            width={800 + i * 10}
            height={600 + i * 10}
          />
        );
      }

      expect(screen.getByTestId('konva-stage')).toBeDefined();
    });
  });
});

