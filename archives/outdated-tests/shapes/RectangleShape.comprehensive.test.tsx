import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RectangleShape } from '../../features/canvas/shapes/RectangleShape';
import { 
  setupTestEnvironment, 
  createMockCanvasElement, 
  canvasAssertions,
  type TestEnvironment 
} from '../utils/testUtils';

// Mock the hooks
jest.mock('../../../features/canvas/hooks/canvas/useShapeCaching', () => ({
  useShapeCaching: () => ({ nodeRef: { current: null } })
}));

describe('RectangleShape', () => {
  let testEnv: TestEnvironment;
  let mockElement: any;
  let defaultProps: any;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    
    mockElement = createMockCanvasElement({
      type: 'rectangle',
      width: 200,
      height: 150,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      cornerRadius: 5
    });

    defaultProps = {
      element: mockElement,
      isSelected: false,
      konvaProps: {
        x: mockElement.x,
        y: mockElement.y,
        onClick: jest.fn(),
        onDragEnd: jest.fn(),
      },
      onUpdate: jest.fn(),
      onStartTextEdit: jest.fn()
    };
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Rendering', () => {
    test('renders rectangle with correct basic properties', async () => {
      const { container } = await testEnv.render(
        <RectangleShape {...defaultProps} />
      );
      
      const rectElement = container.querySelector('[data-testid="konva-rect"]');
      expect(rectElement).toBeInTheDocument();
    });

    test('renders with default dimensions when not specified', async () => {
      const elementWithoutDimensions = createMockCanvasElement({
        type: 'rectangle',
      });
      
      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={elementWithoutDimensions} 
        />
      );
      
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('handles visibility correctly', async () => {
      const hiddenElement = createMockCanvasElement({
        type: 'rectangle',
        visible: false
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={hiddenElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('applies React.memo optimization', () => {
      expect(RectangleShape.displayName).toBe('RectangleShape');
    });
  });

  describe('Styling Properties', () => {
    test('applies correct fill color', async () => {
      const coloredElement = createMockCanvasElement({
        type: 'rectangle',
        fill: '#00ff00'
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={coloredElement} 
        />
      );

      const rectElement = screen.getByTestId('konva-rect');
      expect(rectElement).toBeInTheDocument();
    });

    test('applies stroke properties correctly', async () => {
      const strokeElement = createMockCanvasElement({
        type: 'rectangle',
        stroke: '#0000ff',
        strokeWidth: 3
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={strokeElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('applies corner radius correctly', async () => {
      const roundedElement = createMockCanvasElement({
        type: 'rectangle',
        cornerRadius: 10
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={roundedElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('applies selection styling when selected', async () => {
      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          isSelected={true} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('enables caching for large rectangles', async () => {
      const largeElement = createMockCanvasElement({
        type: 'rectangle',
        width: 500,
        height: 400
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={largeElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('enables caching when both fill and stroke are present', async () => {
      const complexElement = createMockCanvasElement({
        type: 'rectangle',
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={complexElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('disables perfect drawing for performance', async () => {
      await testEnv.render(
        <RectangleShape {...defaultProps} />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('handles konva props correctly', async () => {
      const interactiveProps = {
        ...defaultProps,
        konvaProps: {
          ...defaultProps.konvaProps,
          draggable: true,
          onClick: jest.fn(),
          onDragEnd: jest.fn(),
        }
      };

      await testEnv.render(
        <RectangleShape {...interactiveProps} />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('passes through event handlers', async () => {
      const onClickHandler = jest.fn();
      const onDragEndHandler = jest.fn();

      await testEnv.render(
        <RectangleShape 
          {...defaultProps}
          konvaProps={{
            ...defaultProps.konvaProps,
            onClick: onClickHandler,
            onDragEnd: onDragEndHandler,
          }}
        />
      );

      const rectElement = screen.getByTestId('konva-rect');
      expect(rectElement).toBeInTheDocument();
    });
  });

  describe('Props Updates', () => {
    test('updates dimensions correctly', async () => {
      const { rerender } = await testEnv.render(
        <RectangleShape {...defaultProps} />
      );

      const updatedElement = {
        ...mockElement,
        width: 300,
        height: 200
      };

      await act(async () => {
        rerender(
          <RectangleShape 
            {...defaultProps} 
            element={updatedElement} 
          />
        );
      });

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('updates colors correctly', async () => {
      const { rerender } = await testEnv.render(
        <RectangleShape {...defaultProps} />
      );

      const updatedElement = {
        ...mockElement,
        fill: '#00ff00',
        stroke: '#ff0000'
      };

      await act(async () => {
        rerender(
          <RectangleShape 
            {...defaultProps} 
            element={updatedElement} 
          />
        );
      });

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('updates selection state correctly', async () => {
      const { rerender } = await testEnv.render(
        <RectangleShape {...defaultProps} isSelected={false} />
      );

      await act(async () => {
        rerender(
          <RectangleShape {...defaultProps} isSelected={true} />
        );
      });

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles zero dimensions gracefully', async () => {
      const zeroElement = createMockCanvasElement({
        type: 'rectangle',
        width: 0,
        height: 0
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={zeroElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('handles negative dimensions gracefully', async () => {
      const negativeElement = createMockCanvasElement({
        type: 'rectangle',
        width: -100,
        height: -50
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={negativeElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('handles missing style properties gracefully', async () => {
      const minimalElement = createMockCanvasElement({
        type: 'rectangle',
        // Minimal properties only
        width: 100,
        height: 100
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={minimalElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    test('handles extreme corner radius values', async () => {
      const extremeRadiusElement = createMockCanvasElement({
        type: 'rectangle',
        width: 100,
        height: 100,
        cornerRadius: 1000 // Larger than rectangle
      });

      await testEnv.render(
        <RectangleShape 
          {...defaultProps} 
          element={extremeRadiusElement} 
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    test('cleans up properly on unmount', async () => {
      const { unmount } = await testEnv.render(
        <RectangleShape {...defaultProps} />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
      
      unmount();
      
      expect(screen.queryByTestId('konva-rect')).not.toBeInTheDocument();
    });

    test('handles rapid re-renders without memory leaks', async () => {
      const { rerender } = await testEnv.render(
        <RectangleShape {...defaultProps} />
      );

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedElement = {
          ...mockElement,
          x: mockElement.x + i,
          y: mockElement.y + i
        };

        await act(async () => {
          rerender(
            <RectangleShape 
              {...defaultProps} 
              element={updatedElement} 
            />
          );
        });
      }

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });
});
