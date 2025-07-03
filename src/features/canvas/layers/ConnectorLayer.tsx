// src/features/canvas/layers/ConnectorLayer.tsx
import React, { useMemo, memo } from 'react';
import { Group, Line, Arrow, Circle } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId, ConnectorElement, isConnectorElement } from '../types/enhanced.types';
import { ConnectorShape } from '../components/ConnectorShape';

// --- Main ConnectorLayer Component ---
interface ConnectorLayerProps {
  elements: Map<ElementId, CanvasElement>;
  selectedElementIds: Set<ElementId>;
  onElementClick: (e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => void;
  onElementUpdate?: (id: ElementId, updates: Partial<CanvasElement>) => void;
  isDrawingConnector?: boolean;
  connectorStart?: { x: number; y: number; elementId?: ElementId | SectionId; anchor?: string } | null;
  connectorEnd?: { x: number; y: number; elementId?: ElementId | SectionId; anchor?: string } | null;
  selectedTool: string;
}

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
  const connectorElements = React.useMemo(() => {
    const connectors: ConnectorElement[] = [];
    elements.forEach((element, id) => {
      if (isConnectorElement(element)) {
        connectors.push(element);
      }
    });
    return connectors;
  }, [elements]);
  
  return (
    <Group listening={true} name="connector-group">
      {connectorElements.map(element => (
        <ConnectorShape
          key={element.id}
          connector={element}
          isSelected={selectedElementIds.has(element.id)}
          onSelect={(e) => onElementClick(e, element)}
          onUpdate={onElementUpdate ? (updates) => onElementUpdate(element.id, updates) : undefined}
        />
      ))}
      
      {isDrawingConnector && connectorStart && connectorEnd && (
        <>
          {selectedTool === 'connector-arrow' ? (
            <Arrow points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]} stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" pointerLength={10} pointerWidth={10} opacity={0.7} dash={[5, 5]} listening={false} />
          ) : (
            <Line points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]} stroke="#3B82F6" strokeWidth={2} opacity={0.7} dash={[5, 5]} listening={false} />
          )}
          {connectorStart.elementId && <Circle x={connectorStart.x} y={connectorStart.y} radius={4} fill="#3B82F6" stroke="#1E40AF" strokeWidth={2} opacity={0.8} listening={false} />}
          {connectorEnd.elementId && <Circle x={connectorEnd.x} y={connectorEnd.y} radius={4} fill="#3B82F6" stroke="#1E40AF" strokeWidth={2} opacity={0.8} listening={false} />}
        </>
      )}
    </Group>
  );
};
