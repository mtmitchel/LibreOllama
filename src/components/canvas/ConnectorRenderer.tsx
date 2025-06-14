import React from 'react';
import { Line, Arrow } from 'react-konva';
import { CanvasElement } from '../../stores/konvaCanvasStore';
import { SectionElement } from '../../types/section';
import { calculateConnectorPath } from '../../types/connector';

interface ConnectorRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  elements: Record<string, CanvasElement>; // All elements for connection updates
  sections?: Record<string, SectionElement>; // Sections for coordinate conversion
}

export const ConnectorRenderer: React.FC<ConnectorRendererProps> = ({
  element,
  isSelected,
  onSelect,
  elements,
  sections = {}
}) => {
  // Only render if this is a connector element
  if (element.type !== 'connector' || !element.startPoint || !element.endPoint || !element.connectorStyle) {
    return null;
  }

  // Helper function to get anchor point with section support
  const getAnchorPoint = (element: CanvasElement, anchor: string) => {
    // Get element coordinates - convert to absolute if in a section
    let elementX = element.x;
    let elementY = element.y;
    
    if (element.sectionId && sections[element.sectionId]) {
      const section = sections[element.sectionId];
      elementX = section.x + element.x;
      elementY = section.y + element.y;
    }
    
    const { width = 0, height = 0, radius = 0 } = element;
    
    // For circles, use radius
    if (radius > 0) {
      const points: Record<string, { x: number; y: number }> = {
        'top': { x: elementX, y: elementY - radius },
        'bottom': { x: elementX, y: elementY + radius },
        'left': { x: elementX - radius, y: elementY },
        'right': { x: elementX + radius, y: elementY },
        'center': { x: elementX, y: elementY }
      };
      return points[anchor] || { x: elementX, y: elementY };
    }
    
    // For rectangles and other shapes
    const points: Record<string, { x: number; y: number }> = {
      'top': { x: elementX + width / 2, y: elementY },
      'bottom': { x: elementX + width / 2, y: elementY + height },
      'left': { x: elementX, y: elementY + height / 2 },
      'right': { x: elementX + width, y: elementY + height / 2 },
      'center': { x: elementX + width / 2, y: elementY + height / 2 },
      'top-left': { x: elementX, y: elementY },
      'top-right': { x: elementX + width, y: elementY },
      'bottom-left': { x: elementX, y: elementY + height },
      'bottom-right': { x: elementX + width, y: elementY + height }
    };
    
    return points[anchor] || { x: elementX + width / 2, y: elementY + height / 2 };
  };

  // Update connector path if connected to elements
  const getUpdatedEndpoint = (endpoint: typeof element.startPoint) => {
    if (!endpoint.connectedElementId || !endpoint.anchorPoint) {
      return endpoint;
    }
    
    const connectedElement = elements[endpoint.connectedElementId];
    if (!connectedElement) {
      // Element was deleted, use original coordinates
      return { x: endpoint.x, y: endpoint.y };
    }
    
    // Calculate new position based on connected element's current position
    const anchorPoint = getAnchorPoint(connectedElement, endpoint.anchorPoint);
    return {
      ...endpoint,
      x: anchorPoint.x,
      y: anchorPoint.y
    };
  };

  const updatedStartPoint = getUpdatedEndpoint(element.startPoint);
  const updatedEndPoint = getUpdatedEndpoint(element.endPoint);
  
  // Calculate the current path
  const pathPoints = calculateConnectorPath(updatedStartPoint, updatedEndPoint);
  
  const commonProps = {
    points: pathPoints,
    stroke: element.connectorStyle.strokeColor,
    strokeWidth: element.connectorStyle.strokeWidth,
    dash: element.connectorStyle.strokeDashArray,
    onClick: onSelect,
    onTap: onSelect,
    listening: true,
    // Visual feedback for selection
    shadowColor: isSelected ? '#3B82F6' : undefined,
    shadowBlur: isSelected ? 4 : 0,
    shadowOpacity: isSelected ? 0.6 : 0,
  };

  // Render based on connector subtype
  if (element.subType === 'arrow' && element.connectorStyle.hasEndArrow) {
    return (
      <Arrow
        {...commonProps}
        fill={element.connectorStyle.strokeColor}
        pointerLength={element.connectorStyle.arrowSize || 10}
        pointerWidth={element.connectorStyle.arrowSize || 10}
      />
    );
  }
  
  // Default to line
  return <Line {...commonProps} />;
};

export default ConnectorRenderer;