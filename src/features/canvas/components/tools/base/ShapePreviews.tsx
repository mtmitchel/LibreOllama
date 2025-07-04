// src/features/canvas/components/tools/base/ShapePreviews.tsx
/**
 * Preview components for shape tools
 * Provides visual previews during shape placement
 */

import React from 'react';
import { Circle, Rect, Line } from 'react-konva';
import { Vector2d } from './types';

// Default sizes for shapes
const DEFAULT_SIZES = {
  circle: { radius: 50 },
  rectangle: { width: 120, height: 80 },
  triangle: { width: 115, height: 115 } // Increased by 15% for better text visibility
};

// Default styling - grey/black colors with preview opacity
const DEFAULT_STYLES = {
  fill: '#FFFFFF',
  stroke: '#374151', // Dark grey
  strokeWidth: 2,
  opacity: 0.7
};

export const CirclePreview: React.FC<{ position: Vector2d }> = ({ position }) => (
  <Circle
    x={position.x}
    y={position.y}
    radius={DEFAULT_SIZES.circle.radius}
    fill={DEFAULT_STYLES.fill}
    stroke={DEFAULT_STYLES.stroke}
    strokeWidth={DEFAULT_STYLES.strokeWidth}
    opacity={DEFAULT_STYLES.opacity}
    listening={false}
  />
);

export const RectanglePreview: React.FC<{ position: Vector2d }> = ({ position }) => (
  <Rect
    x={position.x - DEFAULT_SIZES.rectangle.width / 2}
    y={position.y - DEFAULT_SIZES.rectangle.height / 2}
    width={DEFAULT_SIZES.rectangle.width}
    height={DEFAULT_SIZES.rectangle.height}
    cornerRadius={8}
    fill={DEFAULT_STYLES.fill}
    stroke={DEFAULT_STYLES.stroke}
    strokeWidth={DEFAULT_STYLES.strokeWidth}
    opacity={DEFAULT_STYLES.opacity}
    listening={false}
  />
);

export const TrianglePreview: React.FC<{ position: Vector2d }> = ({ position }) => {
  const { width, height } = DEFAULT_SIZES.triangle;
  const halfWidth = width / 2;
  
  return (
    <Line
      x={position.x - halfWidth}
      y={position.y - height / 2}
      points={[
        halfWidth, 0,           // Top point
        0, height,              // Bottom left
        width, height,          // Bottom right
        halfWidth, 0            // Close the triangle
      ]}
      closed
      fill={DEFAULT_STYLES.fill}
      stroke={DEFAULT_STYLES.stroke}
      strokeWidth={DEFAULT_STYLES.strokeWidth}
      opacity={DEFAULT_STYLES.opacity}
      listening={false}
    />
  );
};
