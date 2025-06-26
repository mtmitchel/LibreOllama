
import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { SectionElement } from '../types/enhanced.types';
import Konva from 'konva';

interface SectionShapeProps {
  element: SectionElement;
  konvaProps: Partial<Konva.NodeConfig>;
  children: React.ReactNode;
}

export const SectionShape: React.FC<SectionShapeProps> = ({ element, konvaProps, children }) => {
  return (
    <Group {...konvaProps}>
      <Rect
        width={element.width}
        height={element.height}
        fill={element.backgroundColor}
        stroke={element.borderColor}
        strokeWidth={element.borderWidth}
        cornerRadius={element.cornerRadius}
      />
      <Text
        text={element.title}
        fontSize={14}
        fontFamily="Arial"
        fill="#333"
        width={element.width}
        padding={10}
        align="center"
      />
      {children}
    </Group>
  );
};
