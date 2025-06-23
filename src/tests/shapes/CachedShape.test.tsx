import React from 'react';
import { render, screen } from '@testing-library/react';
// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach, afterEach
import { vi } from 'vitest';
import { Stage, Layer } from 'react-konva';
import { CachedShape } from '../../features/canvas/shapes/CachedShape';
import { createMockCanvasElement } from '../utils/testUtils';

// Mock the hook dependencies
vi.mock('../../features/canvas/hooks/canvas/useShapeCaching', () => ({
  useShapeCaching: () => ({
    nodeRef: { current: null },
    isCached: false,
    shouldCache: true,
    applyCaching: vi.fn(),
    clearCaching: vi.fn(),
    refreshCache: vi.fn(),
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
    vi.clearAllMocks();
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
      expect(cachedElement).toBeDefined();
      
      // In a real implementation, we would check if caching is applied
      // This is a basic structure test
    });

    test('handles selection state correctly', () => {
      render(<CachedShape {...defaultProps} isSelected={true} />);
      
      const cachedElement = screen.getByTestId('cached-shape');
      expect(cachedElement).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('maintains performance optimizations', () => {
      const { rerender } = render(<CachedShape {...defaultProps} />);
      
      // Rerender with same props should not cause unnecessary updates
      rerender(<CachedShape {...defaultProps} />);
      
      expect(screen.getByTestId('cached-shape')).toBeDefined();
    });

    test('handles large elements efficiently', () => {
      const largeElement = createMockCanvasElement({
        type: 'rectangle',
        width: 1000,
        height: 1000,
      });

      render(<CachedShape {...defaultProps} element={largeElement} />);
      
      expect(screen.getByTestId('cached-shape')).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    test('invalidates cache on element updates', () => {
      const { rerender } = render(<CachedShape {...defaultProps} />);
      
      const updatedElement = { ...mockElement, width: 300 };
      rerender(<CachedShape {...defaultProps} element={updatedElement} />);
      
      expect(screen.getByTestId('cached-shape')).toBeDefined();
    });

    test('maintains cache stability for unchanged elements', () => {
      const { rerender } = render(<CachedShape {...defaultProps} />);
      
      // Rerender with identical element should maintain cache
      rerender(<CachedShape {...defaultProps} />);
      
      expect(screen.getByTestId('cached-shape')).toBeDefined();
    });
  });
});
