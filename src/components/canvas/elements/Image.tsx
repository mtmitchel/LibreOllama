import React, { useCallback } from 'react';
import { Sprite, Graphics } from '../../../lib/pixi-setup';
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

  // If no image URL, render a placeholder rectangle instead of returning null
  if (!element.imageUrl) {
    const draw = useCallback((g: any) => {
      g.clear();
      g.beginFill(0xf0f0f0); // Light gray placeholder
      g.lineStyle(2, 0xcccccc); // Gray border
      g.drawRect(0, 0, element.width || 100, element.height || 100);
      g.endFill();
      
      // Draw an "X" to indicate missing image
      g.lineStyle(2, 0x999999);
      const w = element.width || 100;
      const h = element.height || 100;
      g.moveTo(10, 10);
      g.lineTo(w - 10, h - 10);
      g.moveTo(w - 10, 10);
      g.lineTo(10, h - 10);
    }, [element.width, element.height]);

    return (
      <Graphics
        x={element.x}
        y={element.y}
        draw={draw}
        interactive
        pointerdown={handlePointerDown}
        cursor="pointer"
      />
    );
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
