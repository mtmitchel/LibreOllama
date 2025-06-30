// src/features/canvas/shapes/StarShape.tsx
import React from 'react';
import { Star } from 'react-konva';
import Konva from 'konva';
import { StarElement } from '../types/enhanced.types';
import { designSystem } from '../../../core/design-system';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { BaseShapeProps } from '../types/shape-props.types';

interface StarShapeProps extends BaseShapeProps<StarElement> {
  // Star-specific props can be added here if needed
}

/**
 * StarShape - Optimized star component with caching
 * - Performance-optimized with React.memo and shape caching
 * - Handles star-specific geometry and styling
 * - Implements proper error handling and prop validation
 */
export const StarShape: React.FC<StarShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
}) => {
  // Validate and ensure reasonable star properties
  const numPoints = Math.max(3, Math.min(20, Math.floor(element.numPoints || 5)));
  const outerRadius = Math.max(5, element.outerRadius || 50);
  const innerRadius = Math.max(1, Math.min(outerRadius * 0.9, element.innerRadius || 25));

  // Calculate star area for caching decision
  const starArea = Math.PI * outerRadius * outerRadius;
  
  // Apply shape caching for large stars or when they have both fill and stroke
  const shouldCache = starArea > 5000 || !!(element.fill && element.stroke);
  
  const { nodeRef } = useShapeCaching({
    element,
    cacheConfig: {
      enabled: shouldCache,
      sizeThreshold: 5000,
      forceCache: false
    },
    dependencies: [element.fill, element.stroke, numPoints, innerRadius, outerRadius, isSelected]
  });
  return (    <Star
      ref={nodeRef as React.RefObject<Konva.Star>}
      {...(konvaProps as any)}
      rotation={element.rotation || 0}
      numPoints={numPoints}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      fill={element.fill || designSystem.colors.warning[500]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || designSystem.colors.warning[600])}
      strokeWidth={isSelected ? 3 : Math.max(0, element.strokeWidth || 2)}
      // Konva performance optimizations
      perfectDrawEnabled={false} // Disable perfect drawing for fill+stroke stars
      shadowForStrokeEnabled={false} // Disable shadow for stroke to prevent extra rendering pass
      listening={true} // Keep listening enabled for interactive stars
    />
  );
});

StarShape.displayName = 'StarShape';

