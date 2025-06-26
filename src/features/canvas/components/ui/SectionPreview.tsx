import React from 'react';
import { Rect } from 'react-konva';

interface SectionPreviewProps {
  isDrawingSection?: boolean;
  previewSection?: { x: number; y: number; width: number; height: number } | null;
}

export const SectionPreview: React.FC<SectionPreviewProps> = ({ isDrawingSection, previewSection }) => {
  if (!isDrawingSection || !previewSection) {
    return null;
  }

  return (
    <Rect
      x={previewSection.x}
      y={previewSection.y}
      width={previewSection.width}
      height={previewSection.height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3B82F6"
      strokeWidth={2}
      dash={[5, 5]}
      opacity={0.7}
      listening={false}
    />
  );
};
