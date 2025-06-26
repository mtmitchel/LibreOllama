import React from 'react';
import { Group, Circle } from 'react-konva';

interface SnapPointIndicatorProps {
  hoveredSnapPoint?: { x: number; y: number; elementId?: string; anchor?: string } | null;
}

export const SnapPointIndicator: React.FC<SnapPointIndicatorProps> = ({ hoveredSnapPoint }) => {
  if (!hoveredSnapPoint) {
    return null;
  }

  return (
    <Group
      x={hoveredSnapPoint.x}
      y={hoveredSnapPoint.y}
      listening={false}
    >
      <Circle
        radius={12}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="rgba(59, 130, 246, 0.4)"
        strokeWidth={2}
      />
      <Circle
        radius={6}
        fill="#3B82F6"
        stroke="#FFFFFF"
        strokeWidth={2}
      />
    </Group>
  );
};
