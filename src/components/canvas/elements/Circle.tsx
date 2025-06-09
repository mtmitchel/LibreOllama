import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface CircleProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Circle: React.FC<CircleProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0x000000;
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // The 'draw' function for the circle
  const draw = useCallback((g: any) => {
    g.clear();
    
    // Calculate radius from width/height
    const radius = Math.min(element.width || 100, element.height || 100) / 2;
    
    // Fill color
    const fillColor = hexToNumber(element.color || '#bfdbfe');
    g.beginFill(fillColor);
    
    // Stroke if specified
    if (element.strokeColor && element.strokeWidth) {
      const strokeColor = hexToNumber(element.strokeColor);
      g.lineStyle(element.strokeWidth, strokeColor);
    }
    
    // Draw circle at center
    g.drawCircle(radius, radius, radius);
    g.endFill();
    
    // Selection indicator
    if (isSelected) {
      g.lineStyle(2, 0x007acc, 1);
      g.drawCircle(radius, radius, radius + 2);
    }
  }, [element.width, element.height, element.color, element.strokeColor, element.strokeWidth, isSelected]);

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

export default Circle;