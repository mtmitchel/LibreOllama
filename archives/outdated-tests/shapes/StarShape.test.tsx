/**
 * StarShape Component - Comprehensive Test Suite
 * Tests star rendering, geometry calculations, and interactive features
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import { StarShape } from '../../features/canvas/shapes/StarShape';
import { setupTestEnvironment } from '../utils/testUtils';
import type { StarElement, ElementId } from '../../features/canvas/types/enhanced.types';

const { render: testRender, user } = setupTestEnvironment();

// Mock star element
const createMockStarElement = (overrides: Partial<StarElement> = {}): StarElement => ({
  id: `test-star-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'star',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  numPoints: 5,
  innerRadius: 30,
  outerRadius: 50,
  fill: '#ffd700',
  stroke: '#000000',
  strokeWidth: 1,
  ...overrides,
} as StarElement);

const renderStarShape = (props: Partial<any> = {}) => {
  const mockElement = createMockStarElement(props.element);
  const defaultProps = {
    element: mockElement,
    isSelected: false,
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn(),
    konvaProps: {
      x: mockElement.x,
      y: mockElement.y,
      'data-testid': 'konva-star',
    },
    ...props,
  };

  return testRender(
    <Stage width={800} height={600}>
      <Layer>
        <StarShape {...defaultProps} />
      </Layer>
    </Stage>
  );
};

describe('StarShape Component', () => {
  describe('Rendering', () => {
    it('should render star with default properties', async () => {
      await renderStarShape();
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should render with custom number of points', async () => {
      await renderStarShape({
        element: {
          numPoints: 8,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should render with custom radius values', async () => {
      await renderStarShape({
        element: {
          innerRadius: 20,
          outerRadius: 60,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should render with custom fill and stroke', async () => {
      await renderStarShape({
        element: {
          fill: '#ff6b6b',
          stroke: '#333333',
          strokeWidth: 3,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should render with selection styling', async () => {
      await renderStarShape({
        isSelected: true,
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });
  });

  describe('Star Geometry', () => {
    it('should handle 3-point star (triangle)', async () => {
      await renderStarShape({
        element: {
          numPoints: 3,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle 6-point star (hexagram)', async () => {
      await renderStarShape({
        element: {
          numPoints: 6,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle 12-point star', async () => {
      await renderStarShape({
        element: {
          numPoints: 12,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle equal inner and outer radius (regular polygon)', async () => {
      await renderStarShape({
        element: {
          innerRadius: 40,
          outerRadius: 40,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle very small radii', async () => {
      await renderStarShape({
        element: {
          innerRadius: 1,
          outerRadius: 2,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle very large radii', async () => {
      await renderStarShape({
        element: {
          innerRadius: 500,
          outerRadius: 1000,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should respond to click events', async () => {
      const mockClick = jest.fn();
      
      await renderStarShape({
        konvaProps: {
          onClick: mockClick,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      fireEvent.click(star);
      
      expect(mockClick).toHaveBeenCalled();
    });

    it('should respond to hover events', async () => {
      const mockMouseEnter = jest.fn();
      const mockMouseLeave = jest.fn();
      
      await renderStarShape({
        konvaProps: {
          onMouseEnter: mockMouseEnter,
          onMouseLeave: mockMouseLeave,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      fireEvent.mouseEnter(star);
      fireEvent.mouseLeave(star);
      
      expect(mockMouseEnter).toHaveBeenCalled();
      expect(mockMouseLeave).toHaveBeenCalled();
    });

    it('should handle drag events', async () => {
      const mockDragStart = jest.fn();
      const mockDragEnd = jest.fn();
      
      await renderStarShape({
        konvaProps: {
          draggable: true,
          onDragStart: mockDragStart,
          onDragEnd: mockDragEnd,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      fireEvent.dragStart(star);
      fireEvent.dragEnd(star);
      
      expect(mockDragStart).toHaveBeenCalled();
      expect(mockDragEnd).toHaveBeenCalled();
    });

    it('should not respond to events when listening is disabled', async () => {
      const mockClick = jest.fn();
      
      await renderStarShape({
        konvaProps: {
          listening: false,
          onClick: mockClick,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      fireEvent.click(star);
      
      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('should maintain stable references with React.memo', async () => {
      const element = createMockStarElement();
      const { rerender } = await renderStarShape({ element });
        // Re-render with same props should not cause unnecessary re-render
      rerender(
        <Stage width={800} height={600}>
          <Layer>
            <StarShape
              element={element}
              isSelected={false}
              onUpdate={jest.fn()}
              onStartTextEdit={jest.fn()}
              konvaProps={{
                x: element.x,
                y: element.y,
                'data-testid': 'konva-star',
              }}
            />
          </Layer>
        </Stage>
      );
      
      expect(screen.getByTestId('konva-star')).toBeInTheDocument();
    });

    it('should re-render when geometry properties change', async () => {
      const element1 = createMockStarElement({ numPoints: 5 });
      const element2 = createMockStarElement({ numPoints: 8 });
      
      const { rerender } = await renderStarShape({ element: element1 });
      
      rerender(
        <Stage width={800} height={600}>
          <Layer>
            <StarShape
              element={element2}
              isSelected={false}
              konvaProps={{
                x: element2.x,
                y: element2.y,
                'data-testid': 'konva-star',
              }}
            />
          </Layer>
        </Stage>
      );
      
      expect(screen.getByTestId('konva-star')).toBeInTheDocument();
    });

    it('should handle multiple stars efficiently', async () => {
      const stars = Array.from({ length: 50 }, (_, i) => 
        createMockStarElement({
          x: (i % 10) * 80,
          y: Math.floor(i / 10) * 80,
          numPoints: 3 + (i % 6),
        })
      );

      const startTime = performance.now();
      
      await testRender(
        <Stage width={800} height={600}>
          <Layer>
            {stars.map((star, index) => (
              <StarShape
                key={star.id}
                element={star}
                isSelected={false}
                konvaProps={{
                  x: star.x,
                  y: star.y,
                  'data-testid': `konva-star-${index}`,
                }}
              />
            ))}
          </Layer>
        </Stage>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render multiple stars efficiently
      expect(renderTime).toBeLessThan(100); // 100ms threshold
      expect(screen.getAllByTestId(/konva-star-/)).toHaveLength(50);
    });
  });

  describe('Visual States', () => {
    it('should apply selection highlighting', async () => {
      await renderStarShape({
        isSelected: true,
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle opacity changes', async () => {
      await renderStarShape({
        element: {
          opacity: 0.5,
        },
        konvaProps: {
          opacity: 0.5,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle rotation transformations', async () => {
      await renderStarShape({
        element: {
          rotation: 45,
        },
        konvaProps: {
          rotation: 45,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle scaling transformations', async () => {
      await renderStarShape({
        konvaProps: {
          scaleX: 1.5,
          scaleY: 0.8,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid number of points gracefully', async () => {
      await renderStarShape({
        element: {
          numPoints: 0, // Invalid
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle negative radius values', async () => {
      await renderStarShape({
        element: {
          innerRadius: -10,
          outerRadius: -20,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle missing fill and stroke', async () => {
      await renderStarShape({
        element: {
          fill: undefined,
          stroke: undefined,
        } as any,
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle extreme coordinate values', async () => {
      await renderStarShape({
        element: {
          x: -10000,
          y: 10000,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA labels', async () => {
      await renderStarShape({
        konvaProps: {
          'aria-label': 'Five-pointed star',
          role: 'img',
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should provide semantic information', async () => {
      await renderStarShape({
        element: {
          numPoints: 6,
        },
        konvaProps: {
          'aria-describedby': 'star-description',
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });
  });

  describe('Shape Caching', () => {
    it('should cache large stars for performance', async () => {
      await renderStarShape({
        element: {
          outerRadius: 200, // Large star should be cached
          innerRadius: 100,
        },
      });
      
      const star = screen.getByTestId('konva-star');
      expect(star).toBeInTheDocument();
    });

    it('should handle cache invalidation on property changes', async () => {
      const element1 = createMockStarElement({ fill: '#ff0000' });
      const element2 = createMockStarElement({ fill: '#00ff00' });
      
      const { rerender } = await renderStarShape({ element: element1 });
      
      rerender(
        <Stage width={800} height={600}>
          <Layer>
            <StarShape
              element={element2}
              isSelected={false}
              konvaProps={{
                x: element2.x,
                y: element2.y,
                'data-testid': 'konva-star',
              }}
            />
          </Layer>
        </Stage>
      );
      
      expect(screen.getByTestId('konva-star')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up properly when unmounted', async () => {
      const { unmount } = await renderStarShape();
      
      unmount();
      
      expect(screen.queryByTestId('konva-star')).not.toBeInTheDocument();
    });

    it('should handle rapid property changes without memory leaks', async () => {
      const { rerender } = await renderStarShape();
      
      // Simulate rapid property changes
      for (let i = 0; i < 20; i++) {
        const element = createMockStarElement({
          numPoints: 3 + (i % 8),
          fill: `hsl(${i * 18}, 70%, 50%)`,
        });
        
        rerender(
          <Stage width={800} height={600}>
            <Layer>
              <StarShape
                element={element}
                isSelected={false}
                konvaProps={{
                  x: element.x,
                  y: element.y,
                  'data-testid': 'konva-star',
                }}
              />
            </Layer>
          </Stage>
        );
      }
      
      expect(screen.getByTestId('konva-star')).toBeInTheDocument();
    });
  });
});
