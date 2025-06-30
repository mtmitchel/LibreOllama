// src/features/canvas/shapes/TriangleShape.tsx
import React from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';
import { TriangleElement } from '../types/enhanced.types';
import { designSystem } from '../../../core/design-system';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { BaseShapeProps } from '../types/shape-props.types';

interface TriangleShapeProps extends BaseShapeProps<TriangleElement> {
  // Triangle-specific props can be added here if needed
}

/**
 * TriangleShape - Optimized triangle component with caching
 * - Performance-optimized with React.memo and shape caching
 * - Handles triangle-specific geometry and styling
 * - Implements proper error handling and prop validation
 */
export const TriangleShape: React.FC<TriangleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
}) => {
  // Validate and ensure valid triangle points array
  const defaultTrianglePoints = [0, -30, 50, 30, -50, 30];
  const points = (element.points && 
                  Array.isArray(element.points) && 
                  element.points.length >= 6 && 
                  element.points.every(p => typeof p === 'number')) 
                  ? element.points 
                  : defaultTrianglePoints;
  // Calculate triangle area for caching decision (with null safety)
  const triangleArea = points && points.length >= 6 ? Math.abs(
    ((points[0] || 0) * ((points[3] || 0) - (points[5] || 0)) + 
     (points[2] || 0) * ((points[5] || 0) - (points[1] || 0)) + 
     (points[4] || 0) * ((points[1] || 0) - (points[3] || 0))) / 2
  ) : 0;
  
  // Apply shape caching for large triangles or when they have both fill and stroke
  const shouldCache = triangleArea > 2500 || !!(element.fill && element.stroke);
  
  const { nodeRef } = useShapeCaching({
    element,
    cacheConfig: {
      enabled: shouldCache,
      sizeThreshold: 2500,
      forceCache: false
    },
    dependencies: [element.fill, element.stroke, points, isSelected]
  });  return (
    <Line
      ref={nodeRef as React.RefObject<Konva.Line>}
      {...(konvaProps as any)}
      rotation={element.rotation || 0}
      points={points}
      closed
      fill={element.fill || designSystem.colors.success[500]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || designSystem.colors.success[500])}
      strokeWidth={isSelected ? 3 : Math.max(0, element.strokeWidth || 2)}
      // Konva performance optimizations
      perfectDrawEnabled={false} // Disable perfect drawing for fill+stroke triangles
      shadowForStrokeEnabled={false} // Disable shadow for stroke to prevent extra rendering pass
      listening={true} // Keep listening enabled for interactive triangles
    />
  );
});

TriangleShape.displayName = 'TriangleShape';

