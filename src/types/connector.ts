// Connector types for FigJam-style line and arrow drawing

export interface ConnectorEndpoint {
  x: number;
  y: number;
  // Optional: connection to another element
  connectedElementId?: string;
  // Optional: anchor point on the connected element (e.g., 'top', 'bottom', 'left', 'right', 'center')
  anchorPoint?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface ConnectorStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeDashArray?: number[];
  // For arrows
  hasStartArrow?: boolean;
  hasEndArrow?: boolean;
  arrowSize?: number;
}

export interface ConnectorElement {
  id: string;
  type: 'connector';
  subType: 'line' | 'arrow';
  startPoint: ConnectorEndpoint;
  endPoint: ConnectorEndpoint;
  style: ConnectorStyle;
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