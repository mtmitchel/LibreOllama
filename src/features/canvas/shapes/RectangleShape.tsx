// src/components/canvas/shapes/RectangleShape.tsx
import React from 'react';
import { Rect } from 'react-konva';
import Konva from 'konva';
import { RectangleElement } from '../types/enhanced.types';
import { designSystem } from '../../../core/design-system';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { BaseShapeProps } from '../types/shape-props.types';
import { ElementId, CanvasElement } from '../types/enhanced.types';

interface RectangleShapeProps extends BaseShapeProps<RectangleElement> {
  onSelect?: (elementId: ElementId) => void;
  onUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
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
  konvaProps,
  onSelect,
  onUpdate
}) => {
  console.log('🟨 [RectangleShape] Rendering rectangle:', element.id, { element, isSelected, konvaProps });
  
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
  // Event handlers for selection and dragging
  const handleClick = React.useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect?.(element.id);
  }, [onSelect, element.id]);

  const handleDragEnd = React.useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    onUpdate?.(element.id, { x: newX, y: newY });
  }, [onUpdate, element.id]);

  // TEMPORARY: Bypass caching for debugging
  const finalProps = {
    ...konvaProps,
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width || 100,
    height: element.height || 100,
    rotation: element.rotation || 0,
    fill: element.fill || designSystem.colors.primary[100],
    stroke: isSelected ? designSystem.colors.primary[500] : (element.stroke || '#333333'),
    strokeWidth: isSelected ? 2 : (element.strokeWidth || 1),
    cornerRadius: designSystem.borderRadius.md,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    listening: true,
    draggable: !element.isLocked,
    onClick: handleClick,
    onTap: handleClick,
    onDragEnd: handleDragEnd
  };
  
  console.log('🟨 [RectangleShape] Final props for Rect:', finalProps);
  
  return (
    <Rect
      {...finalProps}
      ref={nodeRef as React.RefObject<Konva.Rect>}
    />
  );
});

RectangleShape.displayName = 'RectangleShape';
