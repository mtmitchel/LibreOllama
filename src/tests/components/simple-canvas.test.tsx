// Simple React component test to verify canvas mock pattern works
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Stage, Layer, Rect } from 'react-konva';

// Simple test component using React-Konva
function TestCanvasComponent() {
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
    
    // Verify components render (using our global mock)
    expect(screen.getByTestId('konva-stage')).toBeDefined();
    expect(screen.getByTestId('konva-layer')).toBeDefined(); 
    expect(screen.getByTestId('konva-rect')).toBeDefined();
  });
});
