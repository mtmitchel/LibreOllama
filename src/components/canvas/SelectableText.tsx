// src/components/canvas/SelectableText.tsx
import React from 'react';
import { Text } from 'react-konva';

const SelectableText = ({ element, ...props }) => {
  return (
    <Text
      x={element.x}
      y={element.y}
      text={element.text || 'Default text'}
      fontSize={element.fontSize || 16}
      fill={element.fill || '#000'}
      {...props}
    />
  );
};

export default SelectableText;
