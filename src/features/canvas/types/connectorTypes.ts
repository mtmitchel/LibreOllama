// Connector types for FigJam-style line and arrow drawing

export type AttachmentPoint = 'top' | 'right' | 'bottom' | 'left' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type ArrowStyle = 'none' | 'solid' | 'line' | 'triangle' | 'diamond';

export interface ConnectorEndpoint {
  x: number;
  y: number;
  // Connection to another element
  connectedElementId?: string;
  // Anchor point on the connected element
  anchorPoint?: AttachmentPoint;
}

export interface ConnectorStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  startArrow?: ArrowStyle;
  endArrow?: ArrowStyle;
  arrowSize?: number;
  text?: string; // Text label on the connector
}

export interface ConnectorElement {
  id: string;
  type: 'connector';
  subType: 'straight' | 'bent' | 'curved';
  startPoint: ConnectorEndpoint;
  endPoint: ConnectorEndpoint;
  intermediatePoints: { x: number; y: number }[]; // For bent/curved connectors
  connectorStyle: ConnectorStyle;
  // Calculated path points (for rendering)
  pathPoints?: number[];
}

// Helper function to calculate path between two points
export function calculateConnectorPath(
  start: ConnectorEndpoint,
  end: ConnectorEndpoint,
  routingType: 'straight' | 'orthogonal' = 'straight'
): number[] {
  if (routingType === 'straight') {
    return [start.x, start.y, end.x, end.y];
  }
  
  // For future: implement orthogonal routing
  // This would calculate a path that goes horizontally then vertically
  // or vice versa to avoid overlapping with other elements
  return [start.x, start.y, end.x, end.y];
}

// Helper function to get anchor point coordinates on an element
export function getAnchorPoint(
  element: { x: number; y: number; width?: number; height?: number; radius?: number },
  anchor: ConnectorEndpoint['anchorPoint']
): { x: number; y: number } {
  const { x, y, width = 0, height = 0, radius = 0 } = element;
  
  // For circles, use radius
  if (radius > 0) {
    switch (anchor) {
      case 'top': return { x, y: y - radius };
      case 'bottom': return { x, y: y + radius };
      case 'left': return { x: x - radius, y };
      case 'right': return { x: x + radius, y };
      case 'center': return { x, y };
      default: return { x, y };
    }
  }
  
  // For rectangles and other shapes
  switch (anchor) {
    case 'top': return { x: x + width / 2, y };
    case 'bottom': return { x: x + width / 2, y: y + height };
    case 'left': return { x, y: y + height / 2 };
    case 'right': return { x: x + width, y: y + height / 2 };
    case 'center': return { x: x + width / 2, y: y + height / 2 };
    case 'top-left': return { x, y };
    case 'top-right': return { x: x + width, y };
    case 'bottom-left': return { x, y: y + height };
    case 'bottom-right': return { x: x + width, y: y + height };
    default: return { x: x + width / 2, y: y + height / 2 };
  }
}