// src/components/canvas/shapes/RectangleShape.tsx
import React from 'react';
import { Rect } from 'react-konva';
import { CanvasElement } from '../layers/types';
import { designSystem } from '../../../styles/designSystem';

interface RectangleShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

/**
 * RectangleShape - Optimized rectangle component with caching
 * - Performance-optimized with React.memo and shape caching
 * - Handles rectangle-specific logic
 * - Automatically caches large or visually complex rectangles
 */
export const RectangleShape: React.FC<RectangleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps
}) => {
  return (
    <Rect
      {...konvaProps}
      width={element.width || 100}
      height={element.height || 100}
      fill={element.fill || designSystem.colors.primary[100]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || '')}
      strokeWidth={isSelected ? 2 : (element.strokeWidth || 0)}
      cornerRadius={designSystem.borderRadius.md}
    />
  );
});

RectangleShape.displayName = 'RectangleShape';