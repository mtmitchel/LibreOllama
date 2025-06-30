// src/features/canvas/layers/ConnectorLayer.tsx
import React, { useMemo, useEffect, memo } from 'react';
import { Group, Line, Arrow, Circle, Path } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId, ConnectorElement, isConnectorElement } from '../types/enhanced.types';
import { getElementSnapPoints, calculateConnectorPath } from '../utils/connectorUtils';
import type { AttachmentPoint } from '../types/connectorTypes';

// --- Internal Connector Rendering Component ---
interface RenderedConnectorProps {
  element: ConnectorElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (elementId: ElementId, updates: Partial<CanvasElement>) => void;
  elements: Map<string, CanvasElement>;
  sections?: Map<string, any>;
}

const RenderedConnector = memo(React.forwardRef<Konva.Line | Konva.Arrow, RenderedConnectorProps>(
  ({ element, isSelected, onSelect, onUpdate, elements, sections = new Map() }, ref) => {
    const getAbsoluteElementPosition = (targetElement: CanvasElement) => {
      let elementX = targetElement.x;
      let elementY = targetElement.y;
      if (targetElement.sectionId) {
        const section = sections.get(targetElement.sectionId);
        if (section) {
          elementX = section.x + targetElement.x;
          elementY = section.y + targetElement.y;
        }
      }
      return { x: elementX, y: elementY };
    };

    const { updatedStartPoint, updatedEndPoint, pathPoints, isValid } = useMemo(() => {
      const getUpdatedEndpoint = (point: { x: number; y: number; attachmentPoint?: any }, elementId?: ElementId | SectionId) => {
        if (!elementId) return { endpoint: point, isConnected: false, isValid: true };
        const connectedElement = elements.get(elementId as ElementId);
        if (!connectedElement) return { endpoint: point, isConnected: false, isValid: false };
        
        const absPos = getAbsoluteElementPosition(connectedElement);
        const absoluteElement = { ...connectedElement, x: absPos.x, y: absPos.y };
        const snapPoints = getElementSnapPoints(absoluteElement);
        
        if (point.attachmentPoint) {
          const attachedPoint = snapPoints.find(sp => sp.attachmentPoint === point.attachmentPoint);
          if (attachedPoint) return { endpoint: { x: attachedPoint.x, y: attachedPoint.y }, isConnected: true, isValid: true };
        }
        return { endpoint: point, isConnected: true, isValid: true };
      };

      if (!element.startPoint || !element.endPoint) return { updatedStartPoint: { x: 0, y: 0 }, updatedEndPoint: { x: 0, y: 0 }, pathPoints: [0, 0, 0, 0], isValid: false };

      const startResult = getUpdatedEndpoint(element.startPoint, element.startElementId);
      const endResult = getUpdatedEndpoint(element.endPoint, element.endElementId);
      
      const routingType = element.subType === 'curved' ? 'curved' : element.subType === 'bent' ? 'orthogonal' : 'straight';
      
      const calculatedPath = calculateConnectorPath(
        startResult.endpoint,
        endResult.endpoint,
        routingType,
        ('anchorPoint' in element.startPoint ? element.startPoint.anchorPoint : undefined) as AttachmentPoint | undefined,
        ('anchorPoint' in element.endPoint ? element.endPoint.anchorPoint : undefined) as AttachmentPoint | undefined
      );
      
      return { updatedStartPoint: startResult.endpoint, updatedEndPoint: endResult.endpoint, pathPoints: calculatedPath, isValid: startResult.isValid && endResult.isValid };
    }, [element, elements, sections]);

    useEffect(() => {
      if (!isValid && onUpdate) {
        console.warn('🔗 [CONNECTOR] Cleaning up invalid connection:', element.id);
      }
    }, [isValid, element.id, onUpdate]);
    
    const commonProps = {
      points: pathPoints,
      stroke: element.stroke || '#6366F1',
      strokeWidth: element.strokeWidth || 2,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
      ...(element.connectorStyle?.strokeDashArray && { dash: element.connectorStyle.strokeDashArray }),
      onClick: onSelect,
      onTap: onSelect,
      listening: true,
      ...(isSelected && { shadowColor: '#3B82F6', shadowBlur: 8, shadowOpacity: 0.6 }),
    };

    const isArrowType = element.subType === 'arrow';
    const isCurvedType = element.subType === 'curved';
    
    if (isCurvedType && pathPoints.length === 6) {
      const pathData = `M ${pathPoints[0]} ${pathPoints[1]} Q ${pathPoints[2]} ${pathPoints[3]} ${pathPoints[4]} ${pathPoints[5]}`;
      return <Path ref={ref as any} data={pathData} stroke={element.stroke || '#6366F1'} strokeWidth={element.strokeWidth || 2} fill="none" onClick={onSelect} onTap={onSelect} listening={true} {...(isSelected && { shadowColor: '#3B82F6', shadowBlur: 8, shadowOpacity: 0.6 })} />;
    }
    
    if (isArrowType) {
      return <Arrow ref={ref as React.RefObject<Konva.Arrow>} {...commonProps} fill={element.stroke || '#6366F1'} pointerLength={10} pointerWidth={10} />;
    }
    
    return <Line ref={ref as React.RefObject<Konva.Line>} {...commonProps} />;
  }
));
RenderedConnector.displayName = 'RenderedConnector';

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
    elements.forEach((element) => {
      if (isConnectorElement(element)) connectors.push(element);
    });
    return connectors;
  }, [elements]);

  return (
    <Group listening={true} name="connector-group">
      {connectorElements.map(element => (
        <RenderedConnector
          key={element.id}
          element={element}
          isSelected={selectedElementIds.has(element.id)}
          onSelect={() => onElementClick({} as any, element)}
          onUpdate={onElementUpdate}
          elements={elements}
          sections={new Map()} // Pass sections if available
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
