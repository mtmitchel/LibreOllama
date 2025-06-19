// src/components/canvas/shapes/RectangleShape.tsx
import React from 'react';
import { Rect } from 'react-konva';
import { CanvasElement } from '../stores/types';
import { designSystem } from '../../../styles/designSystem';
import { useShapeCaching } from '../hooks/canvas/useShapeCaching';

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
 * - Applies Konva performance optimizations
 */
export const RectangleShape: React.FC<RectangleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps
}) => {  // Apply shape caching for large rectangles or when they have both fill and stroke
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
      ref={nodeRef}
      {...konvaProps}
      width={element.width || 100}
      height={element.height || 100}
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