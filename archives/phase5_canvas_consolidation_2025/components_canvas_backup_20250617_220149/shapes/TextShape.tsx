// src/components/canvas/shapes/TextShape.tsx
import React from 'react';
import { Text } from 'react-konva';
import { CanvasElement } from '../layers/types';
import { designSystem } from '../../styles/designSystem';

interface TextShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  konvaProps: any;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

/**
 * TextShape - Optimized text component
 * - Performance-optimized with React.memo
 * - Handles text-specific logic
 */
export const TextShape: React.FC<TextShapeProps> = React.memo(({
  element,
  isSelected,
  konvaProps,
  onUpdate
}) => {
  return (
    <Text
      {...konvaProps}
      text={element.text || 'Double-click to edit'}
      fontSize={element.fontSize || 24}
      fontFamily={element.fontFamily || designSystem.typography.fontFamily.sans}
      fill={element.fill || designSystem.colors.secondary[900]}
      width={element.width || 250}
    />
  );
});

TextShape.displayName = 'TextShape';
