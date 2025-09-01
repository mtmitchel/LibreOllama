import React from 'react';
import { Group, Line } from 'react-konva';
import { calculateSnapLines } from '../../utils/snappingUtils';
import { CanvasElement } from '../../types/enhanced.types';

interface SnapLinesProps {
  draggedElement: CanvasElement | null;
  elements: CanvasElement[];
  visible?: boolean;
}

export const SnapLines: React.FC<SnapLinesProps> = ({ 
  draggedElement, 
  elements, 
  visible = true 
}) => {
  if (!draggedElement || !visible) {
    return null;
  }

  const snapLines = calculateSnapLines(draggedElement, elements);

  return (
    <Group listening={false}>
      {snapLines.map((snapLine, index) => (
        <Line
          key={`${snapLine.elementId}-${snapLine.type}-${index}`}
          points={snapLine.points}
          stroke="#3B82F6"
          strokeWidth={1}
          dash={[5, 5]}
          opacity={0.8}
          listening={false}
        />
      ))}
    </Group>
  );
};
// Archived (2025-09-01): Legacy snap lines (react-konva).
