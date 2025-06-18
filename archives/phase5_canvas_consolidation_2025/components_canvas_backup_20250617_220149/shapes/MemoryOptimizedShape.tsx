// src/components/canvas/shapes/MemoryOptimizedShape.tsx
/**
 * Example implementation showing how to integrate memory tracking with canvas components
 * Part of Phase 4 Performance Optimizations
 */

import React, { useEffect, useMemo } from 'react';
import { Rect, Image as KonvaImage } from 'react-konva';
import { 
  useComponentMemoryTracking, 
  useKonvaNodeTracking, 
  useTextureMemoryTracking,
  useEventListenerTracking 
} from '../../features/canvas/hooks/canvas/useCanvasPerformance';

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
}) => {  // Track component memory usage
  const { trackOperation } = useComponentMemoryTracking('MemoryOptimizedShape');
  
  // Track event listeners
  const { addListener, removeListener } = useEventListenerTracking();

  // Track Konva nodes (1 for the shape itself)
  useKonvaNodeTracking(1);

  // Track texture memory if we have an image
  useTextureMemoryTracking(
    imageUrl ? width : 0, 
    imageUrl ? height : 0, 
    'RGBA'
  );

  // Memoize image loading to prevent memory leaks
  const image = useMemo(() => {
    if (!imageUrl) return null;
    
    return trackOperation('loadImage', () => {
      const img = new window.Image();
      img.src = imageUrl;
      return img;
    });
  }, [imageUrl, trackOperation]);
  // Track event listener registration
  useEffect(() => {
    if (onSelect) {
      addListener();
      return () => removeListener();
    }
    return undefined;
  }, [onSelect, addListener, removeListener]);

  // Handle click with memory tracking
  const handleClick = () => {
    trackOperation('handleClick', () => {
      onSelect?.();
    });
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
    />
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(MemoryOptimizedShape);
