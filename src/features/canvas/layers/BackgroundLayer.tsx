// src/features/canvas/layers/BackgroundLayer.tsx
import React from 'react';
import { Group } from 'react-konva';
import { CanvasElement } from '../stores/types';

interface BackgroundLayerProps {
  width: number;
  height: number;
  elements: CanvasElement[];
}

/**
 * BackgroundLayer - Renders static background elements as a Group
 * - Grid patterns, watermarks, background images
 * - Non-interactive elements (listening={false} for performance)
 * - Rendered as Group to avoid nested layers
 */
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  width: _width,
  height: _height,
  elements: _elements
}) => {  return (
    <Group listening={false} name="background-group">
      {/* Grid or background pattern could be rendered here */}
      {/* For now, no background elements */}
      
      {/* Future implementation could include:
          - Grid pattern
          - Background images/watermarks
          - Canvas rulers/guides
      */}
    </Group>
  );
};
