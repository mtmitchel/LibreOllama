// src/features/canvas/shapes/PenShape.tsx
import React from 'react';
import { Line } from 'react-konva';
import { PenElement } from '../types/enhanced.types';
import { designSystem } from '../../../styles/designSystem';
import { useShapeCaching } from '../hooks/canvas/useShapeCaching';

interface PenShapeProps {
  element: PenElement;
  konvaProps: any;
}

/**
 * PenShape - Optimized pen stroke component
 * - Performance-optimized with React.memo and shape caching
 * - Handles pen-specific drawing and styling
 * - Applies Konva performance optimizations (perfectDrawEnabled, shadowForStrokeEnabled)
 */
export const PenShape: React.FC<PenShapeProps> = React.memo(({
  element,
  konvaProps,
}) => {
  // Apply shape caching for complex pen strokes
  const { nodeRef } = useShapeCaching({
    element,
    cacheConfig: {
      enabled: true,
      complexityThreshold: 10, // Cache pen strokes with many points
      sizeThreshold: 5000, // Cache large pen strokes
      forceCache: false
    },
    dependencies: [element.points, element.stroke, element.strokeWidth]
  });

  return (
    <Line
      ref={nodeRef}
      {...konvaProps}
      id={element.id}
      points={element.points || [0, 0, 100, 0]}
      stroke={element.stroke || designSystem.colors.secondary[800]}
      strokeWidth={element.strokeWidth || 3}
      lineCap="round"
      lineJoin="round"
      tension={element.tension || 0.5}
      // Konva performance optimizations
      perfectDrawEnabled={false} // Disable perfect drawing for better performance
      shadowForStrokeEnabled={false} // Disable shadow for stroke to prevent extra rendering pass
      listening={true} // Keep listening enabled for pen strokes (need interaction)
    />
  );
});

PenShape.displayName = 'PenShape';
