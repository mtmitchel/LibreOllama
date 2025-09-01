// src/components/canvas/shapes/ImageShape.tsx
import React from 'react';
import { useShapeCaching } from '../hooks/useShapeCaching';
import { Image } from 'react-konva';
import Konva from 'konva';
import { ImageElement, ElementId, CanvasElement } from '../types/enhanced.types';

interface ImageShapeProps {
  element: ImageElement;
  isSelected: boolean;
  konvaProps: Partial<Konva.ImageConfig>;
  onUpdate: (id: ElementId, updates: Partial<CanvasElement>) => void;
  onStartTextEdit: (elementId: ElementId) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<any>) => void;
}

/**
 * ImageShape - Optimized image component
 * - Performance-optimized with React.memo
 * - Handles image-specific logic with full interaction support
 */
export const ImageShape = React.forwardRef<Konva.Image, ImageShapeProps>(({ 
  element,
  isSelected,
  konvaProps,
  onUpdate,
  onStartTextEdit,
  onTransformEnd
}, ref) => {
  // Strategic shape caching for images
  const imageCaching = useShapeCaching({
    element: element as unknown as CanvasElement,
    cacheConfig: {
      enabled: true,
      sizeThreshold: (element.width || 100) * (element.height || 100) > require('../utils/performance/cacheTuning').getCacheThresholds().image.size ? 1 : require('../utils/performance/cacheTuning').getCacheThresholds().image.size,
      complexityThreshold: 2,
      forceCache: false
    },
    dependencies: [image, element.width, element.height, element.opacity, (element as any).filters, (element as any).shadow]
  });

  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  
  React.useEffect(() => {
    // Clear cache when src changes to avoid stale image bitmap
    try { imageCaching.clearCaching(); } catch {}

    const imageSrc = (element as any).src || (element as any).imageUrl; // Support both field names
    if (imageSrc) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImage(img);
      img.onerror = () => {
        console.error('🖼️ [ImageShape] Failed to load image:', imageSrc);
      };
      img.src = imageSrc;
    }
  }, [(element as any).src, (element as any).imageUrl]);

  // Handle drag events
  const handleDragEnd = React.useCallback((e: any) => {
    const node = e.target;
    onUpdate(element.id, {
      x: node.x(),
      y: node.y()
    });
  }, [element.id, onUpdate]);

  return (
    <Image
      ref={(node) => {
        if (typeof ref === 'function') ref(node as any);
        else if (ref && 'current' in ref) (ref as any).current = node as any;
        if (node) {
          imageCaching.nodeRef.current = node as any;
          if (imageCaching.shouldCache) setTimeout(() => imageCaching.applyCaching(), 0);
        }
      }}
      {...konvaProps}
      id={element.id}
      image={image || undefined}
      x={element.x}
      y={element.y}
      width={element.width || 100}
      height={element.height || 100}
      opacity={element.opacity || 1}
      draggable={true}
      onDragEnd={(e) => {
        handleDragEnd(e);
        setTimeout(() => imageCaching.refreshCache(), 0);
      }}
      onTransformEnd={(e) => {
        onTransformEnd(e);
        setTimeout(() => imageCaching.refreshCache(), 0);
      }}
      // Add selection highlighting
      stroke={isSelected ? '#3B82F6' : undefined}
      strokeWidth={isSelected ? 2 : 0}
      // Ensure good performance
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
    />
  );
});

ImageShape.displayName = 'ImageShape';
// Archived (2025-09-01): Legacy react-konva image shape.
