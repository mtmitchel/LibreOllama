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
    
    // Calculate radius from width/height with safety checks
    const width = Math.max(element.width || 100, 1);
    const height = Math.max(element.height || 100, 1);
    const radius = Math.min(width, height) / 2;
    
    // Fill color - use element color or theme-aware default
    const fillColor = element.color
      ? hexStringToNumber(element.color)
      : defaultColors.fill;
    
    // Stroke - always have a stroke for visibility if no fill
    const strokeColor = element.strokeColor 
      ? hexStringToNumber(element.strokeColor)
      : element.color 
        ? hexStringToNumber(element.color)
        : defaultColors.stroke;
    const strokeWidth = element.strokeWidth || 2;
    
    // Always set line style to ensure circle is visible
    g.lineStyle(strokeWidth, strokeColor);
    
    // Only fill if we have a background color (not transparent)
    if (element.backgroundColor !== 'transparent') {
      g.beginFill(fillColor);
    }
    
    // Draw circle at center
    g.drawCircle(radius, radius, radius);
    
    if (element.backgroundColor !== 'transparent') {
      g.endFill();
    }
    
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