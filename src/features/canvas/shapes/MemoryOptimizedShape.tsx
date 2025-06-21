// src/components/canvas/shapes/MemoryOptimizedShape.tsx
/**
 * A shape component that demonstrates memory optimization best practices
 * This is a simplified version for testing purposes
 */

import React, { useMemo } from 'react';
import { Rect, Image as KonvaImage } from 'react-konva';

interface MemoryOptimizedShapeProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  imageUrl?: string;
  onSelect?: () => void;
}

export const MemoryOptimizedShape: React.FC<MemoryOptimizedShapeProps> = ({
  id,
  x,
  y,
  width,
  height,
  fill = '#blue',
  imageUrl,
  onSelect
}) => {
  // Memoize image loading to prevent memory leaks
  const image = useMemo(() => {
    if (!imageUrl) return null;
    
    const img = new window.Image();
    img.src = imageUrl;
    return img;
  }, [imageUrl]);

  // Handle click
  const handleClick = () => {
    onSelect?.();
  };

  if (imageUrl && image) {
    return (
      <KonvaImage
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        image={image}
        onClick={handleClick}
        data-testid="memory-optimized-shape"
      />
    );
  }

  return (
    <Rect
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      onClick={handleClick}
      data-testid="memory-optimized-shape"
    />
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(MemoryOptimizedShape);
