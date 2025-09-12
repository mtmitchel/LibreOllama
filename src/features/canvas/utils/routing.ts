// src/features/canvas/utils/routing.ts
import { EdgeElement, EdgeRouting, NodeElement, PortKind } from '../types/canvas-elements';
import { getDefaultPortsFor, toWorldPort, toWorldPortByKind, getPortNormal } from './ports';

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
export function routeOrthogonal(
  start: WorldPoint & { normal?: { x: number; y: number } },
  end: WorldPoint & { normal?: { x: number; y: number } },
  opts?: { leave?: number; enter?: number; minSegment?: number; preferAxis?: 'x'|'y'|'auto' }
): number[] {
  const leave = Math.max(0, opts?.leave ?? 8);
  const enter = Math.max(0, opts?.enter ?? 8);
  const minSeg = Math.max(0, opts?.minSegment ?? 1);

  const s0 = { x: start.x + (start.normal?.x || 0) * leave, y: start.y + (start.normal?.y || 0) * leave };
  const e0 = { x: end.x   - (end.normal?.x   || 0) * enter, y: end.y   - (end.normal?.y   || 0) * enter };

  const viaHV = [s0, { x: e0.x, y: s0.y }, e0];
  const viaVH = [s0, { x: s0.x, y: e0.y }, e0];

  const score = (pts: {x:number;y:number}[]) => {
    let len = 0, bends = 0;
    for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y); }
    // one bend in both candidates; tie-breaker is length
    return len + bends * 10;
  };

  const choice = opts?.preferAxis === 'x' ? viaHV : opts?.preferAxis === 'y' ? viaVH : (score(viaHV) <= score(viaVH) ? viaHV : viaVH);

  // Collapse tiny segments
  const out: number[] = [];
  const pts = [ {x: start.x, y: start.y}, ...choice ];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (out.length >= 2) {
      const xPrev = out[out.length - 2];
      const yPrev = out[out.length - 1];
      if (Math.abs(p.x - xPrev) + Math.abs(p.y - yPrev) < minSeg) continue;
      // Merge collinear
      if (out.length >= 4) {
        const xPrev2 = out[out.length - 4];
        const yPrev2 = out[out.length - 3];
        const colX = xPrev2 === xPrev && xPrev === p.x;
        const colY = yPrev2 === yPrev && yPrev === p.y;
        if (colX || colY) { out[out.length - 2] = p.x; out[out.length - 1] = p.y; continue; }
      }
    }
    out.push(p.x, p.y);
  }
  out.push(end.x, end.y);
  return out;
}

/**
 * Gentle curved routing using a single mid control point and Line.tension
 * Returns three points: start, mid, end.
 */
export function routeCurved(start: WorldPoint, end: WorldPoint): number[] {
  // Midpoint with slight horizontal bias toward the direction of travel
  const midX = (start.x + end.x) / 2;
  const midY = start.y + (end.y - start.y) * 0.35;
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
  // Get ports (use defaults when none provided)
  const srcPorts = (sourceElement as any).ports && Array.isArray((sourceElement as any).ports)
    ? (sourceElement as any).ports
    : getDefaultPortsFor(sourceElement);
  const tgtPorts = (targetElement as any).ports && Array.isArray((targetElement as any).ports)
    ? (targetElement as any).ports
    : getDefaultPortsFor(targetElement);

  // Find specific port by kind, fallback to CENTER
  const sourcePort = srcPorts.find((p: any) => p.kind === edge.source.portKind) || srcPorts.find((p: any) => p.kind === 'CENTER');
  const targetPort = tgtPorts.find((p: any) => p.kind === edge.target.portKind) || tgtPorts.find((p: any) => p.kind === 'CENTER');
  
  if (!sourcePort || !targetPort) {
    // Fallback: use element centers if ports not found
    let sourceCenter: { x: number; y: number };
    let targetCenter: { x: number; y: number };
    
    // Handle circle elements where x,y is already the center
    if ((sourceElement as any).type === 'circle' || (sourceElement as any).type === 'circle-text') {
      sourceCenter = { x: sourceElement.x, y: sourceElement.y };
    } else {
      sourceCenter = { x: sourceElement.x + sourceElement.width / 2, y: sourceElement.y + sourceElement.height / 2 };
    }
    
    if ((targetElement as any).type === 'circle' || (targetElement as any).type === 'circle-text') {
      targetCenter = { x: targetElement.x, y: targetElement.y };
    } else {
      targetCenter = { x: targetElement.x + targetElement.width / 2, y: targetElement.y + targetElement.height / 2 };
    }
    // Preserve curved style for mindmap-like branches
    if ((edge as any).curved === true) {
      return routeCurved(sourceCenter, targetCenter);
    }
    return routeStraight(sourceCenter, targetCenter);
  }
  
  const sourceWorld = toWorldPort(sourceElement, sourcePort);
  const targetWorld = toWorldPort(targetElement, targetPort);
  const sourceNormal = getPortNormal(edge.source.portKind as PortKind);
  const targetNormal = getPortNormal(edge.target.portKind as PortKind);
  
  // Optional curved path for mindmap-style edges
  if ((edge as any).curved === true) {
    return routeCurved(sourceWorld, targetWorld);
  }

  // Dispatch based on routing type
  switch (edge.routing) {
    case 'straight':
      return routeStraight(sourceWorld, targetWorld);
    case 'orthogonal':
      return routeOrthogonal({ ...sourceWorld, normal: sourceNormal }, { ...targetWorld, normal: targetNormal }, { leave: 8, enter: 8, minSegment: 2, preferAxis: 'auto' });
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
