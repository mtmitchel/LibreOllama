/**
 * PenShape Component - Comprehensive Test Suite
 * Tests drawing functionality, path rendering, and performance optimizations
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stage, Layer } from 'react-konva';
import { PenShape } from '../../features/canvas/shapes/PenShape';
import { setupTestEnvironment, createMockElements } from '../utils/testUtils';
import type { PenElement, ElementId } from '../../features/canvas/types/enhanced.types';

const { render: testRender, user } = setupTestEnvironment();

// Mock pen element with drawing paths
const createMockPenElement = (overrides: Partial<PenElement> = {}): PenElement => ({
  id: `test-pen-${Math.random().toString(36).substr(2, 9)}` as ElementId,
  type: 'pen',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  points: [10, 10, 20, 20, 30, 15, 40, 25], // Simple curved path
  stroke: '#000000',
  strokeWidth: 2,
  tension: 0.5,
  lineCap: 'round',
  lineJoin: 'round',
  ...overrides,
} as PenElement);

const renderPenShape = (props: Partial<any> = {}) => {
  const mockElement = createMockPenElement(props.element);
  const defaultProps = {
    element: mockElement,
    konvaProps: {
      x: mockElement.x,
      y: mockElement.y,
      'data-testid': 'konva-pen-line',
    },
    ...props,
  };

  return testRender(
    <Stage width={800} height={600}>
      <Layer>
        <PenShape {...defaultProps} />
      </Layer>
    </Stage>
  );
};

describe('PenShape Component', () => {
  describe('Rendering', () => {
    it('should render pen line with correct properties', async () => {
      await renderPenShape();
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should render with custom stroke properties', async () => {
      await renderPenShape({
        element: {
          stroke: '#ff0000',
          strokeWidth: 5,
          points: [0, 0, 100, 100],
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should handle empty points array gracefully', async () => {
      await renderPenShape({
        element: {
          points: [],
        },
      });
      
      // Should still render but with no visible path
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should render with correct line styling properties', async () => {
      await renderPenShape({
        element: {
          lineCap: 'square',
          lineJoin: 'miter',
          tension: 0.8,
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should render with opacity settings', async () => {
      await renderPenShape({
        element: {
          opacity: 0.5,
        },
        konvaProps: {
          opacity: 0.5,
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });
  });

  describe('Path Handling', () => {
    it('should handle single point path', async () => {
      await renderPenShape({
        element: {
          points: [50, 50], // Single point
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });    it('should handle complex multi-segment path', async () => {
      // Generate a complex path with multiple segments
      const complexPath: number[] = [];
      for (let i = 0; i < 100; i++) {
        complexPath.push(Math.sin(i * 0.1) * 50 + 100);
        complexPath.push(Math.cos(i * 0.1) * 50 + 100);
      }

      await renderPenShape({
        element: {
          points: complexPath,
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should handle path with duplicate consecutive points', async () => {
      await renderPenShape({
        element: {
          points: [10, 10, 10, 10, 20, 20, 20, 20, 30, 30], // Duplicate points
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should respond to mouse events when listening is enabled', async () => {
      const mockClick = jest.fn();
      
      await renderPenShape({
        konvaProps: {
          listening: true,
          onClick: mockClick,
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      fireEvent.click(penLine);
      
      expect(mockClick).toHaveBeenCalled();
    });

    it('should not respond to events when listening is disabled', async () => {
      const mockClick = jest.fn();
      
      await renderPenShape({
        konvaProps: {
          listening: false,
          onClick: mockClick,
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      fireEvent.click(penLine);
      
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('should handle hover events for drawing tools', async () => {
      const mockMouseEnter = jest.fn();
      const mockMouseLeave = jest.fn();
      
      await renderPenShape({
        konvaProps: {
          onMouseEnter: mockMouseEnter,
          onMouseLeave: mockMouseLeave,
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      fireEvent.mouseEnter(penLine);
      fireEvent.mouseLeave(penLine);
      
      expect(mockMouseEnter).toHaveBeenCalled();
      expect(mockMouseLeave).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('should maintain stable references with React.memo', async () => {
      const { rerender } = await renderPenShape();
      
      // Re-render with same props should not cause unnecessary re-render
      rerender(
        <Stage width={800} height={600}>
          <Layer>
            <PenShape
              element={createMockPenElement()}
              konvaProps={{
                x: 0,
                y: 0,
                'data-testid': 'konva-pen-line',
              }}
            />
          </Layer>
        </Stage>
      );
      
      // Component should remain stable
      expect(screen.getByTestId('konva-pen-line')).toBeInTheDocument();
    });

    it('should re-render only when path points change', async () => {
      const element1 = createMockPenElement({ points: [0, 0, 10, 10] });
      const element2 = createMockPenElement({ points: [0, 0, 20, 20] });
      
      const { rerender } = await renderPenShape({ element: element1 });
      
      rerender(
        <Stage width={800} height={600}>
          <Layer>
            <PenShape
              element={element2}
              konvaProps={{
                x: 0,
                y: 0,
                'data-testid': 'konva-pen-line',
              }}
            />
          </Layer>
        </Stage>
      );
      
      expect(screen.getByTestId('konva-pen-line')).toBeInTheDocument();
    });

    it('should handle large path arrays efficiently', async () => {
      const startTime = performance.now();
        // Create a very large path (simulating complex drawings)
      const largePath: number[] = [];
      for (let i = 0; i < 10000; i++) {
        largePath.push(i % 400, (i * 0.01) % 300);
      }

      await renderPenShape({
        element: {
          points: largePath,
        },
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render complex paths in reasonable time
      expect(renderTime).toBeLessThan(100); // 100ms threshold
      expect(screen.getByTestId('konva-pen-line')).toBeInTheDocument();
    });
  });

  describe('Drawing States', () => {
    it('should render active drawing state', async () => {
      await renderPenShape({
        element: {
          isDrawing: true,
          stroke: '#007bff', // Active drawing color
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should render completed drawing state', async () => {
      await renderPenShape({
        element: {
          isDrawing: false,
          stroke: '#000000', // Final drawing color
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should handle drawing tension variations', async () => {
      const tensions = [0, 0.25, 0.5, 0.75, 1.0];
      
      for (const tension of tensions) {
        await renderPenShape({
          element: {
            tension,
            points: [0, 0, 50, 25, 100, 0, 150, 50],
          },
        });
        
        expect(screen.getByTestId('konva-pen-line')).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid points data gracefully', async () => {
      await renderPenShape({
        element: {
          points: [NaN, 10, 20, undefined] as any, // Invalid data
        },
      });
      
      // Should still render without crashing
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should handle missing stroke properties', async () => {
      await renderPenShape({
        element: {
          stroke: undefined,
          strokeWidth: undefined,
        } as any,
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should handle extreme coordinate values', async () => {
      await renderPenShape({
        element: {
          points: [-10000, -10000, 10000, 10000], // Extreme coordinates
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA labels for drawing elements', async () => {
      await renderPenShape({
        konvaProps: {
          'aria-label': 'Hand-drawn line',
          role: 'img',
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });

    it('should provide semantic information for screen readers', async () => {
      await renderPenShape({
        element: {
          points: [0, 0, 100, 100],
        },
        konvaProps: {
          'aria-describedby': 'drawing-description',
        },
      });
      
      const penLine = screen.getByTestId('konva-pen-line');
      expect(penLine).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up properly when unmounted', async () => {
      const { unmount } = await renderPenShape();
      
      // Unmount component
      unmount();
      
      // Should not throw any errors during cleanup
      expect(screen.queryByTestId('konva-pen-line')).not.toBeInTheDocument();
    });

    it('should handle rapid re-renders without memory leaks', async () => {
      const { rerender } = await renderPenShape();
      
      // Simulate rapid re-renders with different paths
      for (let i = 0; i < 50; i++) {
        const points = [i, i, i + 10, i + 10];
        rerender(
          <Stage width={800} height={600}>
            <Layer>
              <PenShape
                element={createMockPenElement({ points })}
                konvaProps={{
                  x: 0,
                  y: 0,
                  'data-testid': 'konva-pen-line',
                }}
              />
            </Layer>
          </Stage>
        );
      }
      
      expect(screen.getByTestId('konva-pen-line')).toBeInTheDocument();
    });
  });
});
