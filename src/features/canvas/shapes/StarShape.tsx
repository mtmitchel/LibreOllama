// src/features/canvas/shapes/StarShape.tsx
import React from 'react';
import { Star } from 'react-konva';
import { StarElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { designSystem } from '../../../styles/designSystem';

interface StarShapeProps {
  element: StarElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
}

/**
 * StarShape - Optimized star component
 * - Performance-optimized with React.memo
 * - Handles star-specific geometry and styling
 */
export const StarShape: React.FC<StarShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
}) => {
  return (
    <Star
      {...konvaProps}
      numPoints={element.numPoints || 5}
      innerRadius={element.innerRadius || 25}
      outerRadius={element.outerRadius || 50}
      fill={element.fill || designSystem.colors.warning[500]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || designSystem.colors.warning[600])}
      strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
    />
  );
});

StarShape.displayName = 'StarShape';
