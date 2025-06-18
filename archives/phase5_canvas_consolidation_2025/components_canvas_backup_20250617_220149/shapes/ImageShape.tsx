// src/components/canvas/shapes/ImageShape.tsx
import React from 'react';
import { Image } from 'react-konva';
import { CanvasElement } from '../layers/types';

interface ImageShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

/**
 * ImageShape - Optimized image component
 * - Performance-optimized with React.memo
 * - Handles image-specific logic
 */
export const ImageShape: React.FC<ImageShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate
}) => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const imageSrc = (element as any).src;
    if (imageSrc) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImage(img);
      img.src = imageSrc;
    }
  }, [(element as any).src]);

  return (
    <Image
      {...konvaProps}
      image={image}
      width={element.width || 100}
      height={element.height || 100}
    />
  );
});

ImageShape.displayName = 'ImageShape';
