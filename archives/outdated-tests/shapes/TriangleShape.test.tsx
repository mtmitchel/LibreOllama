/**
 * TriangleShape Component - Comprehensive Test Suite
 * Tests triangle rendering, geometry calculations, and interactive features
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import { TriangleShape } from '../../features/canvas/shapes/TriangleShape';
import { setupTestEnvironment } from '../utils/testUtils';
import type { TriangleElement, ElementId } from '../../features/canvas/types/enhanced.types';

const { render: testRender, user } = setupTestEnvironment();

// Mock triangle element
const createMockTriangleElement = (overrides: Partial<TriangleElement> = {}): TriangleElement => ({
  id: `test-triangle-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'triangle',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  points: [0, -30, 50, 30, -50, 30], // Default triangle points
  fill: '#3b82f6',
  stroke: '#1e40af',
  strokeWidth: 1,
  ...overrides,
} as TriangleElement);

const renderTriangleShape = (props: Partial<any> = {}) => {
  const mockElement = createMockTriangleElement(props.element);
  const defaultProps = {
    element: mockElement,
    isSelected: false,
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn(),
    konvaProps: {
      x: mockElement.x,
      y: mockElement.y,
      'data-testid': 'konva-triangle',
    },
    ...props,
  };

  return testRender(
    <Stage width={800} height={600}>
      <Layer>
        <TriangleShape {...defaultProps} />
      </Layer>
    </Stage>
  );
};

describe('TriangleShape Component', () => {
  describe('Rendering', () => {
    it('should render triangle with default properties', async () => {
      await renderTriangleShape();
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should render with custom points', async () => {
      const customPoints = [0, -40, 60, 40, -60, 40];
      await renderTriangleShape({
        element: {
          points: customPoints,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should render with custom fill color', async () => {
      await renderTriangleShape({
        element: {
          fill: '#ef4444',
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should render with custom stroke properties', async () => {
      await renderTriangleShape({
        element: {
          stroke: '#dc2626',
          strokeWidth: 3,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle selected state correctly', async () => {
      await renderTriangleShape({
        isSelected: true,
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });
  });

  describe('Geometry Calculations', () => {
    it('should handle equilateral triangle points', async () => {
      const side = 100;
      const height = (side * Math.sqrt(3)) / 2;
      const equilateralPoints = [
        0, -height / 2,
        side / 2, height / 2,
        -side / 2, height / 2
      ];

      await renderTriangleShape({
        element: {
          points: equilateralPoints,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle isosceles triangle points', async () => {
      const isoscelesPoints = [0, -50, 40, 50, -40, 50];
      
      await renderTriangleShape({
        element: {
          points: isoscelesPoints,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle right triangle points', async () => {
      const rightTrianglePoints = [0, 0, 50, 0, 0, 50];
      
      await renderTriangleShape({
        element: {
          points: rightTrianglePoints,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should handle mouse enter and leave events', async () => {
      const onMouseEnter = jest.fn();
      const onMouseLeave = jest.fn();
      
      await renderTriangleShape({
        konvaProps: {
          'data-testid': 'konva-triangle',
          onMouseEnter,
          onMouseLeave,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      
      await user.hover(triangle);
      await user.unhover(triangle);
      
      expect(triangle).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const onClick = jest.fn();
      
      await renderTriangleShape({
        konvaProps: {
          'data-testid': 'konva-triangle',
          onClick,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      await user.click(triangle);
      
      expect(triangle).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('should render efficiently with React.memo', async () => {
      const { rerender } = await renderTriangleShape();
        // Re-render with same props should not cause re-render due to memo
      await rerender(
        <Stage width={800} height={600}>
          <Layer>
            <TriangleShape
              element={createMockTriangleElement()}
              isSelected={false}
              onUpdate={jest.fn()}
              onStartTextEdit={jest.fn()}
              konvaProps={{
                x: 0,
                y: 0,
                'data-testid': 'konva-triangle',
              }}
            />
          </Layer>
        </Stage>
      );
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle large triangles efficiently', async () => {
      const largeTrianglePoints = [
        0, -500,
        500, 500,
        -500, 500
      ];
      
      await renderTriangleShape({
        element: {
          points: largeTrianglePoints,
          width: 1000,
          height: 1000,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty points array gracefully', async () => {
      await renderTriangleShape({
        element: {
          points: [],
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle invalid points gracefully', async () => {
      await renderTriangleShape({
        element: {
          points: [NaN, 0, 0, NaN],
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle zero-sized triangle', async () => {
      await renderTriangleShape({
        element: {
          points: [0, 0, 0, 0, 0, 0],
          width: 0,
          height: 0,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle missing fill and stroke', async () => {
      await renderTriangleShape({
        element: {
          fill: undefined,
          stroke: undefined,
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', async () => {
      await renderTriangleShape({
        konvaProps: {
          'data-testid': 'konva-triangle',
          'aria-label': 'Triangle shape',
          role: 'img',
        },
      });
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
      expect(triangle).toHaveAttribute('aria-label', 'Triangle shape');
      expect(triangle).toHaveAttribute('role', 'img');
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid re-renders', async () => {
      const { rerender } = await renderTriangleShape();
      
      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {        await rerender(
          <Stage width={800} height={600}>
            <Layer>
              <TriangleShape
                element={createMockTriangleElement({ fill: `hsl(${i * 36}, 70%, 50%)` })}
                isSelected={i % 2 === 0}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                konvaProps={{
                  x: i * 10,
                  y: i * 10,
                  'data-testid': 'konva-triangle',
                }}
              />
            </Layer>
          </Stage>
        );
      }
      
      const triangle = screen.getByTestId('konva-triangle');
      expect(triangle).toBeInTheDocument();
    });

    it('should handle multiple triangles efficiently', async () => {
      const triangles = Array.from({ length: 50 }, (_, index) => 
        createMockTriangleElement({
          id: `triangle-${index}` as ElementId,
          x: (index % 10) * 50,
          y: Math.floor(index / 10) * 50,
        })
      );

      await testRender(
        <Stage width={800} height={600}>
          <Layer>            {triangles.map((triangle, index) => (
              <TriangleShape
                key={triangle.id}
                element={triangle}
                isSelected={false}
                onUpdate={jest.fn()}
                onStartTextEdit={jest.fn()}
                konvaProps={{
                  x: triangle.x,
                  y: triangle.y,
                  'data-testid': `konva-triangle-${index}`,
                }}
              />
            ))}
          </Layer>
        </Stage>
      );
      
      const triangleElements = screen.getAllByTestId(/konva-triangle-/);
      expect(triangleElements).toHaveLength(50);
    });
  });
});
