// src/features/canvas/shapes/TriangleShape.tsx
import React from 'react';
import { Line } from 'react-konva';
import { TriangleElement, ElementId, CanvasElement } from '../types/enhanced.types';
import { designSystem } from '../../../styles/designSystem';

interface TriangleShapeProps {
  element: TriangleElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
}

/**
 * TriangleShape - Optimized triangle component
 * - Performance-optimized with React.memo
 * - Handles triangle-specific geometry and styling
 */
export const TriangleShape: React.FC<TriangleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
}) => {
  // Use points from element or generate default triangle points
  const points = element.points || [0, -30, 50, 30, -50, 30];

  return (
    <Line
      {...konvaProps}
      points={points}
      closed
      fill={element.fill || designSystem.colors.success[500]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || designSystem.colors.success[500])}
      strokeWidth={isSelected ? 3 : (element.strokeWidth || 2)}
    />
  );
});

TriangleShape.displayName = 'TriangleShape';
