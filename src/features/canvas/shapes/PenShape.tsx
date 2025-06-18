// src/features/canvas/shapes/PenShape.tsx
import React from 'react';
import { Line } from 'react-konva';
import { CanvasElement } from '../stores/types';
import { designSystem } from '../../../styles/designSystem';

interface PenShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

/**
 * PenShape - Optimized pen stroke component
 * - Performance-optimized with React.memo
 * - Handles pen-specific drawing and styling
 */
export const PenShape: React.FC<PenShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate
}) => {  return (
    <Line
      {...konvaProps}
      id={element.id}
      points={element.points || [0, 0, 100, 0]}
      stroke={element.stroke || designSystem.colors.secondary[800]}
      strokeWidth={element.strokeWidth || 3}
      lineCap="round"
      lineJoin="round"
      tension={0.5}
    />
  );
});

PenShape.displayName = 'PenShape';
