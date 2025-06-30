/**
 * Catmull-Rom Spline Implementation for Stroke Smoothing
 * Provides natural curve interpolation for drawing tools
 */

import { StrokePoint } from '../../types/drawing.types';

/**
 * Apply Catmull-Rom spline smoothing to stroke points
 */
export function catmullRomSpline(points: StrokePoint[], smoothness: number = 0.5): StrokePoint[] {
  if (points.length < 3) return points;
  
  const smoothedPoints: StrokePoint[] = [];
  const tension = Math.max(0.1, Math.min(0.9, smoothness));
  
  // Add first point
  smoothedPoints.push(points[0]);
  
  // Process each segment
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2; // Use last point if no p3
    
    // Calculate control points
    const segments = Math.max(2, Math.floor(distance(p1, p2) / 5));
    
    for (let t = 0; t <= 1; t += 1 / segments) {
      const interpolated = interpolateCatmullRom(p0, p1, p2, p3, t, tension);
      smoothedPoints.push(interpolated);
    }
  }
  
  // Add last point
  smoothedPoints.push(points[points.length - 1]);
  
  return smoothedPoints;
}

/**
 * Interpolate a single point using Catmull-Rom spline
 */
function interpolateCatmullRom(
  p0: StrokePoint, 
  p1: StrokePoint, 
  p2: StrokePoint, 
  p3: StrokePoint, 
  t: number,
  tension: number
): StrokePoint {
  const t2 = t * t;
  const t3 = t2 * t;
  
  // Catmull-Rom basis functions
  const b0 = -tension * t3 + 2 * tension * t2 - tension * t;
  const b1 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
  const b2 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
  const b3 = tension * t3 - tension * t2;
  
  return {
    x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
    pressure: interpolateScalar(p1.pressure || 0.5, p2.pressure || 0.5, t),
    timestamp: interpolateScalar(p1.timestamp, p2.timestamp, t),
    velocity: interpolateScalar(p1.velocity || 0, p2.velocity || 0, t)
  };
}

/**
 * Linear interpolation for scalar values
 */
function interpolateScalar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculate distance between two points
 */
function distance(p1: StrokePoint, p2: StrokePoint): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Douglas-Peucker line simplification algorithm
 */
export function douglasPeucker(points: StrokePoint[], tolerance: number = 1.5): StrokePoint[] {
  if (points.length <= 2) return points;
  
  return simplifySegment(points, 0, points.length - 1, tolerance);
}

function simplifySegment(points: StrokePoint[], start: number, end: number, tolerance: number): StrokePoint[] {
  if (end - start <= 1) {
    return [points[start], points[end]];
  }
  
  // Find the point with maximum distance from line
  let maxDistance = 0;
  let maxIndex = start;
  
  for (let i = start + 1; i < end; i++) {
    const dist = pointToLineDistance(points[i], points[start], points[end]);
    if (dist > maxDistance) {
      maxDistance = dist;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifySegment(points, start, maxIndex, tolerance);
    const right = simplifySegment(points, maxIndex, end, tolerance);
    
    // Combine results (remove duplicate point at junction)
    return [...left.slice(0, -1), ...right];
  }
  
  // Otherwise, just return endpoints
  return [points[start], points[end]];
}

/**
 * Calculate perpendicular distance from point to line
 */
function pointToLineDistance(point: StrokePoint, lineStart: StrokePoint, lineEnd: StrokePoint): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return Math.hypot(A, B);
  }
  
  const param = dot / lenSq;
  
  let closestX, closestY;
  
  if (param < 0) {
    closestX = lineStart.x;
    closestY = lineStart.y;
  } else if (param > 1) {
    closestX = lineEnd.x;
    closestY = lineEnd.y;
  } else {
    closestX = lineStart.x + param * C;
    closestY = lineStart.y + param * D;
  }
  
  return Math.hypot(point.x - closestX, point.y - closestY);
} 