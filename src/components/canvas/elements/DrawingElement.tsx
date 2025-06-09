import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface DrawingElementProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const DrawingElement: React.FC<DrawingElementProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0x000000;
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // Draw the path/line
  const draw = useCallback((g: any) => {
    g.clear();
    
    if (!element.points || element.points.length < 2) {
      return; // Need at least 2 points to draw
    }
    
    const strokeColor = hexToNumber(element.strokeColor || element.color || '#000000');
    const strokeWidth = element.strokeWidth || 2;
    
    g.lineStyle(strokeWidth, strokeColor);
    
    // Move to first point (relative to element position)
    const firstPoint = element.points[0];
    g.moveTo(firstPoint.x - element.x, firstPoint.y - element.y);
    
    // Draw lines to subsequent points
    for (let i = 1; i < element.points.length; i++) {
      const point = element.points[i];
      g.lineTo(point.x - element.x, point.y - element.y);
    }
    
    // Selection indicator - draw a bounding box around the drawing
    if (isSelected && element.points.length > 0) {
      // Calculate bounding box
      let minX = element.points[0].x - element.x;
      let maxX = minX;
      let minY = element.points[0].y - element.y;
      let maxY = minY;
      
      element.points.forEach(point => {
        const relX = point.x - element.x;
        const relY = point.y - element.y;
        minX = Math.min(minX, relX);
        maxX = Math.max(maxX, relX);
        minY = Math.min(minY, relY);
        maxY = Math.max(maxY, relY);
      });
      
      g.lineStyle(1, 0x007acc, 1);
      g.drawRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
    }
  }, [element.points, element.x, element.y, element.strokeColor, element.color, element.strokeWidth, isSelected]);

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

export default DrawingElement;