import React, { useCallback } from 'react';
import { Graphics } from '@pixi/react';
import { CanvasElement } from '../../../stores/canvasStore';

interface HexagonProps {
  element: CanvasElement;
  isSelected?: boolean;
  onMouseDown?: (e: any, elementId: string) => void;
}

const Hexagon: React.FC<HexagonProps> = ({ element, isSelected, onMouseDown }) => {
  // Convert hex color to number for Pixi
  const hexToNumber = (hex: string | undefined): number => {
    if (!hex) return 0x000000;
    const cleaned = hex.replace('#', '');
    return parseInt(cleaned, 16);
  };

  // Draw the hexagon
  const draw = useCallback((g: any) => {
    g.clear();
    
    const fillColor = hexToNumber(element.color || '#06b6d4');
    g.beginFill(fillColor);
    
    // Selection indicator
    if (isSelected) {
      g.lineStyle(2, 0x007acc, 1);
    }
    
    // Hexagon points (scaled to element size)
    const width = element.width || 60;
    const height = element.height || 60;
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
    g.endFill();
  }, [element.width, element.height, element.color, isSelected]);

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
