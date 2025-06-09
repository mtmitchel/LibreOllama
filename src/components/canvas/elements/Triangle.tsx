import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface TriangleProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Triangle: React.FC<TriangleProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0x000000;
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // Draw the triangle
  const draw = useCallback((g: any) => {
    g.clear();
    
    const fillColor = hexToNumber(element.color || '#8b5cf6');
    g.beginFill(fillColor);
    
    // Selection indicator
    if (isSelected) {
      g.lineStyle(2, 0x007acc, 1);
    }
    
    const width = element.width || 60;
    const height = element.height || 60;
    
    // Draw triangle (pointing up)
    g.moveTo(width / 2, 0);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
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

export default Triangle;
