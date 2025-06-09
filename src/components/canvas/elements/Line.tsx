import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface LineProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Line: React.FC<LineProps> = ({ element, isSelected, onMouseDown }) => {  // Draw the line
  const draw = useCallback((g: any) => {
    g.clear();
    
    // Validate that we have proper coordinates
    if (typeof element.x !== 'number' || typeof element.y !== 'number') {
      console.warn('Line element has invalid coordinates:', element);
      return;
    }
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('line');
    
    // Handle colors consistently using theme-utils
    const strokeColor = element.strokeColor
      ? hexStringToNumber(element.strokeColor)
      : element.color
        ? hexStringToNumber(element.color)
        : defaultColors.stroke; // Use theme-aware default
        
    const strokeWidth = element.strokeWidth || 2;
    
    g.lineStyle(strokeWidth, strokeColor);
    
    const x1 = 0; // Relative to element position
    const y1 = 0;
    
    // Use default end coordinates if not provided
    const x2 = (element.x2 !== undefined ? element.x2 : element.x + 100) - element.x; // Make relative to element position
    const y2 = (element.y2 !== undefined ? element.y2 : element.y) - element.y;
    
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    
    // Theme-aware selection indicator
    if (isSelected) {
      g.lineStyle(strokeWidth + 2, themeColors.selectionBlue, 0.8);
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
    }
  }, [element.x, element.y, element.x2, element.y2, element.strokeColor, element.color, element.strokeWidth, isSelected]);

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
