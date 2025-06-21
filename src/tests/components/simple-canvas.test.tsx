// Simple React component test to verify canvas mock pattern works
import { vi } from 'vitest';

// Mock canvas module FIRST, before any other imports
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// Mock React-Konva components to avoid deeper canvas dependencies
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }) => <div data-testid="mock-stage" {...props}>{children}</div>,
  Layer: ({ children, ...props }) => <div data-testid="mock-layer" {...props}>{children}</div>,
  Rect: (props) => <div data-testid="mock-rect" {...props} />,
  Circle: (props) => <div data-testid="mock-circle" {...props} />,
  Text: (props) => <div data-testid="mock-text" {...props} />,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component using React-Konva
function TestCanvasComponent() {
  const { Stage, Layer, Rect } = require('react-konva');
  return (
    <Stage width={800} height={600}>
      <Layer>
        <Rect x={0} y={0} width={100} height={100} fill="red" />
      </Layer>
    </Stage>
  );
}

describe('Canvas Component Testing', () => {
  test('React component with canvas mocking works', () => {
    render(<TestCanvasComponent />);
    
    // Verify mocked components render
    expect(screen.getByTestId('mock-stage')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-rect')).toBeInTheDocument();
  });
});
