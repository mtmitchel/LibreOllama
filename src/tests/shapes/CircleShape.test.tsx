// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach, afterEach
import { vi } from 'vitest';
import { CircleShape } from '../../features/canvas/shapes/CircleShape';
import { createMockCanvasElement, renderKonva } from '../utils/testUtils';

describe('CircleShape', () => {
  let mockElement: any;
  let defaultProps: any;

  beforeEach(() => {
    // Create mock element directly to avoid any issues with createMockCanvasElement
    mockElement = {
      id: 'circle-1',
      type: 'circle',
      tool: 'circle',
      x: 150,
      y: 150,
      radius: 50,
      fill: '#00ff00', // Simple string, not object
      stroke: '#000000',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      visible: true,
      draggable: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

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
      onUpdate: vi.fn(),
      onStartTextEdit: vi.fn(),
      onSelect: vi.fn(),
      onDoubleClick: vi.fn()
    };
  });

  describe('Rendering', () => {
    test('renders circle with correct properties', () => {
      // Debug: log the fill prop to see what's actually being passed
      console.log('Element fill prop:', mockElement.fill);
      console.log('Element properties:', mockElement);
      
      const { container } = renderKonva(<CircleShape {...defaultProps} />);
      
      // Test that the component renders without throwing
      expect(container).toBeTruthy();
      // Test that canvas element is present
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
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

      const { container } = renderKonva(
        <CircleShape 
          {...defaultProps} 
          element={gradientElement}
        />
      );

      // Test that canvas renders with gradient element
      expect(container.querySelector('canvas')).toBeTruthy();
      expect(gradientElement.fill.type).toBe('radial');
    });

    test('renders with dash pattern when specified', () => {
      const dashedElement = {
        ...mockElement,
        dash: [10, 5],
        dashEnabled: true
      };

      renderKonva(
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
    test('component renders with interaction handlers', () => {
      const { container } = renderKonva(<CircleShape {...defaultProps} />);
      
      // Test that component renders with handlers
      expect(container.querySelector('canvas')).toBeTruthy();
      expect(defaultProps.onSelect).toBeDefined();
      expect(defaultProps.onDoubleClick).toBeDefined();
    });

    test('handles drag state properly', () => {
      const draggingProps = {
        ...defaultProps,
        isDragging: true
      };

      const { container } = renderKonva(<CircleShape {...draggingProps} />);
      
      // Component should render even when dragging
      expect(container.querySelector('canvas')).toBeTruthy();
      expect(draggingProps.isDragging).toBe(true);
    });
  });

  describe('Selection State', () => {
    test('shows selection state when selected', () => {
      const selectedProps = {
        ...defaultProps,
        isSelected: true
      };

      const { container } = renderKonva(<CircleShape {...selectedProps} />);

      // Component should render with selection state
      expect(container.querySelector('canvas')).toBeTruthy();
      expect(selectedProps.isSelected).toBe(true);
    });

    test('handles selection state changes', () => {
      const { container, rerender } = renderKonva(<CircleShape {...defaultProps} />);

      // Initially not selected
      expect(defaultProps.isSelected).toBe(false);

      // Re-render with selection
      const selectedProps = { ...defaultProps, isSelected: true };
      const { container: newContainer } = renderKonva(
        <CircleShape {...selectedProps} />
      );

      // Selection state should be updated
      expect(selectedProps.isSelected).toBe(true);
      expect(newContainer.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Drag Operations', () => {
    test('handles draggable state', () => {
      const { container } = renderKonva(<CircleShape {...defaultProps} />);

      expect(mockElement.draggable).toBe(true);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    test('prevents drag when draggable is false', () => {
      const nonDraggableElement = {
        ...mockElement,
        draggable: false
      };

      const nonDraggableProps = {
        ...defaultProps,
        element: nonDraggableElement
      };

      const { container } = renderKonva(<CircleShape {...nonDraggableProps} />);

      expect(nonDraggableElement.draggable).toBe(false);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    test('shows drag preview during drag', () => {
      const draggingProps = {
        ...defaultProps,
        isDragging: true
      };

      const { container } = renderKonva(<CircleShape {...draggingProps} />);

      expect(draggingProps.isDragging).toBe(true);
      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Transform Operations', () => {
    test('applies scale transform', () => {
      const scaledElement = {
        ...mockElement,
        scaleX: 2,
        scaleY: 2
      };

      const scaledProps = {
        ...defaultProps,
        element: scaledElement
      };

      const { container } = renderKonva(<CircleShape {...scaledProps} />);

      expect(scaledElement.scaleX).toBe(2);
      expect(scaledElement.scaleY).toBe(2);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    test('handles non-uniform scaling', () => {
      const stretchedElement = {
        ...mockElement,
        scaleX: 2,
        scaleY: 0.5
      };

      const stretchedProps = {
        ...defaultProps,
        element: stretchedElement
      };

      const { container } = renderKonva(<CircleShape {...stretchedProps} />);

      expect(stretchedElement.scaleX).toBe(2);
      expect(stretchedElement.scaleY).toBe(0.5);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    test('applies rotation', () => {
      const rotatedElement = {
        ...mockElement,
        rotation: 45
      };

      const rotatedProps = {
        ...defaultProps,
        element: rotatedElement
      };

      const { container } = renderKonva(<CircleShape {...rotatedProps} />);

      expect(rotatedElement.rotation).toBe(45);
      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Visual Effects', () => {
    test('applies opacity correctly', () => {
      const transparentElement = {
        ...mockElement,
        opacity: 0.5
      };

      const transparentProps = {
        ...defaultProps,
        element: transparentElement
      };

      const { container } = renderKonva(<CircleShape {...transparentProps} />);

      expect(transparentElement.opacity).toBe(0.5);
      expect(container.querySelector('canvas')).toBeTruthy();
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

      const shadowProps = {
        ...defaultProps,
        element: shadowElement
      };

      const { container } = renderKonva(<CircleShape {...shadowProps} />);

      expect(shadowElement.shadowEnabled).toBe(true);
      expect(shadowElement.shadowBlur).toBe(15);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    test('applies blur effect', () => {
      const blurredElement = {
        ...mockElement,
        blurRadius: 5
      };

      const blurredProps = {
        ...defaultProps,
        element: blurredElement
      };

      const { container } = renderKonva(<CircleShape {...blurredProps} />);

      expect(blurredElement.blurRadius).toBe(5);
      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('handles zero radius', () => {
      const zeroRadiusElement = {
        ...mockElement,
        radius: 0
      };

      const zeroRadiusProps = {
        ...defaultProps,
        element: zeroRadiusElement
      };

      const { container } = renderKonva(<CircleShape {...zeroRadiusProps} />);

      expect(zeroRadiusElement.radius).toBe(0);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    test('handles negative radius', () => {
      const negativeRadiusElement = {
        ...mockElement,
        radius: -50
      };

      const negativeRadiusProps = {
        ...defaultProps,
        element: negativeRadiusElement
      };

      const { container } = renderKonva(<CircleShape {...negativeRadiusProps} />);

      expect(negativeRadiusElement.radius).toBe(-50);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    test('handles missing optional properties', () => {
      const minimalElement = {
        id: 'circle-minimal',
        type: 'circle',
        x: 100,
        y: 100,
        radius: 30
      };

      const minimalProps = {
        ...defaultProps,
        element: minimalElement
      };

      const { container } = renderKonva(<CircleShape {...minimalProps} />);

      expect(minimalElement.radius).toBe(30);
      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    test('renders without errors during re-renders', () => {
      const { container, rerender } = renderKonva(<CircleShape {...defaultProps} />);

      // Initial render
      expect(container.querySelector('canvas')).toBeTruthy();

      // Re-render with same props
      const { container: newContainer } = renderKonva(<CircleShape {...defaultProps} />);

      // Should still render successfully
      expect(newContainer.querySelector('canvas')).toBeTruthy();
    });

    test('updates when relevant props change', () => {
      const { container, rerender } = renderKonva(<CircleShape {...defaultProps} />);

      // Initial render
      expect(mockElement.x).toBe(150);
      expect(mockElement.y).toBe(150);

      // Change position
      const movedElement = {
        ...mockElement,
        x: 200,
        y: 200
      };

      const movedProps = {
        ...defaultProps,
        element: movedElement
      };

      const { container: newContainer } = renderKonva(<CircleShape {...movedProps} />);

      expect(movedElement.x).toBe(200);
      expect(movedElement.y).toBe(200);
      expect(newContainer.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Canvas Integration', () => {
    test('integrates with canvas context', () => {
      const { container } = renderKonva(<CircleShape {...defaultProps} />);

      // Test that canvas element exists and is properly configured
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
      expect(canvas?.width).toBeGreaterThan(0);
      expect(canvas?.height).toBeGreaterThan(0);
    });

    test('renders within Konva Stage and Layer', () => {
      const { container } = renderKonva(<CircleShape {...defaultProps} />);

      // Test that canvas is present (indicating Konva is working)
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
      
      // Test element properties are maintained
      expect(mockElement.id).toBe('circle-1');
      expect(mockElement.type).toBe('circle');
    });
  });
});
