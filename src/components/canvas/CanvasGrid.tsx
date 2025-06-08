import React from 'react';

interface CanvasGridProps {
  zoomLevel?: number;
  panOffset?: { x: number; y: number };
}

const CanvasGrid: React.FC<CanvasGridProps> = ({ 
  zoomLevel = 1, 
  panOffset = { x: 0, y: 0 } 
}) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundSize: `${20 * zoomLevel}px ${20 * zoomLevel}px`,
        backgroundImage: 'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    />
  );
};

export default CanvasGrid;