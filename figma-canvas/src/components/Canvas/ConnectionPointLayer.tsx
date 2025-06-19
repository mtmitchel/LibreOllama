import React from 'react';
import { Layer } from 'react-konva';
import { CanvasElement } from '../../types/canvas';
import { ConnectionPoints } from './ConnectionPoints';

interface ConnectionPointLayerProps {
  elements: CanvasElement[];
  selectedIds: string[];
  hoveredIds: string[];
  visible: boolean;
}

export const ConnectionPointLayer: React.FC<ConnectionPointLayerProps> = ({
  elements,
  selectedIds,
  hoveredIds,
  visible
}) => {
  if (!visible) return null;

  return (
    <Layer name="connection-points">
      {elements
        .filter(element => 
          selectedIds.includes(element.id) || 
          hoveredIds.includes(element.id)
        )
        .map(element => (
          <ConnectionPoints
            key={`connection-${element.id}`}
            element={element}
            visible={true}
          />
        ))}
    </Layer>
  );
};

export default ConnectionPointLayer;
