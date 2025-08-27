// src/components/canvas/shapes/ImageShape.tsx
import React from 'react';
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
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  
  React.useEffect(() => {
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
      ref={ref}
      {...konvaProps}
      id={element.id}
      image={image || undefined}
      x={element.x}
      y={element.y}
      width={element.width || 100}
      height={element.height || 100}
      opacity={element.opacity || 1}
      draggable={true}
      onDragEnd={handleDragEnd}
      onTransformEnd={onTransformEnd}
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