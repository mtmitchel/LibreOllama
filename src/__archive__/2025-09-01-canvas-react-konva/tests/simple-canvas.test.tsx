// Simple React component test to verify canvas mock pattern works
import React from 'react';
import { screen } from '@testing-library/react';
import { renderKonva } from '../../tests/utils/testUtils';
import { Rect } from 'react-konva';

// Simple test component using React-Konva
function TestCanvasComponent() {
  return (
    <Rect x={0} y={0} width={100} height={100} fill="red" data-testid="konva-rect" />
  );
}

describe('Canvas Component Testing', () => {
  test('React component with canvas mocking works', () => {
    renderKonva(<TestCanvasComponent />);
    
    // Verify components render (using our global mock)
    expect(screen.getByTestId('konva-stage')).toBeDefined();
    expect(screen.getByTestId('konva-layer')).toBeDefined(); 
    expect(screen.getByTestId('konva-rect')).toBeDefined();
  });
});
// Archived (2025-09-01): Legacy react-konva test
