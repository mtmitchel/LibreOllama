import React, { useCallback } from 'react';
import { Sprite } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface ImageProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Image: React.FC<ImageProps> = ({ element, onMouseDown }) => {
  const handlePointerDown = useCallback((e: any) => {
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

  // Only render if we have an image URL
  if (!element.imageUrl) {
    return null;
  }

  return (
    <Sprite
      x={element.x}
      y={element.y}
      width={element.width || 100}
      height={element.height || 100}
      image={element.imageUrl}
      interactive
      pointerdown={handlePointerDown}
      cursor="pointer"
      // Note: Selection indicator for images could be added as a separate Graphics component
      // if needed, but for now we'll keep it simple
    />
  );
};

export default Image;
