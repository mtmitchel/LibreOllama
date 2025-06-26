import React from 'react';
import { Line } from 'react-konva';
import { PenElement } from '../types/enhanced.types';
import Konva from 'konva';

interface PenShapeProps {
  element: PenElement;
  konvaProps: Partial<Konva.NodeConfig>;
}

export const PenShape: React.FC<PenShapeProps> = ({ element, konvaProps }) => {
  return (
    <Line
      {...konvaProps}
      points={element.points}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation={
        element.stroke === 'erase' ? 'destination-out' : 'source-over'
      }
    />
  );
};