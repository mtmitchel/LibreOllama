import React, { useCallback } from 'react';
import { Graphics } from '../../../lib/pixi-setup';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface DrawingElementProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const DrawingElement: React.FC<DrawingElementProps> = ({ element, isSelected, onMouseDown }) => {
  // Draw the path/line
  const draw = useCallback((g: any) => {
    g.clear();
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('drawing');
    
    // Ensure we have valid points data
    if (!element.points || !Array.isArray(element.points) || element.points.length < 2) {
      // Draw a small placeholder if no valid points using theme colors
      // PIXI v8: Use circle and fill instead of beginFill/drawCircle/endFill
      g.circle(0, 0, 5);
      g.fill({
        color: themeColors.textSecondary,
        alpha: 0.5
      });
      return;
    }
    
    // Handle colors consistently using theme-utils
    const strokeColor = element.strokeColor
      ? hexStringToNumber(element.strokeColor)
      : element.color
        ? hexStringToNumber(element.color)
        : defaultColors.stroke;
        
    const strokeWidth = element.strokeWidth || 2;
    
    // PIXI v8: Use setStrokeStyle instead of lineStyle
    g.setStrokeStyle({
      width: strokeWidth,
      color: strokeColor,
      alpha: 1
    });
    
    // Move to first point (relative to element position)
    const firstPoint = element.points[0];
    g.moveTo(firstPoint.x - element.x, firstPoint.y - element.y);
    
    // Draw lines to subsequent points
    for (let i = 1; i < element.points.length; i++) {
      const point = element.points[i];
      g.lineTo(point.x - element.x, point.y - element.y);
    }
    
    // PIXI v8: Stroke the path
    g.stroke();
    
    // Theme-aware selection indicator - draw a bounding box around the drawing
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
      
      // PIXI v8: Use setStrokeStyle and rect instead of lineStyle and drawRect
      g.setStrokeStyle({
        width: 2,
        color: themeColors.selectionBlue,
        alpha: 1
      });
      g.rect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
      g.stroke();
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