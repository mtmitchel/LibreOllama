/**
 * Enhanced Stroke Optimization Utilities
 * Provides aggressive path simplification for better performance
 */

import { StrokePoint } from '../types/drawing.types';

interface SimplificationOptions {
  tolerance: number;
  preserveSharpCorners: boolean;
  maxPoints: number;
  minimumDistance: number;
}

/**
 * Optimized Douglas-Peucker algorithm with performance enhancements
 */
export function optimizeStrokePoints(
  points: number[], 
  options: Partial<SimplificationOptions> = {}
): number[] {
  const {
    tolerance = 3, // More aggressive default
    preserveSharpCorners = true,
    maxPoints = 500, // Limit total points
    minimumDistance = 2 // Minimum distance between points
  } = options;

  if (points.length <= 4) return points; // Need at least 2 points

  // Convert flat array to point objects
  const pointObjects: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i += 2) {
    if (i + 1 < points.length) {
      pointObjects.push({ x: points[i], y: points[i + 1] });
    }
  }

  if (pointObjects.length < 2) return points;

  // Step 1: Remove points that are too close together
  const filteredPoints = removeClosPoints(pointObjects, minimumDistance);
  
  // Step 2: Douglas-Peucker simplification
  const simplifiedPoints = douglasPeuckerOptimized(filteredPoints, tolerance);
  
  // Step 3: Preserve sharp corners if enabled
  const finalPoints = preserveSharpCorners 
    ? preserveCorners(simplifiedPoints, filteredPoints)
    : simplifiedPoints;
  
  // Step 4: Limit total points
  const limitedPoints = limitPointCount(finalPoints, maxPoints);
  
  // Convert back to flat array
  return limitedPoints.flatMap(p => [p.x, p.y]);
}

/**
 * Remove points that are too close to each other
 */
function removeClosPoints(
  points: { x: number; y: number }[], 
  minDistance: number
): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  
  const filtered = [points[0]]; // Always keep first point
  
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const last = filtered[filtered.length - 1];
    
    const distance = Math.hypot(current.x - last.x, current.y - last.y);
    if (distance >= minDistance) {
      filtered.push(current);
    }
  }
  
  // Always keep last point
  if (points.length > 1) {
    filtered.push(points[points.length - 1]);
  }
  
  return filtered;
}

/**
 * Optimized Douglas-Peucker algorithm
 */
function douglasPeuckerOptimized(
  points: { x: number; y: number }[], 
  tolerance: number
): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  
  const stack: Array<{ start: number; end: number }> = [{ start: 0, end: points.length - 1 }];
  const keep = new Set<number>();
  
  // Always keep first and last points
  keep.add(0);
  keep.add(points.length - 1);
  
  while (stack.length > 0) {
    const { start, end } = stack.pop()!;
    
    if (end - start <= 1) continue;
    
    let maxDistance = 0;
    let maxIndex = -1;
    
    // Find point with maximum distance from line
    for (let i = start + 1; i < end; i++) {
      const distance = perpendicularDistance(
        points[i],
        points[start],
        points[end]
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than tolerance, keep the point and recurse
    if (maxDistance > tolerance && maxIndex !== -1) {
      keep.add(maxIndex);
      stack.push({ start, end: maxIndex });
      stack.push({ start: maxIndex, end });
    }
  }
  
  // Return only kept points in order
  return Array.from(keep)
    .sort((a, b) => a - b)
    .map(i => points[i]);
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = lineEnd.x - lineStart.x;
  const B = lineEnd.y - lineStart.y;
  const C = point.x - lineStart.x;
  const D = point.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = A * A + B * B;
  
  if (lenSq === 0) {
    // Line start and end are the same point
    return Math.hypot(C, D);
  }
  
  const param = dot / lenSq;
  
  let closestX: number;
  let closestY: number;
  
  if (param < 0) {
    closestX = lineStart.x;
    closestY = lineStart.y;
  } else if (param > 1) {
    closestX = lineEnd.x;
    closestY = lineEnd.y;
  } else {
    closestX = lineStart.x + param * A;
    closestY = lineStart.y + param * B;
  }
  
  const dx = point.x - closestX;
  const dy = point.y - closestY;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Preserve important corner points that might have been simplified away
 */
function preserveCorners(
  simplified: { x: number; y: number }[],
  original: { x: number; y: number }[]
): { x: number; y: number }[] {
  const angleThreshold = Math.PI / 4; // 45 degrees
  const corners: { x: number; y: number; index: number }[] = [];
  
  // Find sharp corners in original path
  for (let i = 1; i < original.length - 1; i++) {
    const prev = original[i - 1];
    const curr = original[i];
    const next = original[i + 1];
    
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    const angleDiff = Math.abs(angle2 - angle1);
    
    // Normalize angle difference
    const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
    
    if (normalizedDiff > angleThreshold) {
      corners.push({ ...curr, index: i });
    }
  }
  
  // Add corners to simplified path if they're not already close to existing points
  const result = [...simplified];
  
  for (const corner of corners) {
    const hasNearbyPoint = result.some(point => 
      Math.hypot(point.x - corner.x, point.y - corner.y) < 5
    );
    
    if (!hasNearbyPoint) {
      // Find correct insertion position to maintain order
      let insertIndex = result.length;
      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i];
        const next = result[i + 1];
        
        // Simple heuristic: insert based on x-coordinate
        if (corner.x >= current.x && corner.x <= next.x) {
          insertIndex = i + 1;
          break;
        }
      }
      
      result.splice(insertIndex, 0, { x: corner.x, y: corner.y });
    }
  }
  
  return result;
}

/**
 * Limit the total number of points while preserving shape
 */
function limitPointCount(
  points: { x: number; y: number }[],
  maxPoints: number
): { x: number; y: number }[] {
  if (points.length <= maxPoints) return points;
  
  // Use adaptive sampling to preserve important points
  const result = [points[0]]; // Always keep first point
  const step = (points.length - 1) / (maxPoints - 1);
  
  for (let i = 1; i < maxPoints - 1; i++) {
    const index = Math.round(i * step);
    if (index < points.length && index > 0) {
      result.push(points[index]);
    }
  }
  
  // Always keep last point
  if (points.length > 1) {
    result.push(points[points.length - 1]);
  }
  
  return result;
}

/**
 * Optimize stroke for real-time drawing (lighter processing)
 */
export function optimizeStrokeForRealtime(points: number[]): number[] {
  return optimizeStrokePoints(points, {
    tolerance: 1.5, // Less aggressive for real-time
    preserveSharpCorners: false, // Skip corner preservation for speed
    maxPoints: 200, // Lower limit for real-time
    minimumDistance: 1.5
  });
}

/**
 * Optimize stroke for final rendering (more aggressive)
 */
export function optimizeStrokeForFinal(points: number[]): number[] {
  return optimizeStrokePoints(points, {
    tolerance: 4, // More aggressive
    preserveSharpCorners: true, // Preserve quality
    maxPoints: 300, // Reasonable limit
    minimumDistance: 3
  });
}

/**
 * Memory-efficient stroke optimization for large datasets
 */
export function optimizeStrokeMemoryEfficient(points: number[]): number[] {
  // For very large strokes, use maximum optimization
  if (points.length > 2000) {
    return optimizeStrokePoints(points, {
      tolerance: 6, // Very aggressive
      preserveSharpCorners: false, // Skip for memory
      maxPoints: 150, // Very low limit
      minimumDistance: 5
    });
  }
  
  return optimizeStrokeForFinal(points);
} 