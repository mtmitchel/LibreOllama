import React from 'react';
import { Line } from 'react-konva';
import { PenElement } from '../types/enhanced.types';
import Konva from 'konva';

interface PenShapeProps {
  element: PenElement;
  konvaProps: Partial<Konva.NodeConfig>;
}

export const PenShape: React.FC<PenShapeProps> = ({ element, konvaProps }) => {
  // Ensure we have valid points and stroke properties
  const points = element.points || [];
  const stroke = element.stroke || '#000000'; // Default to black if not set
  const strokeWidth = element.strokeWidth || 2; // Default to 2px if not set
  
  // Don't render if we don't have enough points
  if (points.length < 4) {
    return null;
  }
  
  return (
    <Line
      {...konvaProps}
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      tension={0}  // No tension for accurate path rendering
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation={
        stroke === 'erase' ? 'destination-out' : 'source-over'
      }
      perfectDrawEnabled={false}  // Performance optimization
    />
  );
};