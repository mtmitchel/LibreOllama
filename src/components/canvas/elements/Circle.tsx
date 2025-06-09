import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface CircleProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Circle: React.FC<CircleProps> = ({ element, isSelected, onMouseDown }) => {
  // The 'draw' function for the circle
  const draw = useCallback((g: any) => {
    g.clear();
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('circle');
    
    // Calculate radius from width/height
    const radius = Math.min(element.width || 100, element.height || 100) / 2;
    
    // Fill color - use element color or theme-aware default
    const fillColor = element.color
      ? hexStringToNumber(element.color)
      : defaultColors.fill;
    g.beginFill(fillColor);
    
    // Stroke if specified
    if (element.strokeColor && element.strokeWidth) {
      const strokeColor = hexStringToNumber(element.strokeColor);
      g.lineStyle(element.strokeWidth, strokeColor);
    }
    
    // Draw circle at center
    g.drawCircle(radius, radius, radius);
    g.endFill();
    
    // Selection indicator - use theme color
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
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