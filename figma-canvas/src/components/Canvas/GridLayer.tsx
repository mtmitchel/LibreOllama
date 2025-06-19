import React, { useMemo } from 'react';
import { Group, Line } from 'react-konva';

interface GridLayerProps {
  gridSize: number;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export const GridLayer: React.FC<GridLayerProps> = ({
  gridSize,
  viewport,
  strokeColor = '#e0e0e0',
  strokeWidth = 1,
  opacity = 0.5
}) => {
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    
    // Calculate grid bounds with some padding
    const padding = gridSize * 2;
    const startX = Math.floor((viewport.x - padding) / gridSize) * gridSize;
    const endX = Math.ceil((viewport.x + viewport.width + padding) / gridSize) * gridSize;
    const startY = Math.floor((viewport.y - padding) / gridSize) * gridSize;
    const endY = Math.ceil((viewport.y + viewport.height + padding) / gridSize) * gridSize;
    
    let lineIndex = 0;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      lines.push(
        <Line
          key={`v-${lineIndex++}`}
          points={[x, startY, x, endY]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      lines.push(
        <Line
          key={`h-${lineIndex++}`}
          points={[startX, y, endX, y]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    
    return lines;
  }, [gridSize, viewport, strokeColor, strokeWidth, opacity]);

  return <Group>{gridLines}</Group>;
};

// Dot grid variant
export const DotGridLayer: React.FC<GridLayerProps> = ({
  gridSize,
  viewport,
  strokeColor = '#e0e0e0',
  opacity = 0.5
}) => {
  const gridDots = useMemo(() => {
    const dots: JSX.Element[] = [];
    
    // Calculate grid bounds with some padding
    const padding = gridSize * 2;
    const startX = Math.floor((viewport.x - padding) / gridSize) * gridSize;
    const endX = Math.ceil((viewport.x + viewport.width + padding) / gridSize) * gridSize;
    const startY = Math.floor((viewport.y - padding) / gridSize) * gridSize;
    const endY = Math.ceil((viewport.y + viewport.height + padding) / gridSize) * gridSize;
    
    let dotIndex = 0;
    
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        dots.push(
          <circle
            key={`dot-${dotIndex++}`}
            cx={x}
            cy={y}
            r={1}
            fill={strokeColor}
            opacity={opacity}
          />
        );
      }
    }
    
    return dots;
  }, [gridSize, viewport, strokeColor, opacity]);

  return <Group>{gridDots}</Group>;
};

// Adaptive grid that changes based on zoom level
export const AdaptiveGridLayer: React.FC<GridLayerProps & {
  zoom: number;
  baseGridSize?: number;
}> = ({
  gridSize,
  viewport,
  zoom,
  strokeColor = '#e0e0e0',
  strokeWidth = 1,
  opacity = 0.5,
  baseGridSize = 20
}) => {
  const adaptiveGridSize = useMemo(() => {
    // Adjust grid size based on zoom level
    let adaptedSize = baseGridSize;
    
    if (zoom < 0.25) {
      adaptedSize = baseGridSize * 8;
    } else if (zoom < 0.5) {
      adaptedSize = baseGridSize * 4;
    } else if (zoom < 0.75) {
      adaptedSize = baseGridSize * 2;
    } else if (zoom > 2) {
      adaptedSize = baseGridSize / 2;
    } else if (zoom > 4) {
      adaptedSize = baseGridSize / 4;
    }
    
    return Math.max(adaptedSize, 5); // Minimum grid size
  }, [zoom, baseGridSize]);

  const adaptiveOpacity = useMemo(() => {
    // Fade out grid at extreme zoom levels
    if (zoom < 0.1 || zoom > 8) {
      return 0.1;
    } else if (zoom < 0.25 || zoom > 4) {
      return 0.3;
    }
    return opacity;
  }, [zoom, opacity]);

  return (
    <GridLayer
      gridSize={adaptiveGridSize}
      viewport={viewport}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      opacity={adaptiveOpacity}
    />
  );
};

// Isometric grid
export const IsometricGridLayer: React.FC<GridLayerProps> = ({
  gridSize,
  viewport,
  strokeColor = '#e0e0e0',
  strokeWidth = 1,
  opacity = 0.5
}) => {
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    
    const padding = gridSize * 2;
    const startX = Math.floor((viewport.x - padding) / gridSize) * gridSize;
    const endX = Math.ceil((viewport.x + viewport.width + padding) / gridSize) * gridSize;
    const startY = Math.floor((viewport.y - padding) / gridSize) * gridSize;
    const endY = Math.ceil((viewport.y + viewport.height + padding) / gridSize) * gridSize;
    
    let lineIndex = 0;
    
    // Diagonal lines (30 degrees)
    const angle1 = Math.PI / 6; // 30 degrees
    const angle2 = -Math.PI / 6; // -30 degrees
    
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        // Draw lines at isometric angles
        const lineLength = gridSize * 2;
        
        // Line at 30 degrees
        const x1 = x + Math.cos(angle1) * lineLength;
        const y1 = y + Math.sin(angle1) * lineLength;
        
        lines.push(
          <Line
            key={`iso1-${lineIndex++}`}
            points={[x, y, x1, y1]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
        
        // Line at -30 degrees
        const x2 = x + Math.cos(angle2) * lineLength;
        const y2 = y + Math.sin(angle2) * lineLength;
        
        lines.push(
          <Line
            key={`iso2-${lineIndex++}`}
            points={[x, y, x2, y2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      }
    }
    
    return lines;
  }, [gridSize, viewport, strokeColor, strokeWidth, opacity]);

  return <Group>{gridLines}</Group>;
};

export default GridLayer;
