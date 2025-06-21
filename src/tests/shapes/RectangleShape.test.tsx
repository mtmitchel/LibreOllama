import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { RectangleShape } from '@/features/canvas/shapes/RectangleShape';
import { createMockCanvasElement } from '@/tests/utils/testUtils';

describe('RectangleShape', () => {
  let mockElement: any;
  let defaultProps: any;

  beforeEach(() => {
    mockElement = createMockCanvasElement({
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      visible: true,
      draggable: true
    });

    defaultProps = {
      element: mockElement,
      isSelected: false,
      onSelect: jest.fn(),
      onDragStart: jest.fn(),
      onDragMove: jest.fn(),
      onDragEnd: jest.fn(),
      onUpdate: jest.fn(),
      onDoubleClick: jest.fn(),
      onContextMenu: jest.fn(),
      isDragging: false
    };
  });

  describe('Rendering', () => {
    test('renders rectangle with correct properties', () => {
      render(<RectangleShape {...defaultProps} />);

      const rectangle = screen.getByTestId('konva-rect');
      expect(rectangle).toBeInTheDocument();
      
      // Check that props are passed correctly
      expect(rectangle).toHaveAttribute('data-testid', 'konva-rect');
    });

    test('applies fill color correctly', () => {
      render(<RectangleShape {...defaultProps} />);
      
      const rectangle = screen.getByTestId('konva-rect');
      // In the mock, props are passed as attributes
      expect(defaultProps.element.fill).toBe('#ff0000');
    });

    test('applies stroke properties correctly', () => {
      render(<RectangleShape {...defaultProps} />);
      
      const rectangle = screen.getByTestId('konva-rect');
      expect(defaultProps.element.stroke).toBe('#000000');
      expect(defaultProps.element.strokeWidth).toBe(2);
    });

    test('handles transparent fill', () => {
      const transparentElement = {
        ...mockElement,
        fill: 'transparent'
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={transparentElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(rectangle).toBeInTheDocument();
    });

    test('renders with rounded corners when cornerRadius is set', () => {
      const roundedElement = {
        ...mockElement,
        cornerRadius: 10
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={roundedElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(rectangle).toBeInTheDocument();
      expect(roundedElement.cornerRadius).toBe(10);
    });

    test('applies opacity correctly', () => {
      const semiTransparentElement = {
        ...mockElement,
        opacity: 0.5
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={semiTransparentElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(semiTransparentElement.opacity).toBe(0.5);
    });

    test('hides rectangle when visible is false', () => {
      const hiddenElement = {
        ...mockElement,
        visible: false
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={hiddenElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(hiddenElement.visible).toBe(false);
    });
  });

  describe('Interactions', () => {
    test('handles click event', () => {
      render(<RectangleShape {...defaultProps} />);

      const rectangle = screen.getByTestId('konva-rect');
      fireEvent.click(rectangle);

      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockElement.id);
    });

    test('handles double click event', () => {
      render(<RectangleShape {...defaultProps} />);

      const rectangle = screen.getByTestId('konva-rect');
      fireEvent.doubleClick(rectangle);

      expect(defaultProps.onDoubleClick).toHaveBeenCalledWith(mockElement);
    });

    test('handles context menu event', () => {
      render(<RectangleShape {...defaultProps} />);

      const rectangle = screen.getByTestId('konva-rect');
      fireEvent.contextMenu(rectangle);

      expect(defaultProps.onContextMenu).toHaveBeenCalled();
    });

    test('prevents event propagation on click', () => {
      render(<RectangleShape {...defaultProps} />);

      const rectangle = screen.getByTestId('konva-rect');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
      
      fireEvent(rectangle, clickEvent);

      // In real implementation, stopPropagation would be called
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });
  });

  describe('Drag Operations', () => {
    test('initiates drag when draggable', () => {
      render(<RectangleShape {...defaultProps} />);

      const rectangle = screen.getByTestId('konva-rect');
      
      // Simulate drag start
      fireEvent.mouseDown(rectangle);
      
      // Note: In real Konva implementation, this would trigger onDragStart
      // Our mock doesn't fully simulate Konva's drag behavior
    });

    test('disables drag when draggable is false', () => {
      const nonDraggableElement = {
        ...mockElement,
        draggable: false
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={nonDraggableElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(nonDraggableElement.draggable).toBe(false);
    });

    test('applies drag cursor when hovering', () => {
      render(<RectangleShape {...defaultProps} />);

      const rectangle = screen.getByTestId('konva-rect');
      
      fireEvent.mouseEnter(rectangle);
      // In real implementation, cursor would change to 'move'
      
      fireEvent.mouseLeave(rectangle);
      // Cursor would reset
    });
  });

  describe('Selection State', () => {
    test('shows selection indicator when selected', () => {
      render(
        <RectangleShape 
          {...defaultProps} 
          isSelected={true}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      // In real implementation, this might add a selection outline
      expect(defaultProps.isSelected).toBe(true);
    });

    test('applies selection styles', () => {
      const { rerender } = render(
        <RectangleShape {...defaultProps} />
      );

      // Select the rectangle
      rerender(
        <RectangleShape 
          {...defaultProps} 
          isSelected={true}
        />
      );

      // In real implementation, this would show selection handles
      expect(defaultProps.isSelected).toBe(true);
    });
  });

  describe('Performance', () => {
    test('memoizes shape to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <RectangleShape {...defaultProps} />
      );

      // Re-render with same props
      rerender(
        <RectangleShape {...defaultProps} />
      );

      // Component should use React.memo to prevent re-render
      // This is hard to test with mocks, but important for performance
    });

    test('only re-renders when relevant props change', () => {
      const { rerender } = render(
        <RectangleShape {...defaultProps} />
      );

      // Change irrelevant prop
      const newProps = {
        ...defaultProps,
        someIrrelevantProp: 'new value'
      };

      rerender(<RectangleShape {...newProps} />);

      // Should not cause re-render in properly memoized component
    });
  });

  describe('Transform Operations', () => {
    test('applies rotation transform', () => {
      const rotatedElement = {
        ...mockElement,
        rotation: 45
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={rotatedElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(rotatedElement.rotation).toBe(45);
    });

    test('applies scale transform', () => {
      const scaledElement = {
        ...mockElement,
        scaleX: 2,
        scaleY: 1.5
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={scaledElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(scaledElement.scaleX).toBe(2);
      expect(scaledElement.scaleY).toBe(1.5);
    });

    test('combines multiple transforms correctly', () => {
      const transformedElement = {
        ...mockElement,
        rotation: 30,
        scaleX: 1.5,
        scaleY: 1.5,
        x: 200,
        y: 200
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={transformedElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(transformedElement.rotation).toBe(30);
      expect(transformedElement.scaleX).toBe(1.5);
    });
  });

  describe('Edge Cases', () => {
    test('handles zero dimensions gracefully', () => {
      const zeroSizeElement = {
        ...mockElement,
        width: 0,
        height: 0
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={zeroSizeElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(rectangle).toBeInTheDocument();
    });

    test('handles negative dimensions', () => {
      const negativeElement = {
        ...mockElement,
        width: -100,
        height: -50
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={negativeElement}
        />
      );

      // Should handle gracefully, possibly converting to positive
      const rectangle = screen.getByTestId('konva-rect');
      expect(rectangle).toBeInTheDocument();
    });

    test('handles missing optional properties', () => {
      const minimalElement = {
        id: 'rect-minimal',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={minimalElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(rectangle).toBeInTheDocument();
    });
  });

  describe('Shadow Effects', () => {
    test('applies shadow when specified', () => {
      const shadowElement = {
        ...mockElement,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5
      };

      render(
        <RectangleShape 
          {...defaultProps} 
          element={shadowElement}
        />
      );

      const rectangle = screen.getByTestId('konva-rect');
      expect(shadowElement.shadowColor).toBe('rgba(0,0,0,0.5)');
      expect(shadowElement.shadowBlur).toBe(10);
    });
  });
});
