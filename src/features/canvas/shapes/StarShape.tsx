// src/features/canvas/shapes/StarShape.tsx
import React from 'react';
import { Star } from 'react-konva';
import { CanvasElement } from '../stores/types';
import { designSystem } from '../../../styles/designSystem';

interface StarShapeProps {
  element: CanvasElement;
  konvaProps: any;
}

/**
 * StarShape - Optimized star component
 * - Performance-optimized with React.memo
 * - Handles star-specific geometry and styling
 */
export const StarShape: React.FC<StarShapeProps> = React.memo(({
  element,
  konvaProps,
}) => {
  return (
    <Star
      {...konvaProps}
      numPoints={element.sides || 5}
      innerRadius={element.innerRadius || (element.width || 100) / 4}
      outerRadius={element.radius || (element.width || 100) / 2}
      fill={element.fill || designSystem.colors.warning[500]}
      stroke={element.stroke || designSystem.colors.warning[600]}
      strokeWidth={element.strokeWidth || 2}
    />
  );
});

StarShape.displayName = 'StarShape';
