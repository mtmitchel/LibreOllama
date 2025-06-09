import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
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
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('rectangle');
    
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
    
    // Draw rectangle
    g.drawRect(0, 0, element.width || 100, element.height || 100);
    g.endFill();
    
    // Selection indicator - use theme color
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
      g.drawRect(-2, -2, (element.width || 100) + 4, (element.height || 100) + 4);
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
      interactive={true}
      pointerdown={handlePointerDown}
      cursor="pointer"
    />
  );
};

export default Rectangle;