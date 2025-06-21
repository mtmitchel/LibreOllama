import React from 'react';
import { render } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';
import { jest } from '@jest/globals';

// Mock the dependencies that RectangleShape needs
jest.mock('@/features/canvas/hooks/canvas/useShapeCaching', () => ({
  useShapeCaching: () => ({
    nodeRef: { current: null },
    isCached: false,
    shouldCache: false,
    applyCaching: jest.fn(),
    clearCaching: jest.fn(),
    refreshCache: jest.fn(),
  }),
}));

jest.mock('@/styles/designSystem', () => ({
  designSystem: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
    },
    shapes: {
      defaultFill: '#cccccc',
      defaultStroke: '#000000',
    }
  }
}));

// Import after mocking dependencies
import { RectangleShape } from '@/features/canvas/shapes/RectangleShape';

describe('RectangleShape Component Tests', () => {
  const mockElement = {
    id: 'rect-1',
    type: 'rectangle' as const,
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockProps = {
    element: mockElement,
    isSelected: false,
    konvaProps: {
      x: mockElement.x,
      y: mockElement.y,
    },
    onUpdate: jest.fn(),
    onStartTextEdit: jest.fn(),
  };

  // Helper component to wrap RectangleShape in Konva context
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Stage width={800} height={600}>
      <Layer>
        {children}
      </Layer>
    </Stage>
  );

  test('renders without crashing', () => {
    expect(() => {
      render(
        <TestWrapper>
          <RectangleShape {...mockProps} />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  test('handles selection state correctly', () => {
    const selectedProps = { ...mockProps, isSelected: true };
    
    expect(() => {
      render(
        <TestWrapper>
          <RectangleShape {...selectedProps} />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  test('handles large rectangle dimensions', () => {
    const largeRect = {
      ...mockElement,
      width: 500,
      height: 300
    };
    
    const largeProps = {
      ...mockProps,
      element: largeRect
    };

    expect(() => {
      render(
        <TestWrapper>
          <RectangleShape {...largeProps} />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  test('works with minimal properties', () => {
    const minimalRect = {
      id: 'rect-minimal',
      type: 'rectangle' as const,
      x: 0,
      y: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const minimalProps = {
      ...mockProps,
      element: minimalRect
    };

    expect(() => {
      render(
        <TestWrapper>
          <RectangleShape {...minimalProps} />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  test('handles different color values', () => {
    const colorfulRect = {
      ...mockElement,
      fill: '#00ff00',
      stroke: '#0000ff',
      strokeWidth: 5
    };

    const colorProps = {
      ...mockProps,
      element: colorfulRect
    };

    expect(() => {
      render(
        <TestWrapper>
          <RectangleShape {...colorProps} />
        </TestWrapper>
      );
    }).not.toThrow();
  });
});
