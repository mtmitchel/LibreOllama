// src/features/canvas/utils/routing.ts
import { EdgeElement, EdgeRouting, NodeElement } from '../types/canvas-elements';
import { toWorldPort } from './ports';

/**
 * World coordinate point
 */
export interface WorldPoint {
  x: number;
  y: number;
}

/**
 * Simple straight line routing between two world points
 * Returns points array in format [x1, y1, x2, y2]
 */
export function routeStraight(start: WorldPoint, end: WorldPoint): number[] {
  return [start.x, start.y, end.x, end.y];
}

/**
 * Orthogonal (L-shaped) routing between two world points
 * Creates a path that goes horizontally then vertically (or vice versa)
 * Returns points array in format [x1, y1, x2, y2, x3, y3]
 */
export function routeOrthogonal(start: WorldPoint, end: WorldPoint): number[] {
  // Simple L-routing: go horizontal first, then vertical
  // Choose the path that minimizes total length or avoids obstacles (future enhancement)
  
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  
  // For now, always go horizontal first, then vertical
  const midX = end.x;
  const midY = start.y;
  
  return [start.x, start.y, midX, midY, end.x, end.y];
}

/**
 * Main routing function that dispatches to the appropriate routing algorithm
 * based on the edge's routing type
 */
export function routeEdge(
  edge: EdgeElement,
  sourceElement: NodeElement,
  targetElement: NodeElement
): number[] {
  // Get world positions for the source and target ports
  const sourcePort = (sourceElement.ports || []).find(p => p.kind === edge.source.portKind);
  const targetPort = (targetElement.ports || []).find(p => p.kind === edge.target.portKind);
  
  if (!sourcePort || !targetPort) {
    // Fallback: use element centers if ports not found
    console.warn('[routing] Port not found, using element centers as fallback', {
      sourcePort: edge.source.portKind,
      targetPort: edge.target.portKind,
    });
    
    const sourceCenter = { x: sourceElement.x + sourceElement.width / 2, y: sourceElement.y + sourceElement.height / 2 };
    const targetCenter = { x: targetElement.x + targetElement.width / 2, y: targetElement.y + targetElement.height / 2 };
    
    return routeStraight(sourceCenter, targetCenter);
  }
  
  const sourceWorld = toWorldPort(sourceElement, sourcePort);
  const targetWorld = toWorldPort(targetElement, targetPort);
  
  // Dispatch based on routing type
  switch (edge.routing) {
    case 'straight':
      return routeStraight(sourceWorld, targetWorld);
    case 'orthogonal':
      return routeOrthogonal(sourceWorld, targetWorld);
    default:
      console.warn('[routing] Unknown routing type, defaulting to straight', edge.routing);
      return routeStraight(sourceWorld, targetWorld);
  }
}

/**
 * Calculate the bounding box for a set of points
 * Used to update edge element's x, y, width, height properties
 */
export function calculatePointsBoundingBox(points: number[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length < 4) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = points[0];
  let minY = points[1];
  let maxX = points[0];
  let maxY = points[1];
  
  // Check all points (x,y pairs)
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Update an edge element with freshly routed points and bounding box
 * This is the main function called during edge reflow
 */
export function updateEdgeGeometry(
  edge: EdgeElement,
  sourceElement: NodeElement,
  targetElement: NodeElement
): Partial<EdgeElement> {
  // Calculate new routing
  const points = routeEdge(edge, sourceElement, targetElement);
  
  // Update bounding box
  const bbox = calculatePointsBoundingBox(points);
  
  return {
    points,
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
  };
}