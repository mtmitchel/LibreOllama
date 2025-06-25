// src/features/canvas/shapes/SectionShape.tsx
import React from 'react';
import { Rect } from 'react-konva';
import { SectionElement } from '../types/section';
import { designSystem } from '../../../design-system';

interface SectionShapeProps {
  element: SectionElement;
  konvaProps: any;
}

export const SectionShape: React.FC<SectionShapeProps> = React.memo(({
  element,
  konvaProps,
}) => {
  return (
    <Rect
      {...konvaProps}
      id={element.id}
      width={element.width}
      height={element.height}
      fill={element.backgroundColor || 'rgba(59, 130, 246, 0.1)'}
      stroke={element.borderColor || '#3B82F6'}
      strokeWidth={element.borderWidth || 2}
      cornerRadius={element.cornerRadius || 8}
      listening={true}
    />
  );
});

SectionShape.displayName = 'SectionShape';