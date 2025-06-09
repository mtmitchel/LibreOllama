import React, { useCallback } from 'react';
import { Graphics } from '../../../lib/pixi-setup';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface RectangleProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Rectangle: React.FC<RectangleProps> = ({ element, isSelected, onMouseDown }) => {
  // The 'draw' function is how we tell Pixi what to render
  const draw = useCallback((g: any) => {
    g.clear();
    
    // Validate element has proper dimensions
    const width = Math.max(element.width || 100, 1); // Ensure minimum size
    const height = Math.max(element.height || 100, 1); // Ensure minimum size
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('rectangle');
    
    // Fill color - use backgroundColor for rectangles, fallback to defaults
    const fillColor = element.backgroundColor && element.backgroundColor !== 'transparent'
      ? hexStringToNumber(element.backgroundColor)
      : defaultColors.fill;
    
    // Stroke - use strokeColor or fallback to color for stroke (always have a stroke for visibility)
    const strokeColor = element.strokeColor 
      ? hexStringToNumber(element.strokeColor)
      : element.color 
        ? hexStringToNumber(element.color)
        : defaultColors.stroke;
    const strokeWidth = element.strokeWidth || 2;
    
    // Always set line style to ensure rectangle is visible
    g.lineStyle(strokeWidth, strokeColor);
    
    // Only add fill if not transparent
    if (element.backgroundColor !== 'transparent') {
      g.beginFill(fillColor);
    }
    
    // Draw rectangle with validated dimensions
    g.drawRect(0, 0, width, height);
    
    if (element.backgroundColor !== 'transparent') {
      g.endFill();
    }
    
    // Selection indicator - use theme color
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
      g.drawRect(-2, -2, width + 4, height + 4);
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
      eventMode="static"
      pointerdown={handlePointerDown}
      cursor="pointer"
    />
  );
};

export default Rectangle;