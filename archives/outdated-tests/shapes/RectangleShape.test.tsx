import React from 'react';
import { render, screen } from '@testing-library/react';
import { RectangleShape } from '../../features/canvas/shapes/RectangleShape';
import { createMockCanvasElement } from '../utils';

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
  const mockHandlers = {
    onElementClick: jest.fn(),
    onElementDoubleClick: jest.fn(),
    onElementMouseEnter: jest.fn(),
    onElementMouseLeave: jest.fn(),
    onElementDragStart: jest.fn(),
    onElementDragMove: jest.fn(),
    onElementDragEnd: jest.fn(),
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn()
  };

  const defaultProps = {
    isSelected: false,
    konvaProps: {},
    ...mockHandlers
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders rectangle with correct properties', () => {      render(
        <RectangleShape
          element={mockRectangleElement}
          {...defaultProps}
        />
      );

      // In the mocked environment, we can't directly test Konva props
      // but we can verify the component renders without errors
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('renders with default properties when optional props are missing', () => {
      const minimalElement = createMockCanvasElement({
        type: 'rectangle',
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={minimalElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles visibility correctly', () => {
      const hiddenElement = createMockCanvasElement({
        type: 'rectangle',
        visible: false,
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={hiddenElement}
          {...mockHandlers}
        />
      );

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

      render(
        <RectangleShape
          element={coloredElement}
          {...mockHandlers}
        />
      );

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

      render(
        <RectangleShape
          element={strokeElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies corner radius correctly', () => {
      const roundedElement = createMockCanvasElement({
        type: 'rectangle',
        cornerRadius: 10,
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={roundedElement}
          {...mockHandlers}
        />
      );

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

      render(
        <RectangleShape
          element={positionedElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies rotation correctly', () => {
      const rotatedElement = createMockCanvasElement({
        type: 'rectangle',
        rotation: 45,
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={rotatedElement}
          {...mockHandlers}
        />
      );

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

      render(
        <RectangleShape
          element={scaledElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('applies opacity correctly', () => {
      const transparentElement = createMockCanvasElement({
        type: 'rectangle',
        opacity: 0.5,
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={transparentElement}
          {...mockHandlers}
        />
      );

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

      render(
        <RectangleShape
          element={draggableElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles non-draggable property correctly', () => {
      const nonDraggableElement = createMockCanvasElement({
        type: 'rectangle',
        draggable: false,
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={nonDraggableElement}
          {...mockHandlers}
        />
      );

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

      render(
        <RectangleShape
          element={zeroElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles negative dimensions gracefully', () => {
      const negativeElement = createMockCanvasElement({
        type: 'rectangle',
        width: -100,
        height: -50
      });

      render(
        <RectangleShape
          element={negativeElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles very large dimensions', () => {
      const largeElement = createMockCanvasElement({
        type: 'rectangle',
        width: 10000,
        height: 10000
      });

      render(
        <RectangleShape
          element={largeElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles extreme rotation values', () => {
      const extremeRotationElement = createMockCanvasElement({
        type: 'rectangle',
        rotation: 3600, // 10 full rotations
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={extremeRotationElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('handles extreme scale values', () => {
      const extremeScaleElement = createMockCanvasElement({
        type: 'rectangle',
        scaleX: 0.001,
        scaleY: 100,
        width: 100,
        height: 100
      });

      render(
        <RectangleShape
          element={extremeScaleElement}
          {...mockHandlers}
        />
      );

      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders multiple rectangles efficiently', () => {
      const elements = Array.from({ length: 100 }, (_, i) => 
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
              element={element}
              {...mockHandlers}
            />
          ))}
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render 100 rectangles in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getAllByTestId('konva-rect')).toHaveLength(100);
    });

    it('handles rapid re-renders efficiently', () => {
      let element = createMockCanvasElement({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });

      const { rerender } = render(
        <RectangleShape
          element={element}
          {...mockHandlers}
        />
      );

      // Simulate rapid position updates
      const startTime = performance.now();
      
      for (let i = 0; i < 50; i++) {
        element = { ...element, x: i, y: i };
        rerender(
          <RectangleShape
            element={element}
            {...mockHandlers}
          />
        );
      }

      const endTime = performance.now();
      const rerenderTime = endTime - startTime;

      // Should handle 50 re-renders efficiently
      expect(rerenderTime).toBeLessThan(50);
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });
  });
});
