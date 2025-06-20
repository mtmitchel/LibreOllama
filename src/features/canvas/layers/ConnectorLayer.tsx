// src/features/canvas/layers/ConnectorLayer.tsx
import React from 'react';
import { Group, Line, Arrow, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../stores/types';
import ConnectorRenderer from '../components/ConnectorRenderer';

interface ConnectorLayerProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void;
  isDrawingConnector?: boolean;
  connectorStart?: { x: number; y: number; elementId?: string; anchor?: string } | null;
  connectorEnd?: { x: number; y: number; elementId?: string; anchor?: string } | null;
  selectedTool: string;
}

/**
 * ConnectorLayer - Renders line connectors and relationships between elements
 * - Arrow connections between elements
 * - Dynamic connector rendering
 * - Separate layer for performance isolation
 */
export const ConnectorLayer: React.FC<ConnectorLayerProps> = ({
  elements,
  selectedElementIds,
  onElementClick,
  onElementUpdate,
  isDrawingConnector = false,
  connectorStart,
  connectorEnd,
  selectedTool
}) => {
  // Filter only connector elements
  const connectorElements = React.useMemo(() => 
    elements.filter(el => el.type === 'connector'),
    [elements]
  );
  return (
    <Group listening={true} name="connector-group">
      {/* Render existing connectors */}
      {connectorElements.map(element => {
        const isSelected = selectedElementIds.includes(element.id);
        
        return (
          <ConnectorRenderer
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => onElementClick({} as any, element)}
            onUpdate={onElementUpdate || (() => {})}
            elements={elements.reduce((acc, el) => ({ ...acc, [el.id]: el }), {})}
            sections={{}} // Sections would be passed here if needed
          />
        );
      })}
      
      {/* Connector preview during drawing */}
      {isDrawingConnector && connectorStart && connectorEnd && (
        <>
          {/* Preview connector line/arrow */}
          {selectedTool === 'connector-arrow' ? (
            <Arrow
              points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]}
              stroke="#3B82F6"
              strokeWidth={2}
              fill="#3B82F6"
              pointerLength={10}
              pointerWidth={10}
              opacity={0.7}
              dash={[5, 5]}
              listening={false}
            />
          ) : (
            <Line
              points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]}
              stroke="#3B82F6"
              strokeWidth={2}
              opacity={0.7}
              dash={[5, 5]}                listening={false}
            />
          )}
          {/* Snap indicators */}
          {connectorStart.elementId && (
            <Circle
              x={connectorStart.x}
              y={connectorStart.y}
              radius={4}
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth={2}
              opacity={0.8}
              listening={false}
            />
          )}
          {connectorEnd.elementId && (
            <Circle
              x={connectorEnd.x}
              y={connectorEnd.y}
              radius={4}
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth={2}
              opacity={0.8}
              listening={false}
            />
          )}
        </>
      )}
    </Group>
  );
};
