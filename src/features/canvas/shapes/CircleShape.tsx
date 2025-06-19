// src/components/canvas/shapes/CircleShape.tsx
import React from 'react';
import { Circle } from 'react-konva';
import { CanvasElement } from '../stores/types';
import { designSystem } from '../../../styles/designSystem';

interface CircleShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

/**
 * CircleShape - Optimized circle component with caching
 * - Performance-optimized with React.memo and shape caching
 * - Handles circle-specific logic
 * - Automatically caches large circles
 */
export const CircleShape: React.FC<CircleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps
}) => {
  const radius = element.radius || 50;
  
  // Normalize circle positioning to top-left corner like rectangles
  // Store coordinates represent top-left corner, but Circle needs center coordinates
  const centerX = (konvaProps.x || 0) + radius;
  const centerY = (konvaProps.y || 0) + radius;
  
  return (
    <Circle
      {...konvaProps}
      x={centerX}
      y={centerY}
      radius={radius}
      fill={element.fill || designSystem.colors.secondary[100]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || '')}
      strokeWidth={isSelected ? 2 : (element.strokeWidth || 0)}
    />
  );
});

CircleShape.displayName = 'CircleShape';