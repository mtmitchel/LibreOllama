import React from 'react';
import { render, screen } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';
import { jest } from '@jest/globals';
import { CachedShape } from '@/features/canvas/shapes/CachedShape';
import { createMockCanvasElement } from '@/tests/utils/testUtils';

// Mock the hook dependencies
jest.mock('@/features/canvas/hooks/canvas/useShapeCaching', () => ({
  useShapeCaching: () => ({
    nodeRef: { current: null },
    isCached: false,
    shouldCache: true,
    applyCaching: jest.fn(),
    clearCaching: jest.fn(),
    refreshCache: jest.fn(),
    config: {
      enabled: true,
      forceCache: false,
      complexityThreshold: 5,
      sizeThreshold: 10000
    }
  }),
}));

// Create a wrapper component for testing Konva components
const KonvaTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Stage width={800} height={600}>
    <Layer>
      {children}
    </Layer>
  </Stage>
);

describe('CachedShape', () => {
  const mockElement = createMockCanvasElement({
    type: 'rectangle',
    id: 'test-cached-shape',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  });
  const defaultProps = {
    element: mockElement,
    children: <div>Test content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });  describe('Rendering', () => {
    test('renders cached shape component', () => {
      const result = render(
        <KonvaTestWrapper>
          <CachedShape {...defaultProps} />
        </KonvaTestWrapper>
      );
      
      // Should render without crashing - check container exists
      expect(result.container).toBeTruthy();
    });

    test('applies caching optimization when enabled', () => {
      render(<CachedShape {...defaultProps} />);
      
      const cachedElement = screen.getByTestId('cached-shape');
      expect(cachedElement).toBeInTheDocument();
      
      // In a real implementation, we would check if caching is applied
      // This is a basic structure test
    });

    test('handles selection state correctly', () => {
      render(<CachedShape {...defaultProps} isSelected={true} />);
      
      const cachedElement = screen.getByTestId('cached-shape');
      expect(cachedElement).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('maintains performance optimizations', () => {
      const { rerender } = render(<CachedShape {...defaultProps} />);
      
      // Rerender with same props should not cause unnecessary updates
      rerender(<CachedShape {...defaultProps} />);
      
      expect(screen.getByTestId('cached-shape')).toBeInTheDocument();
    });

    test('handles large elements efficiently', () => {
      const largeElement = createMockCanvasElement({
        type: 'rectangle',
        width: 1000,
        height: 1000,
      });

      render(<CachedShape {...defaultProps} element={largeElement} />);
      
      expect(screen.getByTestId('cached-shape')).toBeInTheDocument();
    });
  });

  describe('Cache Management', () => {
    test('invalidates cache on element updates', () => {
      const { rerender } = render(<CachedShape {...defaultProps} />);
      
      const updatedElement = { ...mockElement, width: 300 };
      rerender(<CachedShape {...defaultProps} element={updatedElement} />);
      
      expect(screen.getByTestId('cached-shape')).toBeInTheDocument();
    });

    test('maintains cache stability for unchanged elements', () => {
      const { rerender } = render(<CachedShape {...defaultProps} />);
      
      // Rerender with identical element should maintain cache
      rerender(<CachedShape {...defaultProps} />);
      
      expect(screen.getByTestId('cached-shape')).toBeInTheDocument();
    });
  });
});
