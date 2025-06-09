import React, { useCallback } from 'react';
import { Graphics } from '../../../lib/pixi-setup';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface TriangleProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Triangle: React.FC<TriangleProps> = ({ element, isSelected, onMouseDown }) => {
  // Draw the triangle
  const draw = useCallback((g: any) => {
    g.clear();
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('triangle');
    
    // Validate dimensions with safety checks
    const width = Math.max(element.width || 100, 1);
    const height = Math.max(element.height || 100, 1);
    
    // Handle colors consistently using theme-utils
    const fillColor = element.backgroundColor && element.backgroundColor !== 'transparent'
      ? hexStringToNumber(element.backgroundColor)
      : defaultColors.fill;
    
    const strokeColor = element.strokeColor
      ? hexStringToNumber(element.strokeColor)
      : element.color
        ? hexStringToNumber(element.color)
        : defaultColors.stroke;
        
    const strokeWidth = element.strokeWidth || 2;
    
    // Always set line style to ensure triangle is visible
    g.lineStyle(strokeWidth, strokeColor);
    
    // Only add fill if not transparent
    if (element.backgroundColor !== 'transparent') {
      g.beginFill(fillColor);
    }
    
    // Draw triangle (pointing up)
    g.moveTo(width / 2, 0);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    
    if (element.backgroundColor !== 'transparent') {
      g.endFill();
    }
    
    // Theme-aware selection indicator
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
      g.moveTo(width / 2 - 2, -2);
      g.lineTo(width + 2, height + 2);
      g.lineTo(-2, height + 2);
      g.closePath();
    }
  }, [element.width, element.height, element.backgroundColor, element.strokeColor, element.strokeWidth, element.color, isSelected]);
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
