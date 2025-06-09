import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface StarProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Star: React.FC<StarProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0x000000;
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // Draw the star
  const draw = useCallback((g: any) => {
    g.clear();
    
    const fillColor = hexToNumber(element.color || '#f59e0b');
    g.beginFill(fillColor);
    
    // Selection indicator
    if (isSelected) {
      g.lineStyle(2, 0x007acc, 1);
    }
    
    // Star points (scaled to element size)
    const width = element.width || 60;
    const height = element.height || 60;
    const scaleX = width / 60;
    const scaleY = height / 60;
    
    const points = [
      30 * scaleX, 2 * scaleY,
      37 * scaleX, 20 * scaleY,
      57 * scaleX, 20 * scaleY,
      42 * scaleX, 32 * scaleY,
      48 * scaleX, 52 * scaleY,
      30 * scaleX, 40 * scaleY,
      12 * scaleX, 52 * scaleY,
      18 * scaleX, 32 * scaleY,
      3 * scaleX, 20 * scaleY,
      23 * scaleX, 20 * scaleY
    ];
    
    g.drawPolygon(points);
    g.endFill();
  }, [element.width, element.height, element.color, isSelected]);

  const handlePointerDown = useCallback((e: any) => {
    if (onMouseDown) {
      onMouseDown(e, element.id);
    }
  }, [onMouseDown, element.id]);

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
};

export default Star;
