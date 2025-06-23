import React, { useMemo, useEffect } from 'react';
import { Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { CanvasElement, ElementId, SectionId, ConnectorElement } from '../types/enhanced.types';
import { getAnchorPoint } from '../types/connector';

interface ConnectorRendererProps {
  element: ConnectorElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (elementId: ElementId, updates: Partial<CanvasElement>) => void;
  elements: Map<ElementId | SectionId, CanvasElement>; // All elements for connection updates
  sections?: Map<SectionId, any>; // Sections for coordinate conversion
}

export const ConnectorRenderer = React.forwardRef<Konva.Line | Konva.Arrow, ConnectorRendererProps>(
  ({ element, isSelected, onSelect, onUpdate, elements, sections = new Map() }, ref) => {
    // Only render if this is a connector element
    if (element.type !== 'connector' || !element.startPoint || !element.endPoint || !element.connectorStyle) {
      return null;
    }

    // Helper function to get anchor point with section support
    const getElementAnchorPoint = (targetElement: CanvasElement, anchor: string) => {
      // Get element coordinates - convert to absolute if in a section
      let elementX = targetElement.x;
      let elementY = targetElement.y;
      
      if (targetElement.sectionId) {
        const section = sections.get(targetElement.sectionId);
        if (section) {
          elementX = section.x + targetElement.x;
          elementY = section.y + targetElement.y;
        }
      }
      
      // Use the imported getAnchorPoint utility with proper element format
      return getAnchorPoint(
        { 
          x: elementX, 
          y: elementY, 
          width: 'width' in targetElement ? targetElement.width || 0 : 0, 
          height: 'height' in targetElement ? targetElement.height || 0 : 0, 
          radius: 'radius' in targetElement ? targetElement.radius || 0 : 0 
        },
        anchor as any
      );
    };

    // Memoize endpoint calculations for performance
    const { updatedStartPoint, updatedEndPoint, isValid } = useMemo(() => {
      // Update connector path if connected to elements
      const getUpdatedEndpoint = (point: { x: number; y: number }, elementId?: ElementId) => {
        if (!elementId) {
          return { 
            endpoint: point, 
            isConnected: false,
            isValid: true 
          };
        }
        
        const connectedElement = elements.get(elementId);
        if (!connectedElement) {
          // Element was deleted - mark as invalid for cleanup
          return { 
            endpoint: point,
            isConnected: false,
            isValid: false 
          };
        }
        
        // For now, just use center anchor since we don't have anchor info in the current structure
        const anchorPoint = getElementAnchorPoint(connectedElement, 'center');
        return {
          endpoint: {
            x: anchorPoint.x,
            y: anchorPoint.y
          },
          isConnected: true,
          isValid: true
        };
      };

      if (!element.startPoint || !element.endPoint) {
        return {
          updatedStartPoint: { x: 0, y: 0 },
          updatedEndPoint: { x: 0, y: 0 },
          isValid: false,
          hasConnections: false
        };
      }

      const startResult = getUpdatedEndpoint(element.startPoint, element.startElementId);
      const endResult = getUpdatedEndpoint(element.endPoint, element.endElementId);
      
      return {
        updatedStartPoint: startResult.endpoint,
        updatedEndPoint: endResult.endpoint,
        isValid: startResult.isValid && endResult.isValid,
        hasConnections: startResult.isConnected || endResult.isConnected
      };
    }, [element.startPoint, element.endPoint, elements, sections, getElementAnchorPoint]);

    // Handle cleanup of invalid connections
    useEffect(() => {
      if (!isValid && onUpdate) {
        console.warn('🔗 [CONNECTOR] Cleaning up invalid connection:', element.id);
        // Optionally clean up or mark for deletion
        // For now, we'll just log the issue
      }
    }, [isValid, element.id, onUpdate]);
    
    // Calculate the current path - for straight connectors, just use start and end points
    const pathPoints = [updatedStartPoint.x, updatedStartPoint.y, updatedEndPoint.x, updatedEndPoint.y];
    
    const commonProps = {
      points: pathPoints,
      stroke: element.connectorStyle.strokeColor || '#000000',
      strokeWidth: element.connectorStyle.strokeWidth || 2,
      ...(element.connectorStyle.strokeDashArray && element.connectorStyle.strokeDashArray.length > 0 && {
        dash: element.connectorStyle.strokeDashArray
      }),
      onClick: onSelect,
      onTap: onSelect,
      listening: true,
      // Visual feedback for selection
      ...(isSelected && {
        shadowColor: '#3B82F6',
        shadowBlur: 4,
        shadowOpacity: 0.6,
      }),
    };

    // Render based on connector style - check if it has arrows
    const hasEndArrow = element.connectorStyle.endArrow && element.connectorStyle.endArrow !== 'none';
    
    if (hasEndArrow) {
      return (
        <Arrow
          ref={ref as React.RefObject<Konva.Arrow>}
          {...commonProps}
          fill={element.connectorStyle.strokeColor || '#000000'}
          pointerLength={element.connectorStyle.arrowSize || 10}
          pointerWidth={element.connectorStyle.arrowSize || 10}
        />
      );
    }
    
    // Default to line
    return <Line ref={ref as React.RefObject<Konva.Line>} {...commonProps} />;
  }
);

ConnectorRenderer.displayName = 'ConnectorRenderer';

export default ConnectorRenderer;