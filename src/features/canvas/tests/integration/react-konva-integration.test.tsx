import React from 'react';
import { render } from '@testing-library/react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';

describe('React-Konva Integration Tests', () => {
  test('renders Konva Stage correctly', () => {
    const { container } = render(
      <Stage width={800} height={600}>
        <Layer>
          <Rect 
            x={20} 
            y={20} 
            width={100} 
            height={100} 
            fill="red" 
          />
        </Layer>
      </Stage>
    );

    expect(container.querySelector('canvas')).toBeDefined();
  });

  test('renders multiple Konva shapes', () => {
    const { container } = render(
      <Stage width={800} height={600}>
        <Layer>
          <Rect 
            x={20} 
            y={20} 
            width={100} 
            height={100} 
            fill="red" 
          />
          <Circle 
            x={200} 
            y={200} 
            radius={50} 
            fill="blue" 
          />
          <Text 
            x={300} 
            y={300} 
            text="Hello Canvas" 
            fontSize={20} 
            fill="black" 
          />
        </Layer>
      </Stage>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeDefined();
    expect(canvas?.getAttribute('width')).toBe('800');
    expect(canvas?.getAttribute('height')).toBe('600');
  });

  test('renders Konva Layer without errors', () => {
    expect(() => {
      render(
        <Stage width={400} height={300}>
          <Layer>
            <Rect x={0} y={0} width={50} height={50} fill="green" />
          </Layer>
        </Stage>
      );
    }).not.toThrow();
  });

  test('handles empty Layer', () => {
    const { container } = render(
      <Stage width={400} height={300}>
        <Layer />
      </Stage>
    );

    expect(container.querySelector('canvas')).toBeDefined();
  });

  test('handles multiple Layers', () => {
    const { container } = render(
      <Stage width={400} height={300}>
        <Layer>
          <Rect x={0} y={0} width={50} height={50} fill="red" />
        </Layer>
        <Layer>
          <Circle x={100} y={100} radius={25} fill="blue" />
        </Layer>
      </Stage>
    );

    expect(container.querySelector('canvas')).toBeDefined();
  });

  test('renders with different Stage dimensions', () => {
    const testCases = [
      { width: 100, height: 100 },
      { width: 1920, height: 1080 },
      { width: 300, height: 600 }
    ];

    testCases.forEach(({ width, height }) => {
      const { container } = render(
        <Stage width={width} height={height}>
          <Layer>
            <Rect x={0} y={0} width={10} height={10} fill="black" />
          </Layer>
        </Stage>
      );

      const canvas = container.querySelector('canvas');
      expect(canvas?.getAttribute('width')).toBe(width.toString());
      expect(canvas?.getAttribute('height')).toBe(height.toString());
    });
  });
});
