import React, { useMemo, useEffect } from 'react';
import { Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { CanvasElement } from '../types';
import { SectionElement } from '../../../types/section';
import { getAnchorPoint } from '../../../types/connector';

interface ConnectorRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (elementId: string, updates: Partial<CanvasElement>) => void;
  elements: Record<string, CanvasElement>; // All elements for connection updates
  sections?: Record<string, SectionElement>; // Sections for coordinate conversion
}

export const ConnectorRenderer = React.forwardRef<Konva.Line | Konva.Arrow, ConnectorRendererProps>(
  ({ element, isSelected, onSelect, onUpdate, elements, sections = {} }, ref) => {
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
        const section = sections[targetElement.sectionId];
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
          width: targetElement.width || 0, 
          height: targetElement.height || 0, 
          radius: targetElement.radius || 0 
        },
        anchor as any
      );
    };

    // Memoize endpoint calculations for performance
    const { updatedStartPoint, updatedEndPoint, isValid } = useMemo(() => {
      // Update connector path if connected to elements
      const getUpdatedEndpoint = (endpoint: typeof element.startPoint) => {
        if (!endpoint || !endpoint.connectedElementId || !endpoint.anchorPoint) {
          return { 
            endpoint: endpoint || { x: 0, y: 0 }, 
            isConnected: false,
            isValid: true 
          };
        }
        
        const connectedElement = elements[endpoint.connectedElementId];
        if (!connectedElement) {
          // Element was deleted - mark as invalid for cleanup
          return { 
            endpoint: { x: endpoint.x, y: endpoint.y },
            isConnected: false,
            isValid: false 
          };
        }
        
        // Calculate new position based on connected element's current position
        const anchorPoint = getElementAnchorPoint(connectedElement, endpoint.anchorPoint);
        return {
          endpoint: {
            ...endpoint,
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

      const startResult = getUpdatedEndpoint(element.startPoint);
      const endResult = getUpdatedEndpoint(element.endPoint);
      
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