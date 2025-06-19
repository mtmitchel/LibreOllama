import React from 'react';
import { Rect } from 'react-konva';

interface SelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  dash?: number[];
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  x,
  y,
  width,
  height,
  stroke = '#0066ff',
  strokeWidth = 1,
  fill = 'rgba(0, 102, 255, 0.1)',
  dash = [5, 5]
}) => {
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      dash={dash}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
};

export default SelectionBox;
