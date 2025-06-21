import React from 'react';
import { Group, Rect } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../types/enhanced.types';

interface BackgroundLayerProps {
  width: number;
  height: number;
  elements?: CanvasElement[];
  onBackgroundClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * BackgroundLayer - Renders static background elements as a Group
 * - Grid patterns, watermarks, background images
 * - Non-interactive elements (listening={false} for performance)
 * - Rendered as Group to avoid nested layers
 * - Includes invisible background rect for deselection
 */
export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  elements: _elements,
  onBackgroundClick
}) => {  return (
    <Group name="background-group">
      {/* Invisible background rect for deselection */}
      {onBackgroundClick && (
        <Rect
          x={-10000}
          y={-10000}
          width={20000}
          height={20000}
          fill="transparent"
          name="background-rect"
          onClick={onBackgroundClick}
          listening={true}
        />
      )}
      
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
