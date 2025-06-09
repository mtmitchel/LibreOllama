import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';
import { hexStringToNumber, getThemeColors, getDefaultElementColors } from '../../../lib/theme-utils';

interface HexagonProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Hexagon: React.FC<HexagonProps> = ({ element, isSelected, onMouseDown }) => {
  // Draw the hexagon
  const draw = useCallback((g: any) => {
    g.clear();
    
    const themeColors = getThemeColors();
    const defaultColors = getDefaultElementColors('hexagon');
    
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
    
    // Always set line style to ensure hexagon is visible
    g.lineStyle(strokeWidth, strokeColor);
    
    // Only add fill if not transparent
    if (element.backgroundColor !== 'transparent') {
      g.beginFill(fillColor);
    }
    
    // Hexagon points (scaled to element size)
    const scaleX = width / 60;
    const scaleY = height / 60;
    
    const points = [
      30 * scaleX, 2 * scaleY,
      52 * scaleX, 15 * scaleY,
      52 * scaleX, 45 * scaleY,
      30 * scaleX, 58 * scaleY,
      8 * scaleX, 45 * scaleY,
      8 * scaleX, 15 * scaleY
    ];
    
    g.drawPolygon(points);
    
    if (element.backgroundColor !== 'transparent') {
      g.endFill();
    }
    
    // Theme-aware selection indicator
    if (isSelected) {
      g.lineStyle(2, themeColors.selectionBlue, 1);
      // Draw selection outline around hexagon bounds
      const padding = 2;
      const selectionPoints = [
        (30 * scaleX), (2 * scaleY) - padding,
        (52 * scaleX) + padding, (15 * scaleY) - padding,
        (52 * scaleX) + padding, (45 * scaleY) + padding,
        (30 * scaleX), (58 * scaleY) + padding,
        (8 * scaleX) - padding, (45 * scaleY) + padding,
        (8 * scaleX) - padding, (15 * scaleY) - padding
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

export default Hexagon;
