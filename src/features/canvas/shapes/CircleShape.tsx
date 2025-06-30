// src/components/canvas/shapes/CircleShape.tsx
import React from 'react';
import { Circle } from 'react-konva';
import Konva from 'konva';
import { CircleElement } from '../types/enhanced.types';
import { designSystem } from '../../../core/design-system';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { BaseShapeProps } from '../types/shape-props.types';
import { ElementId, CanvasElement } from '../types/enhanced.types';

interface CircleShapeProps extends BaseShapeProps<CircleElement> {
  onSelect?: (elementId: ElementId) => void;
  onUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
}

/**
 * CircleShape - Optimized circle component with caching
 * - Performance-optimized with React.memo and shape caching
 * - Handles circle-specific logic with proper coordinate transformation
 * - Automatically caches large circles
 * - Implements proper error handling and prop validation
 */
export const CircleShape: React.FC<CircleShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onSelect,
  onUpdate
}) => {
  // Validate and ensure minimum radius to prevent rendering issues
  const radius = Math.max(1, element.radius || 50);
  
  // Apply shape caching for large circles or when they have both fill and stroke
  const shouldCache = (radius * radius * Math.PI > 10000) || !!(element.fill && element.stroke);
  
  const { nodeRef } = useShapeCaching({
    element,
    cacheConfig: {
      enabled: shouldCache,
      sizeThreshold: 10000,
      forceCache: false
    },
    dependencies: [element.fill, element.stroke, element.radius, isSelected]
  });

  // Event handlers for selection and dragging
  const handleClick = React.useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect?.(element.id);
  }, [onSelect, element.id]);

  const handleDragEnd = React.useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x() - radius; // Convert back to top-left coordinates
    const newY = e.target.y() - radius;
    onUpdate?.(element.id, { x: newX, y: newY });
  }, [onUpdate, element.id, radius]);

  // Handle coordinate transformation properly with validation
  // Store coordinates represent top-left corner, but Circle needs center coordinates
  const safeX = konvaProps?.x ?? element.x ?? 0;
  const safeY = konvaProps?.y ?? element.y ?? 0;
  const centerX = safeX + radius;
  const centerY = safeY + radius;
    return (
    <Circle
      {...konvaProps}
      ref={nodeRef as React.RefObject<Konva.Circle>}
      id={element.id}
      x={centerX}
      y={centerY}
      radius={radius}
      rotation={element.rotation || 0}
      fill={element.fill || designSystem.colors.primary[100]}
      stroke={isSelected ? designSystem.colors.primary[500] : (element.stroke || '')}
      strokeWidth={isSelected ? 2 : (element.strokeWidth || 0)}
      // Konva performance optimizations
      perfectDrawEnabled={false} // Disable perfect drawing for fill+stroke circles
      shadowForStrokeEnabled={false} // Disable shadow for stroke to prevent extra rendering pass
      listening={true} // Keep listening enabled for interactive circles
      draggable={!element.isLocked}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
    />
  );
});

CircleShape.displayName = 'CircleShape';
