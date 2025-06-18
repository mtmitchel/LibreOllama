// src/features/canvas/shapes/TriangleShape.tsx
import React from 'react';
import { Line } from 'react-konva';
import { CanvasElement } from '../stores/types';
import { designSystem } from '../../../styles/designSystem';

interface TriangleShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
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
  onUpdate
}) => {
  const width = element.width || 100;
  const height = element.height || 60;
  
  const points = element.points || [
    0, -height / 2,
    width / 2, height / 2,
    -width / 2, height / 2,
  ];

  return (
    <Line
      {...konvaProps}
      points={points}
      closed
      fill={element.fill || designSystem.colors.success[500]}
      stroke={element.stroke || designSystem.colors.success[500]}
      strokeWidth={element.strokeWidth || 2}
    />
  );
});

TriangleShape.displayName = 'TriangleShape';
