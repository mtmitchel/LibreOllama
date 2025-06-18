// src/components/canvas/shapes/RectangleShape.tsx
import React from 'react';
import { Rect } from 'react-konva';
import { CanvasElement } from '../layers/types';
import { designSystem } from '../../../styles/designSystem';
import { CachedShape } from './CachedShape';

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
  // Cache dependencies specific to rectangle visual properties
  const cacheDependencies = [
    element.width,
    element.height,
    element.fill,
    element.stroke,
    element.strokeWidth,
    isSelected
  ];

  return (
    <CachedShape
      element={element}
      cacheDependencies={cacheDependencies}
      cacheConfig={{
        // Force caching for large rectangles or those with complex styling
        forceCache: (element.width || 0) * (element.height || 0) > 5000,
        sizeThreshold: 5000
      }}
      {...konvaProps}
    >      <Rect
        width={element.width || 100}
        height={element.height || 100}
        fill={element.fill || designSystem.colors.primary[100]}
        stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || '')}
        strokeWidth={isSelected ? 2 : (element.strokeWidth || 0)}
        cornerRadius={designSystem.borderRadius.md}
      />
    </CachedShape>
  );
});

RectangleShape.displayName = 'RectangleShape';