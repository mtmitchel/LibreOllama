/**
 * Infinite Canvas Grid Component
 * Renders a dynamic grid that extends infinitely and adapts to zoom levels
 */

import React, { useCallback, useMemo } from 'react';
import { Graphics } from '../../lib/pixi-setup';
import { INFINITE_CANVAS_CONFIG, Point } from '../../lib/canvas-coordinates';

interface InfiniteCanvasGridProps {
  zoomLevel: number;
  panOffset: { x: number; y: number };
  viewportWidth: number;
  viewportHeight: number;
  containerRef?: React.RefObject<HTMLElement>;
}

const InfiniteCanvasGrid: React.FC<InfiniteCanvasGridProps> = ({ 
  zoomLevel, 
  panOffset, 
  viewportWidth,
  viewportHeight
}) => {
  
  // Calculate visible grid range based on viewport and zoom
  const gridRange = useMemo(() => {
    const gridSize = INFINITE_CANVAS_CONFIG.GRID_SIZE;
    const majorGridSize = INFINITE_CANVAS_CONFIG.GRID_MAJOR_SIZE;
    
    // Convert viewport to world coordinates
    const worldLeft = (-panOffset.x) / zoomLevel;
    const worldTop = (-panOffset.y) / zoomLevel;
    const worldRight = (viewportWidth - panOffset.x) / zoomLevel;
    const worldBottom = (viewportHeight - panOffset.y) / zoomLevel;
    
    // Expand range to include margin
    const margin = 500 / zoomLevel; // Margin in world units
    const startX = Math.floor((worldLeft - margin) / gridSize) * gridSize;
    const endX = Math.ceil((worldRight + margin) / gridSize) * gridSize;
    const startY = Math.floor((worldTop - margin) / gridSize) * gridSize;
    const endY = Math.ceil((worldBottom + margin) / gridSize) * gridSize;
    
    return { startX, endX, startY, endY, gridSize, majorGridSize };
  }, [zoomLevel, panOffset.x, panOffset.y, viewportWidth, viewportHeight]);

  const drawGrid = useCallback((g: any) => {
    g.clear();
    
    // Don't render grid if zoomed out too far
    if (zoomLevel < 0.3) return;
    
    const { startX, endX, startY, endY, gridSize, majorGridSize } = gridRange;
      // Grid colors based on zoom level - much more subtle
    const minorOpacity = Math.min(0.08, zoomLevel * 0.1);
    const majorOpacity = Math.min(0.15, zoomLevel * 0.2);
    
    // Minor grid lines - very subtle
    if (zoomLevel > 0.8) {
      g.setStrokeStyle({
        width: 0.5,
        color: 0xf0f0f0,
        alpha: minorOpacity
      });
      
      // Vertical lines
      for (let x = startX; x <= endX; x += gridSize) {
        if (x % majorGridSize !== 0) { // Skip major grid lines
          g.moveTo(x, startY);
          g.lineTo(x, endY);
        }
      }
      
      // Horizontal lines
      for (let y = startY; y <= endY; y += gridSize) {
        if (y % majorGridSize !== 0) { // Skip major grid lines
          g.moveTo(startX, y);
          g.lineTo(endX, y);
        }
      }
      
      g.stroke();
    }
      // Major grid lines - subtle but visible
    g.setStrokeStyle({
      width: 1,
      color: 0xe8e8e8,
      alpha: majorOpacity
    });
    
    // Major vertical lines
    for (let x = startX; x <= endX; x += majorGridSize) {
      g.moveTo(x, startY);
      g.lineTo(x, endY);
    }
    
    // Major horizontal lines
    for (let y = startY; y <= endY; y += majorGridSize) {
      g.moveTo(startX, y);
      g.lineTo(endX, y);
    }
    
    g.stroke();
      // Origin lines (if visible) - subtle accent
    const originVisible = startX <= 0 && endX >= 0 && startY <= 0 && endY >= 0;
    if (originVisible && zoomLevel > 0.5) {
      g.setStrokeStyle({
        width: 1.5,
        color: 0xd0d0d0,
        alpha: Math.min(0.4, majorOpacity * 1.5)
      });
      
      // X-axis
      g.moveTo(startX, 0);
      g.lineTo(endX, 0);
      
      // Y-axis
      g.moveTo(0, startY);
      g.lineTo(0, endY);
      
      g.stroke();
    }
  }, [gridRange, zoomLevel]);

  return <Graphics draw={drawGrid} />;
};

export default InfiniteCanvasGrid;
