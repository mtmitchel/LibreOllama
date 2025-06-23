// src/features/canvas/layers/ConnectorLayer.tsx
import React from 'react';
import { Group, Line, Arrow, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, ConnectorElement, isConnectorElement } from '../types/enhanced.types';
import ConnectorRenderer from '../components/ConnectorRenderer';

interface ConnectorLayerProps {
  elements: Map<ElementId, CanvasElement>;
  selectedElementIds: Set<ElementId>;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  isDrawingConnector?: boolean;
  connectorStart?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
  connectorEnd?: { x: number; y: number; elementId?: ElementId; anchor?: string } | null;
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
  // Filter only connector elements from the Map
  const connectorElements = React.useMemo(() => {
    const connectors: ConnectorElement[] = [];
    elements.forEach((element) => {
      if (isConnectorElement(element)) {
        connectors.push(element);
      }
    });
    return connectors;
  }, [elements]);

  return (
    <Group listening={true} name="connector-group">
      {/* Render existing connectors */}
      {connectorElements.map(element => {
        const isSelected = selectedElementIds.has(element.id);
        
        return (
          <ConnectorRenderer
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => onElementClick({} as any, element)}
            onUpdate={onElementUpdate || (() => {})}
            elements={elements} // Pass the Map directly
            sections={new Map()} // Sections would be passed here if needed
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
