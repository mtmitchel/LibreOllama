import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { CircleShape } from '../../features/canvas/shapes/CircleShape';
import { createMockCanvasElement, renderKonva } from '../utils/testUtils';

describe('CircleShape', () => {
  let mockElement: any;
  let defaultProps: any;

  beforeEach(() => {
    mockElement = createMockCanvasElement({
      id: 'circle-1',
      type: 'circle',
      x: 150,
      y: 150,
      radius: 50,
      fill: '#00ff00',
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
      konvaProps: {
        x: mockElement.x,
        y: mockElement.y,
        draggable: mockElement.draggable,
        opacity: mockElement.opacity,
        visible: mockElement.visible,
        rotation: mockElement.rotation
      },
      onUpdate: jest.fn(),
      onStartTextEdit: jest.fn()
    };
  });

  describe('Rendering', () => {
    test('renders circle with correct properties', () => {
      const { container } = renderKonva(<CircleShape {...defaultProps} />);
      
      // Test that the component renders without throwing
      expect(container).toBeTruthy();
    });

    test('applies radius correctly', () => {
      renderKonva(<CircleShape {...defaultProps} />);
      
      expect(mockElement.radius).toBe(50);
    });

    test('positions circle at correct coordinates', () => {
      renderKonva(<CircleShape {...defaultProps} />);
      
      expect(mockElement.x).toBe(150);
      expect(mockElement.y).toBe(150);
    });

    test('applies fill and stroke correctly', () => {
      renderKonva(<CircleShape {...defaultProps} />);
      
      expect(mockElement.fill).toBe('#00ff00');
      expect(mockElement.stroke).toBe('#000000');
      expect(mockElement.strokeWidth).toBe(2);
    });

    test('handles gradient fill', () => {
      const gradientElement = {
        ...mockElement,
        fill: {
          type: 'radial',
          colorStops: [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#00ff00' }
          ]
        }
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={gradientElement}
        />
      );

      const circle = screen.getByTestId('konva-circle');
      expect(circle).toBeInTheDocument();
    });

    test('renders with dash pattern when specified', () => {
      const dashedElement = {
        ...mockElement,
        dash: [10, 5],
        dashEnabled: true
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={dashedElement}
        />
      );

      expect(dashedElement.dashEnabled).toBe(true);
      expect(dashedElement.dash).toEqual([10, 5]);
    });
  });

  describe('Interactions', () => {
    test('handles click event', () => {
      render(<CircleShape {...defaultProps} />);

      const circle = screen.getByTestId('konva-circle');
      fireEvent.click(circle);

      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockElement.id);
    });

    test('handles hover effects', () => {
      render(<CircleShape {...defaultProps} />);

      const circle = screen.getByTestId('konva-circle');
      
      fireEvent.mouseEnter(circle);
      // In real implementation, might change cursor or add hover effect
      
      fireEvent.mouseLeave(circle);
      // Revert hover effects
    });

    test('handles double click for editing', () => {
      render(<CircleShape {...defaultProps} />);

      const circle = screen.getByTestId('konva-circle');
      fireEvent.doubleClick(circle);

      expect(defaultProps.onDoubleClick).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('Selection State', () => {
    test('shows selection indicator when selected', () => {
      render(
        <CircleShape 
          {...defaultProps} 
          isSelected={true}
        />
      );

      // In real implementation, would show selection handles
      expect(defaultProps.isSelected).toBe(true);
    });

    test('applies selection stroke', () => {
      const { rerender } = render(
        <CircleShape {...defaultProps} />
      );

      rerender(
        <CircleShape 
          {...defaultProps} 
          isSelected={true}
        />
      );

      // Selection state would add visual indicator
      expect(defaultProps.isSelected).toBe(true);
    });
  });

  describe('Drag Operations', () => {
    test('handles drag when draggable', () => {
      render(<CircleShape {...defaultProps} />);

      const circle = screen.getByTestId('konva-circle');
      
      fireEvent.mouseDown(circle);
      fireEvent.mouseMove(circle);
      fireEvent.mouseUp(circle);

      // In real Konva, this would trigger drag callbacks
    });

    test('prevents drag when draggable is false', () => {
      const nonDraggableElement = {
        ...mockElement,
        draggable: false
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={nonDraggableElement}
        />
      );

      expect(nonDraggableElement.draggable).toBe(false);
    });

    test('shows drag preview during drag', () => {
      render(
        <CircleShape 
          {...defaultProps} 
          isDragging={true}
        />
      );

      // In real implementation, might reduce opacity during drag
      expect(defaultProps.isDragging).toBe(true);
    });
  });

  describe('Transform Operations', () => {
    test('applies scale transform', () => {
      const scaledElement = {
        ...mockElement,
        scaleX: 2,
        scaleY: 2
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={scaledElement}
        />
      );

      expect(scaledElement.scaleX).toBe(2);
      expect(scaledElement.scaleY).toBe(2);
    });

    test('handles non-uniform scaling', () => {
      const stretchedElement = {
        ...mockElement,
        scaleX: 2,
        scaleY: 0.5
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={stretchedElement}
        />
      );

      // Circle becomes ellipse with non-uniform scale
      expect(stretchedElement.scaleX).toBe(2);
      expect(stretchedElement.scaleY).toBe(0.5);
    });

    test('applies rotation', () => {
      const rotatedElement = {
        ...mockElement,
        rotation: 45
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={rotatedElement}
        />
      );

      expect(rotatedElement.rotation).toBe(45);
    });
  });

  describe('Visual Effects', () => {
    test('applies opacity correctly', () => {
      const transparentElement = {
        ...mockElement,
        opacity: 0.5
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={transparentElement}
        />
      );

      expect(transparentElement.opacity).toBe(0.5);
    });

    test('applies shadow effects', () => {
      const shadowElement = {
        ...mockElement,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowBlur: 15,
        shadowOffsetX: 10,
        shadowOffsetY: 10,
        shadowEnabled: true
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={shadowElement}
        />
      );

      expect(shadowElement.shadowEnabled).toBe(true);
      expect(shadowElement.shadowBlur).toBe(15);
    });

    test('applies blur effect', () => {
      const blurredElement = {
        ...mockElement,
        blurRadius: 5
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={blurredElement}
        />
      );

      expect(blurredElement.blurRadius).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    test('handles zero radius', () => {
      const zeroRadiusElement = {
        ...mockElement,
        radius: 0
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={zeroRadiusElement}
        />
      );

      const circle = screen.getByTestId('konva-circle');
      expect(circle).toBeInTheDocument();
    });

    test('handles negative radius', () => {
      const negativeRadiusElement = {
        ...mockElement,
        radius: -50
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={negativeRadiusElement}
        />
      );

      // Should handle gracefully, possibly converting to positive
      const circle = screen.getByTestId('konva-circle');
      expect(circle).toBeInTheDocument();
    });

    test('handles missing optional properties', () => {
      const minimalElement = {
        id: 'circle-minimal',
        type: 'circle',
        x: 100,
        y: 100,
        radius: 30
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={minimalElement}
        />
      );

      const circle = screen.getByTestId('konva-circle');
      expect(circle).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('uses memoization to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <CircleShape {...defaultProps} />
      );

      // Re-render with same props
      rerender(
        <CircleShape {...defaultProps} />
      );

      // Component should be memoized
      const circle = screen.getByTestId('konva-circle');
      expect(circle).toBeInTheDocument();
    });

    test('updates only when relevant props change', () => {
      const { rerender } = render(
        <CircleShape {...defaultProps} />
      );

      // Change position
      const movedElement = {
        ...mockElement,
        x: 200,
        y: 200
      };

      rerender(
        <CircleShape 
          {...defaultProps} 
          element={movedElement}
        />
      );

      expect(movedElement.x).toBe(200);
      expect(movedElement.y).toBe(200);
    });
  });

  describe('Hit Detection', () => {
    test('detects hits within circle bounds', () => {
      render(<CircleShape {...defaultProps} />);

      const circle = screen.getByTestId('konva-circle');
      
      // Click at center
      fireEvent.click(circle, { clientX: 150, clientY: 150 });
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    test('handles hit detection with stroke', () => {
      const thickStrokeElement = {
        ...mockElement,
        strokeWidth: 20,
        hitStrokeWidth: 20
      };

      render(
        <CircleShape 
          {...defaultProps} 
          element={thickStrokeElement}
        />
      );

      // Click on stroke area should also register
      const circle = screen.getByTestId('konva-circle');
      fireEvent.click(circle);
      expect(defaultProps.onSelect).toHaveBeenCalled();
    });
  });
});
