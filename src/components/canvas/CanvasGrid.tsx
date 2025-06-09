import React, { useCallback } from 'react';
import { Graphics } from '../../lib/pixi-setup';

interface CanvasGridProps {
  zoomLevel?: number;
  panOffset?: { x: number; y: number };
  canvasSize?: { width: number; height: number };
}

const CanvasGrid: React.FC<CanvasGridProps> = ({ 
  zoomLevel = 1, 
  panOffset = { x: 0, y: 0 },
  canvasSize = { width: 1000, height: 1000 }
}) => {
  const draw = useCallback((g: any) => {
    g.clear();
    
    const lineColor = 0xcccccc;
    const lineWidth = 1 / zoomLevel;
    
    // PIXI v8: Use setStrokeStyle instead of lineStyle
    g.setStrokeStyle({
      width: lineWidth,
      color: lineColor,
      alpha: 0.3
    });

    const step = 20; // Grid step in world units
    const scaledStep = step * zoomLevel;

    // Only draw grid if zoom level is reasonable
    if (scaledStep < 5) return; // Too small to see

    // Vertical lines
    const startX = -panOffset.x % scaledStep;
    for (let x = startX; x < canvasSize.width; x += scaledStep) {
      g.moveTo(x, 0);
      g.lineTo(x, canvasSize.height);
    }

    // Horizontal lines
    const startY = -panOffset.y % scaledStep;
    for (let y = startY; y < canvasSize.height; y += scaledStep) {
      g.moveTo(0, y);
      g.lineTo(canvasSize.width, y);
    }
    
    // PIXI v8: Stroke the path
    g.stroke();
  }, [zoomLevel, panOffset, canvasSize]);

  // Always return a valid Graphics component
  return <Graphics draw={draw} />;
};

export default CanvasGrid;