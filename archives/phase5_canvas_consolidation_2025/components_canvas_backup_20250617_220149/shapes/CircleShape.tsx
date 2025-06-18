// src/components/canvas/shapes/CircleShape.tsx
import React from 'react';
import { Circle } from 'react-konva';
import { CanvasElement } from '../layers/types';
import { designSystem } from '../../styles/designSystem';
import { CachedShape } from './CachedShape';

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
  // Cache dependencies specific to circle visual properties
  const cacheDependencies = [
    element.radius,
    element.fill,
    element.stroke,
    element.strokeWidth,
    isSelected
  ];

  const radius = element.radius || 50;

  return (
    <CachedShape
      element={element}
      cacheDependencies={cacheDependencies}
      cacheConfig={{
        // Force caching for large circles (area > 5000)
        forceCache: Math.PI * radius * radius > 5000,
        sizeThreshold: 5000
      }}
      {...konvaProps}
    >
      <Circle
        radius={radius}
        fill={element.fill || designSystem.colors.secondary[100]}
        stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || '')}
        strokeWidth={isSelected ? 2 : (element.strokeWidth || 0)}
      />
    </CachedShape>
  );
});

CircleShape.displayName = 'CircleShape';
