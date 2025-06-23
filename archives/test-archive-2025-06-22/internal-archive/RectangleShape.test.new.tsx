import { render, screen } from '@testing-library/react';
import { RectangleShape } from '../../features/canvas/shapes/RectangleShape';
import { createMockCanvasElement } from '../utils';

// Mock the useShapeCaching hook
jest.mock('../../features/canvas/hooks/canvas/useShapeCaching', () => ({
  useShapeCaching: () => ({ nodeRef: { current: null } })
}));

describe('RectangleShape', () => {
  const mockRectangleElement = createMockCanvasElement({
    type: 'rectangle',
    width: 200,
    height: 150,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    cornerRadius: 5
  });

  const defaultProps = {
    element: mockRectangleElement,
    isSelected: false,
    konvaProps: {},
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders rectangle with correct properties', () => {
      render(<RectangleShape {...defaultProps} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('renders with default properties when optional props are missing', () => {
      const minimalElement = createMockCanvasElement({
        type: 'rectangle',
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={minimalElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles visibility correctly', () => {
      const hiddenElement = createMockCanvasElement({
        type: 'rectangle',
        visible: false,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={hiddenElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct fill color', () => {
      const coloredElement = createMockCanvasElement({
        type: 'rectangle',
        fill: '#00ff00',
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={coloredElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies correct stroke properties', () => {
      const strokeElement = createMockCanvasElement({
        type: 'rectangle',
        stroke: '#0000ff',
        strokeWidth: 3,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={strokeElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies corner radius correctly', () => {
      const roundedElement = createMockCanvasElement({
        type: 'rectangle',
        cornerRadius: 10,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={roundedElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Transformations', () => {
    it('applies position correctly', () => {
      const positionedElement = createMockCanvasElement({
        type: 'rectangle',
        x: 50,
        y: 75,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={positionedElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies rotation correctly', () => {
      const rotatedElement = createMockCanvasElement({
        type: 'rectangle',
        rotation: 45,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={rotatedElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies scale correctly', () => {
      const scaledElement = createMockCanvasElement({
        type: 'rectangle',
        scaleX: 1.5,
        scaleY: 0.8,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={scaledElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies opacity correctly', () => {
      const transparentElement = createMockCanvasElement({
        type: 'rectangle',
        opacity: 0.5,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={transparentElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('handles draggable property correctly', () => {
      const draggableElement = createMockCanvasElement({
        type: 'rectangle',
        draggable: true,
        width: 100,
        height: 100
      });

      render(<RectangleShape {...defaultProps} element={draggableElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles selection state', () => {
      render(<RectangleShape {...defaultProps} isSelected={true} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero dimensions gracefully', () => {
      const zeroElement = createMockCanvasElement({
        type: 'rectangle',
        width: 0,
        height: 0
      });

      render(<RectangleShape {...defaultProps} element={zeroElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles negative dimensions gracefully', () => {
      const negativeElement = createMockCanvasElement({
        type: 'rectangle',
        width: -100,
        height: -50
      });

      render(<RectangleShape {...defaultProps} element={negativeElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles very large dimensions', () => {
      const largeElement = createMockCanvasElement({
        type: 'rectangle',
        width: 10000,
        height: 10000
      });

      render(<RectangleShape {...defaultProps} element={largeElement} />);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders multiple rectangles efficiently', () => {
      const elements = Array.from({ length: 50 }, (_, i) => 
        createMockCanvasElement({
          id: `rect-${i}`,
          type: 'rectangle',
          x: i * 10,
          y: i * 10,
          width: 50,
          height: 50
        })
      );

      const startTime = performance.now();
      
      render(
        <div>
          {elements.map(element => (
            <RectangleShape
              key={element.id}
              {...defaultProps}
              element={element}
            />
          ))}
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100);
      expect(screen.getAllByTestId('konva-rect')).toHaveLength(50);
    });

    it('handles rapid re-renders efficiently', () => {
      let element = createMockCanvasElement({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });

      const { rerender } = render(<RectangleShape {...defaultProps} element={element} />);

      const startTime = performance.now();
      
      for (let i = 0; i < 25; i++) {
        element = { ...element, x: i, y: i };
        rerender(<RectangleShape {...defaultProps} element={element} />);
      }

      const endTime = performance.now();
      const rerenderTime = endTime - startTime;

      expect(rerenderTime).toBeLessThan(50);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });
});
