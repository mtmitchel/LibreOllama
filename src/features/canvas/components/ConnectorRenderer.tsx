import React, { useMemo, useEffect, memo } from 'react';
import { Line, Arrow, Path } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId, ConnectorElement } from '../types/enhanced.types';
import { getElementSnapPoints, calculateConnectorPath } from '../utils/connectorUtils';
import type { AttachmentPoint } from '../types/connector';

interface ConnectorRendererProps {
  element: ConnectorElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (elementId: ElementId, updates: Partial<CanvasElement>) => void;
  elements: Map<ElementId | SectionId, CanvasElement>; // All elements for connection updates
  sections?: Map<SectionId, any>; // Sections for coordinate conversion
}

export const ConnectorRenderer = memo(React.forwardRef<Konva.Line | Konva.Arrow, ConnectorRendererProps>(
  ({ element, isSelected, onSelect, onUpdate, elements, sections = new Map() }, ref) => {
    // Only render if this is a connector element
    if (element.type !== 'connector' || !element.startPoint || !element.endPoint) {
      return null;
    }

    // Helper function to get element position with section support
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

    // Memoize endpoint calculations for performance
    const { updatedStartPoint, updatedEndPoint, pathPoints, isValid } = useMemo(() => {
      // Update connector path if connected to elements
      const getUpdatedEndpoint = (point: { x: number; y: number; attachmentPoint?: any }, elementId?: ElementId | SectionId) => {
        if (!elementId) {
          return { 
            endpoint: point, 
            isConnected: false,
            isValid: true 
          };
        }
        
        const connectedElement = elements.get(elementId as ElementId);
        if (!connectedElement) {
          // Element was deleted - mark as invalid for cleanup
          return { 
            endpoint: point,
            isConnected: false,
            isValid: false 
          };
        }
        
        // Get absolute position for the element
        const absPos = getAbsoluteElementPosition(connectedElement);
        const absoluteElement = { ...connectedElement, x: absPos.x, y: absPos.y };
        
        // Get snap points for the element
        const snapPoints = getElementSnapPoints(absoluteElement);
        
        // Find the specific attachment point or use the stored position
        if (point.attachmentPoint) {
          const attachedPoint = snapPoints.find(sp => sp.attachmentPoint === point.attachmentPoint);
          if (attachedPoint) {
            return {
              endpoint: { x: attachedPoint.x, y: attachedPoint.y },
              isConnected: true,
              isValid: true
            };
          }
        }
        
        // Fallback to stored position
        return {
          endpoint: point,
          isConnected: true,
          isValid: true
        };
      };

      if (!element.startPoint || !element.endPoint) {
        return {
          updatedStartPoint: { x: 0, y: 0 },
          updatedEndPoint: { x: 0, y: 0 },
          pathPoints: [0, 0, 0, 0],
          isValid: false
        };
      }

      const startResult = getUpdatedEndpoint(element.startPoint, element.startElementId);
      const endResult = getUpdatedEndpoint(element.endPoint, element.endElementId);
      
      // Calculate the path based on connector type
      const routingType = element.subType === 'curved' ? 'curved' : 
                         element.subType === 'bent' ? 'orthogonal' : 'straight';
      
      const calculatedPath = calculateConnectorPath(
        startResult.endpoint,
        endResult.endpoint,
        routingType,
        ('anchorPoint' in element.startPoint ? element.startPoint.anchorPoint : undefined) as AttachmentPoint | undefined,
        ('anchorPoint' in element.endPoint ? element.endPoint.anchorPoint : undefined) as AttachmentPoint | undefined
      );
      
      return {
        updatedStartPoint: startResult.endpoint,
        updatedEndPoint: endResult.endpoint,
        pathPoints: calculatedPath,
        isValid: startResult.isValid && endResult.isValid
      };
    }, [element, elements, sections, getAbsoluteElementPosition]);

    // Handle cleanup of invalid connections
    useEffect(() => {
      if (!isValid && onUpdate) {
        console.warn('🔗 [CONNECTOR] Cleaning up invalid connection:', element.id);
        // Optionally clean up or mark for deletion
        // For now, we'll just log the issue
      }
    }, [isValid, element.id, onUpdate]);
    
    const commonProps = {
      points: pathPoints,
      stroke: element.stroke || '#6366F1',
      strokeWidth: element.strokeWidth || 2,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
      // Add dash pattern if specified
      ...(element.connectorStyle?.strokeDashArray && {
        dash: element.connectorStyle.strokeDashArray
      }),
      onClick: onSelect,
      onTap: onSelect,
      listening: true,
      // Visual feedback for selection
      ...(isSelected && {
        shadowColor: '#3B82F6',
        shadowBlur: 8,
        shadowOpacity: 0.6,
      }),
    };

    // Render based on connector type
    const isArrowType = element.subType === 'arrow';
    const isCurvedType = element.subType === 'curved';
    
    // For curved connectors, use Path instead of Line/Arrow
    if (isCurvedType && pathPoints.length === 6) {
      const pathData = `M ${pathPoints[0]} ${pathPoints[1]} Q ${pathPoints[2]} ${pathPoints[3]} ${pathPoints[4]} ${pathPoints[5]}`;
      return (
        <Path
          ref={ref as any}
          data={pathData}
          stroke={element.stroke || '#6366F1'}
          strokeWidth={element.strokeWidth || 2}
          fill="none"
          onClick={onSelect}
          onTap={onSelect}
          listening={true}
          {...(isSelected && {
            shadowColor: '#3B82F6',
            shadowBlur: 8,
            shadowOpacity: 0.6,
          })}
        />
      );
    }
    
    // For arrow connectors
    if (isArrowType) {
      return (
        <Arrow
          ref={ref as React.RefObject<Konva.Arrow>}
          {...commonProps}
          fill={element.stroke || '#6366F1'}
          pointerLength={10}
          pointerWidth={10}
        />
      );
    }
    
    // Default to line
    return <Line ref={ref as React.RefObject<Konva.Line>} {...commonProps} />;
  }
));

ConnectorRenderer.displayName = 'ConnectorRenderer';

export default ConnectorRenderer;