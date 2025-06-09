import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface LineProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Line: React.FC<LineProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0x000000;
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // Draw the line
  const draw = useCallback((g: any) => {
    g.clear();
    
    const color = hexToNumber(element.color || '#000000');
    const strokeWidth = element.strokeWidth || 2;
    
    g.lineStyle(strokeWidth, color);
    
    // Selection indicator
    if (isSelected) {
      g.lineStyle(strokeWidth + 1, 0x007acc, 0.8);
    }
    
    const x1 = 0; // Relative to element position
    const y1 = 0;
    const x2 = (element.x2 || element.x) - element.x; // Make relative to element position
    const y2 = (element.y2 || element.y) - element.y;
    
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
  }, [element.x, element.y, element.x2, element.y2, element.color, element.strokeWidth, isSelected]);

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

export default Line;
