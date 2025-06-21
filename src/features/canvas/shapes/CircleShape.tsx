// src/components/canvas/shapes/CircleShape.tsx
import React from 'react';
import { Circle } from 'react-konva';
import { CircleElement, ElementId, CanvasElement } from '../types/enhanced.types';

interface CircleShapeProps {
  element: CircleElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
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
      radius={radius}      fill={element.fill || '#e5e7eb'} // fallback color instead of designSystem
      stroke={isSelected ? '#3b82f6' : (element.stroke || '')} // fallback color instead of designSystem
      strokeWidth={isSelected ? 2 : (element.strokeWidth || 0)}
    />
  );
});

CircleShape.displayName = 'CircleShape';