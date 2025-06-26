import React from 'react';
import { Rect } from 'react-konva';

interface SelectionBoxProps {
  selectionBox?: { x: number; y: number; width: number; height: number; visible: boolean; };
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ selectionBox }) => {
  if (!selectionBox?.visible) {
    return null;
  }

  return (
    <Rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      fill="rgba(0, 161, 255, 0.2)"
      stroke="rgba(0, 161, 255, 0.8)"
      strokeWidth={1}
      listening={false}
    />
  );
};
