// Connector utilities for advanced connector functionality
import { CanvasElement, ElementId, ConnectorElement, isRectangleElement, isCircleElement, isSectionElement } from '../types/enhanced.types';

export type AttachmentPoint = 'top' | 'right' | 'bottom' | 'left' | 'center' | 
                             'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface SnapPoint {
  x: number;
  y: number;
  elementId?: ElementId;
  attachmentPoint?: AttachmentPoint;
}

// Calculate snap points for an element
export function getElementSnapPoints(element: CanvasElement): SnapPoint[] {
  const points: SnapPoint[] = [];
  
  if (isRectangleElement(element) || isSectionElement(element) || 'width' in element && 'height' in element) {
    const { x, y, width = 100, height = 100 } = element as any;
    
    // Edge midpoints
    points.push(
      { x: x + width / 2, y: y, elementId: element.id, attachmentPoint: 'top' },
      { x: x + width, y: y + height / 2, elementId: element.id, attachmentPoint: 'right' },
      { x: x + width / 2, y: y + height, elementId: element.id, attachmentPoint: 'bottom' },
      { x: x, y: y + height / 2, elementId: element.id, attachmentPoint: 'left' }
    );
    
    // Corners
    points.push(
      { x: x, y: y, elementId: element.id, attachmentPoint: 'top-left' },
      { x: x + width, y: y, elementId: element.id, attachmentPoint: 'top-right' },
      { x: x, y: y + height, elementId: element.id, attachmentPoint: 'bottom-left' },
      { x: x + width, y: y + height, elementId: element.id, attachmentPoint: 'bottom-right' }
    );
    
    // Center
    points.push({ x: x + width / 2, y: y + height / 2, elementId: element.id, attachmentPoint: 'center' });
    
  } else if (isCircleElement(element)) {
    const { x, y, radius = 50 } = element;
    
    // Cardinal points on circle
    points.push(
      { x: x, y: y - radius, elementId: element.id, attachmentPoint: 'top' },
      { x: x + radius, y: y, elementId: element.id, attachmentPoint: 'right' },
      { x: x, y: y + radius, elementId: element.id, attachmentPoint: 'bottom' },
      { x: x - radius, y: y, elementId: element.id, attachmentPoint: 'left' }
    );
    
    // Center
    points.push({ x: x, y: y, elementId: element.id, attachmentPoint: 'center' });
  }
  
  return points;
}

// Find the nearest snap point to a given position
export function findNearestSnapPoint(
  position: { x: number; y: number },
  elements: Map<string, CanvasElement>,
  threshold: number = 20
): SnapPoint | null {
  let nearestPoint: SnapPoint | null = null;
  let minDistance = threshold;
  
  elements.forEach(element => {
    if (element.type === 'connector') return; // Don't snap to other connectors
    
    const snapPoints = getElementSnapPoints(element);
    snapPoints.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(position.x - point.x, 2) + 
        Math.pow(position.y - point.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });
  });
  
  return nearestPoint;
}

// Calculate path points for different connector types
export function calculateConnectorPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  type: 'straight' | 'orthogonal' | 'curved' = 'straight',
  startAttachment?: AttachmentPoint,
  endAttachment?: AttachmentPoint
): number[] {
  switch (type) {
    case 'straight':
      return [start.x, start.y, end.x, end.y];
      
    case 'orthogonal':
      return calculateOrthogonalPath(start, end, startAttachment, endAttachment);
      
    case 'curved':
      return calculateCurvedPath(start, end);
      
    default:
      return [start.x, start.y, end.x, end.y];
  }
}

// Calculate orthogonal (right-angle) path
function calculateOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startAttachment?: AttachmentPoint,
  endAttachment?: AttachmentPoint
): number[] {
  const path: number[] = [start.x, start.y];
  
  // Determine routing based on attachment points
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Simple L-shaped routing for now
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal first, then vertical
    path.push(end.x, start.y);
    path.push(end.x, end.y);
  } else {
    // Vertical first, then horizontal
    path.push(start.x, end.y);
    path.push(end.x, end.y);
  }
  
  return path;
}

// Calculate curved path with control points
function calculateCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
): number[] {
  // For now, return a simple quadratic curve
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const controlOffset = 50;
  
  // Create a control point offset perpendicular to the line
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const perpAngle = angle + Math.PI / 2;
  
  const controlX = midX + Math.cos(perpAngle) * controlOffset;
  const controlY = midY + Math.sin(perpAngle) * controlOffset;
  
  // Return points for quadratic bezier curve
  return [start.x, start.y, controlX, controlY, end.x, end.y];
}

// Update connector when connected elements move
export function updateConnectorPosition(
  connector: ConnectorElement,
  elements: Map<string, CanvasElement>
): Partial<ConnectorElement> {
  const updates: Partial<ConnectorElement> = {};
  
  // Update start point if connected to an element
  if (connector.startElementId) {
    const startElement = elements.get(connector.startElementId);
    if (startElement) {
      const snapPoints = getElementSnapPoints(startElement);
      const attachmentPoint = snapPoints.find(p => p.attachmentPoint === connector.startPoint.attachmentPoint);
      if (attachmentPoint) {
        updates.startPoint = {
          x: attachmentPoint.x,
          y: attachmentPoint.y,
          attachmentPoint: attachmentPoint.attachmentPoint
        };
      }
    }
  }
  
  // Update end point if connected to an element
  if (connector.endElementId) {
    const endElement = elements.get(connector.endElementId);
    if (endElement) {
      const snapPoints = getElementSnapPoints(endElement);
      const attachmentPoint = snapPoints.find(p => p.attachmentPoint === connector.endPoint.attachmentPoint);
      if (attachmentPoint) {
        updates.endPoint = {
          x: attachmentPoint.x,
          y: attachmentPoint.y,
          attachmentPoint: attachmentPoint.attachmentPoint
        };
      }
    }
  }
  
  // Recalculate path if points changed
  if (updates.startPoint || updates.endPoint) {
    const start = updates.startPoint || connector.startPoint;
    const end = updates.endPoint || connector.endPoint;
    updates.pathPoints = calculateConnectorPath(
      start,
      end,
      connector.subType as 'straight' | 'orthogonal' | 'curved'
    );
  }
  
  return updates;
}

// Get connector style based on type
export function getConnectorStyle(connector: ConnectorElement) {
  const baseStyle = {
    stroke: connector.stroke || '#6366F1',
    strokeWidth: connector.strokeWidth || 2,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  };
  
  // Add arrow marker for arrow connectors
  if (connector.subType === 'arrow' || connector.subType === 'connector-arrow') {
    return {
      ...baseStyle,
      markerEnd: 'url(#arrowhead)',
    };
  }
  
  return baseStyle;
}