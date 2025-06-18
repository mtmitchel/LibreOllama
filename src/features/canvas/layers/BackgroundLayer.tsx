// src/features/canvas/layers/BackgroundLayer.tsx
import React from 'react';
import { Layer, Group } from 'react-konva';
import { CanvasElement } from '../stores/types';

interface BackgroundLayerProps {
  width: number;
  height: number;
  elements: CanvasElement[];
}

/**
 * BackgroundLayer - Renders static background elements
 * - Grid patterns, watermarks, background images
 * - Non-interactive elements (listening={false} for performance)
 * - Separate layer for performance isolation
 */
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  width: _width,
  height: _height,
  elements: _elements
}) => {  return (
    <Layer listening={false} name="background-layer">
      <Group>
        {/* Grid or background pattern could be rendered here */}
        {/* For now, no background elements */}
        
        {/* Future implementation could include:
            - Grid pattern
            - Background images/watermarks
            - Canvas rulers/guides
        */}
      </Group>
    </Layer>
  );
};
