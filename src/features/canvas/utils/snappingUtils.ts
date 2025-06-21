// src/lib/snappingUtils.ts
import { CanvasElement, ElementId } from '../types/enhanced.types';
import type { AttachmentPoint } from '../../../types/connector';

export interface SnapPoint {
  x: number;
  y: number;
  elementId: string;
  type: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'corner';
}

export interface ConnectionPoint {
  x: number;
  y: number;
  elementId: string;
  anchor: AttachmentPoint;
}

const SNAP_THRESHOLD = 20; // pixels

export function getElementConnectionPoints(element: CanvasElement): ConnectionPoint[] {
  // Helper function to get element dimensions with type safety
  const getDimensions = () => {
    switch (element.type) {
      case 'rectangle':
      case 'text':
      case 'table':
      case 'image':
        return { 
          width: element.width || 100, 
          height: element.height || 100, 
          radius: undefined 
        };
      case 'circle':
        return { 
          width: (element.radius || 50) * 2, 
          height: (element.radius || 50) * 2, 
          radius: element.radius || 50 
        };
      case 'section':
        return { 
          width: element.width, 
          height: element.height, 
          radius: undefined 
        };
      default:
        return { 
          width: 100, 
          height: 100, 
          radius: undefined 
        };
    }
  };

  const { id, x, y } = element;
  const { width, height, radius } = getDimensions();
  
  // Handle circles
  if (radius && element.type === 'circle') {
    const centerX = x;
    const centerY = y;
    
    return [
      { x: centerX, y: centerY - radius, elementId: id, anchor: 'top' },
      { x: centerX + radius, y: centerY, elementId: id, anchor: 'right' },
      { x: centerX, y: centerY + radius, elementId: id, anchor: 'bottom' },
      { x: centerX - radius, y: centerY, elementId: id, anchor: 'left' },
      { x: centerX, y: centerY, elementId: id, anchor: 'center' }
    ];
  }
  
  // Handle rectangles and other shapes with width/height
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  return [
    { x: centerX, y, elementId: id, anchor: 'top' },
    { x: x + width, y: centerY, elementId: id, anchor: 'right' },
    { x: centerX, y: y + height, elementId: id, anchor: 'bottom' },
    { x, y: centerY, elementId: id, anchor: 'left' },
    { x: centerX, y: centerY, elementId: id, anchor: 'center' },
    { x, y, elementId: id, anchor: 'top-left' },
    { x: x + width, y, elementId: id, anchor: 'top-right' },
    { x, y: y + height, elementId: id, anchor: 'bottom-left' },
    { x: x + width, y: y + height, elementId: id, anchor: 'bottom-right' }
  ];
}

