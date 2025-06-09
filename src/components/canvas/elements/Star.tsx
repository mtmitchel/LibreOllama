import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface StarProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Star: React.FC<StarProps> = ({ element, isSelected, onMouseDown }) => {
  // Draw the star
  const draw = useCallback((g: any) => {
    g.clear();
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('star');
    
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
    
    // Always set line style to ensure star is visible
    g.lineStyle(strokeWidth, strokeColor);
    
    // Only add fill if not transparent
    if (element.backgroundColor !== 'transparent') {
      g.beginFill(fillColor);
    }
    
    // Star points (scaled to element size)
    const scaleX = width / 60;
    const scaleY = height / 60;
    
    const points = [
      30 * scaleX, 2 * scaleY,
      37 * scaleX, 20 * scaleY,
      57 * scaleX, 20 * scaleY,
      42 * scaleX, 32 * scaleY,
      48 * scaleX, 52 * scaleY,
      30 * scaleX, 40 * scaleY,
      12 * scaleX, 52 * scaleY,
      18 * scaleX, 32 * scaleY,
      3 * scaleX, 20 * scaleY,
      23 * scaleX, 20 * scaleY
    ];
    
    g.drawPolygon(points);
    
    if (element.backgroundColor !== 'transparent') {
      g.endFill();
    }
    
    // Theme-aware selection indicator
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
      // Draw selection outline around star bounds
      const padding = 2;
      const selectionPoints = [
        (30 * scaleX) - padding, (2 * scaleY) - padding,
        (37 * scaleX) + padding, (20 * scaleY) - padding,
        (57 * scaleX) + padding, (20 * scaleY) + padding,
        (42 * scaleX) + padding, (32 * scaleY) + padding,
        (48 * scaleX) + padding, (52 * scaleY) + padding,
        (30 * scaleX), (40 * scaleY) + padding,
        (12 * scaleX) - padding, (52 * scaleY) + padding,
        (18 * scaleX) - padding, (32 * scaleY) + padding,
        (3 * scaleX) - padding, (20 * scaleY) + padding,
        (23 * scaleX) - padding, (20 * scaleY) - padding
      ];
      g.drawPolygon(selectionPoints);
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

export default Star;
