// src/components/canvas/shapes/RectangleShape.tsx
import React from 'react';
import { Rect } from 'react-konva';
import Konva from 'konva';
import { RectangleElement } from '../types/enhanced.types';
import { designSystem } from '../../../design-system';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { BaseShapeProps } from '../types/shape-props.types';

interface RectangleShapeProps extends BaseShapeProps<RectangleElement> {
  // Rectangle-specific props can be added here if needed
}

/**
 * RectangleShape - Optimized rectangle component with caching
 * - Performance-optimized with React.memo and shape caching
 * - Handles rectangle-specific logic
 * - Applies Konva performance optimizations
 */
export const RectangleShape: React.FC<RectangleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps
}) => {
  // Apply shape caching for large rectangles or when they have both fill and stroke
  const shouldCache = ((element.width || 100) * (element.height || 100) > 10000) || 
                     !!(element.fill && element.stroke);
  
  const { nodeRef } = useShapeCaching({
    element,
    cacheConfig: {
      enabled: shouldCache,
      sizeThreshold: 10000,
      forceCache: false
    },
    dependencies: [element.fill, element.stroke, element.width, element.height, isSelected]
  });
  return (
    <Rect
      {...konvaProps}
      ref={nodeRef as React.RefObject<Konva.Rect>}
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width || 100}
      height={element.height || 100}
      rotation={element.rotation || 0}
      fill={element.fill || designSystem.colors.primary[100]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || '')}
      strokeWidth={isSelected ? 2 : (element.strokeWidth || 0)}
      cornerRadius={designSystem.borderRadius.md}
      // Konva performance optimizations
      perfectDrawEnabled={false} // Disable perfect drawing for fill+stroke rectangles
      shadowForStrokeEnabled={false} // Disable shadow for stroke to prevent extra rendering pass
      listening={true} // Keep listening enabled for interactive rectangles
    />
  );
});

RectangleShape.displayName = 'RectangleShape';