export function getElementSnapPoints(element: CanvasElement): SnapPoint[] {
  const points: SnapPoint[] = [];
  
  switch (element.type) {
    case 'rectangle':
    case 'image':
      if (element.width && element.height) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        
        points.push(
          { x: element.x, y: element.y, elementId: element.id, type: 'corner' },
          { x: element.x + element.width, y: element.y, elementId: element.id, type: 'corner' },
          { x: element.x, y: element.y + element.height, elementId: element.id, type: 'corner' },
          { x: element.x + element.width, y: element.y + element.height, elementId: element.id, type: 'corner' },
          { x: centerX, y: element.y, elementId: element.id, type: 'top' },
          { x: centerX, y: element.y + element.height, elementId: element.id, type: 'bottom' },
          { x: element.x, y: centerY, elementId: element.id, type: 'left' },
          { x: element.x + element.width, y: centerY, elementId: element.id, type: 'right' },
          { x: centerX, y: centerY, elementId: element.id, type: 'center' }
        );
      }
      break;
      
    case 'text':
    case 'table':
      if (element.width && element.height) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        
        points.push(
          { x: element.x, y: element.y, elementId: element.id, type: 'corner' },
          { x: element.x + element.width, y: element.y, elementId: element.id, type: 'corner' },
          { x: element.x, y: element.y + element.height, elementId: element.id, type: 'corner' },
          { x: element.x + element.width, y: element.y + element.height, elementId: element.id, type: 'corner' },
          { x: centerX, y: element.y, elementId: element.id, type: 'top' },
          { x: centerX, y: element.y + element.height, elementId: element.id, type: 'bottom' },
          { x: element.x, y: centerY, elementId: element.id, type: 'left' },
          { x: element.x + element.width, y: centerY, elementId: element.id, type: 'right' },
          { x: centerX, y: centerY, elementId: element.id, type: 'center' }
        );
      }
      break;
      
    case 'circle':
      if (element.radius) {
        points.push(
          { x: element.x, y: element.y, elementId: element.id, type: 'center' },
          { x: element.x + element.radius, y: element.y, elementId: element.id, type: 'right' },
          { x: element.x - element.radius, y: element.y, elementId: element.id, type: 'left' },
          { x: element.x, y: element.y + element.radius, elementId: element.id, type: 'bottom' },
          { x: element.x, y: element.y - element.radius, elementId: element.id, type: 'top' }
        );
      }
      break;
      
    case 'star':
    case 'triangle':
      // For star and triangle, use simple center point and assume 100x100 default size
      points.push(
        { x: element.x, y: element.y, elementId: element.id, type: 'center' },
        { x: element.x + 50, y: element.y, elementId: element.id, type: 'right' },
        { x: element.x - 50, y: element.y, elementId: element.id, type: 'left' },
        { x: element.x, y: element.y + 50, elementId: element.id, type: 'bottom' },
        { x: element.x, y: element.y - 50, elementId: element.id, type: 'top' }
      );
      break;
  }
  
  return points;
}

export function findNearestSnapPoint(
  x: number,
  y: number,
  elements: Record<string, CanvasElement>,
  excludeElementId?: string
): { point: SnapPoint; distance: number } | null {
  let nearestPoint: SnapPoint | null = null;
  let minDistance = Infinity;
  
  Object.values(elements).forEach(element => {
    if (element.id === excludeElementId) return;
    
    const snapPoints = getElementSnapPoints(element);
    snapPoints.forEach(point => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (distance < SNAP_THRESHOLD && distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });
  });
  
  return nearestPoint ? { point: nearestPoint, distance: minDistance } : null;
}

export function snapLineToPoints(
  points: number[],
  elements: Record<string, CanvasElement>,
  excludeElementId?: string
): number[] {
  if (points.length < 4) return points;
  
  const snappedPoints = [...points];
  
  // Snap start point
  const startX = points[0];
  const startY = points[1];
  if (typeof startX === 'number' && typeof startY === 'number') {
    const startSnap = findNearestSnapPoint(startX, startY, elements, excludeElementId);
    if (startSnap) {
      snappedPoints[0] = startSnap.point.x;
      snappedPoints[1] = startSnap.point.y;
    }
  }
  
  // Snap end point
  const endX = points[points.length - 2];
  const endY = points[points.length - 1];
  
  // Ensure we have valid coordinates before snapping
  if (typeof endX === 'number' && typeof endY === 'number') {
    const endSnap = findNearestSnapPoint(endX, endY, elements, excludeElementId);
    if (endSnap) {
      snappedPoints[snappedPoints.length - 2] = endSnap.point.x;
      snappedPoints[snappedPoints.length - 1] = endSnap.point.y;
    }
  }
  
  return snappedPoints;
}

export function findNearestConnectionPoint(
  x: number,
  y: number,
  elements: Record<string, CanvasElement>,
  excludeElementId?: string
): { point: ConnectionPoint; distance: number } | null {
  let nearestPoint: ConnectionPoint | null = null;
  let minDistance = Infinity;
  
  Object.values(elements).forEach(element => {
    if (element.id === excludeElementId) return;
    if (element.type === 'connector') return; // Don't snap to other connectors
    
    const connectionPoints = getElementConnectionPoints(element);
    connectionPoints.forEach(point => {
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (distance < SNAP_THRESHOLD && distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });
  });
  
  return nearestPoint ? { point: nearestPoint, distance: minDistance } : null;
}
