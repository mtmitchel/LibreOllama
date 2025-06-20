/**
 * Path Optimization Utilities for Canvas Performance
 * Implements Douglas-Peucker algorithm and other path simplification techniques
 */

export interface Point {
  x: number;
  y: number;
}

export interface PathOptimizationOptions {
  tolerance: number;
  maxPoints: number;
  preserveDetail: boolean;
}

const DEFAULT_OPTIONS: PathOptimizationOptions = {
  tolerance: 1,
  maxPoints: 10000,
  preserveDetail: true
};

/**
 * Douglas-Peucker algorithm for path simplification
 * Recursively removes points that don't significantly contribute to the path shape
 */
export function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from the line between start and end
  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  if (!start || !end) return points;

  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    if (!point) continue;
    
    const distance = pointToLineDistance(point, start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If the maximum distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    
    // Combine the results, removing the duplicate point at the join
    return [...left.slice(0, -1), ...right];
  } else {
    // All points between start and end can be removed
    return [start, end];
  }
}

/**
 * Calculate the perpendicular distance from a point to a line
 */
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) {
    // Line start and end are the same point
    return Math.sqrt(A * A + B * B);
  }

  const param = dot / lenSq;

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert flat point array to Point objects
 */
export function pointsArrayToPoints(pointsArray: number[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < pointsArray.length; i += 2) {
    if (i + 1 < pointsArray.length) {
      const x = pointsArray[i];
      const y = pointsArray[i + 1];
      if (typeof x === 'number' && typeof y === 'number') {
        points.push({ x, y });
      }
    }
  }
  return points;
}

/**
 * Convert Point objects back to flat array
 */
export function pointsToPointsArray(points: Point[]): number[] {
  const result: number[] = [];
  for (const point of points) {
    result.push(point.x, point.y);
  }
  return result;
}

/**
 * Optimize pen stroke path for performance
 * Uses Douglas-Peucker algorithm with smart tolerance adjustment
 */
export function optimizePenPath(
  points: number[], 
  options: Partial<PathOptimizationOptions> = {}
): number[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (points.length <= 4) return points; // Too short to optimize
  
  // Convert to Point objects for easier manipulation
  const pointObjects = pointsArrayToPoints(points);
  
  // Limit maximum points for very long paths
  if (points.length > opts.maxPoints) {
    // Use aggressive simplification for very long paths
    const aggressiveTolerance = opts.tolerance * 2;
    const simplified = douglasPeucker(pointObjects, aggressiveTolerance);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `PathOptimizer: Aggressive simplification applied. Points: ${points.length} → ${simplified.length * 2}`
      );
    }
    
    return pointsToPointsArray(simplified);
  }
  
  // Apply Douglas-Peucker algorithm
  const optimized = douglasPeucker(pointObjects, opts.tolerance);
  
  // Warn if significant simplification occurred
  if (process.env.NODE_ENV === 'development') {
    const originalLength = points.length;
    const optimizedLength = optimized.length * 2;
    const reduction = (originalLength - optimizedLength) / originalLength;
    
    if (originalLength > 1000 && reduction > 0.5) {
      console.warn(
        `PathOptimizer: Significant simplification - ${originalLength} → ${optimizedLength} points (${Math.round(reduction * 100)}% reduction)`
      );
    }
  }
  
  return pointsToPointsArray(optimized);
}

/**
 * Complete pen stroke and optimize it for storage/rendering
 */
export function completePenStroke(
  points: number[],
  options: Partial<PathOptimizationOptions> = {}
): number[] {
  const optimized = optimizePenPath(points, options);
  
  // Additional post-processing could go here:
  // - Remove consecutive duplicate points
  // - Apply smoothing
  // - Validate point integrity
  
  return optimized;
}

/**
 * Adaptive tolerance calculation based on drawing context
 */
export function calculateAdaptiveTolerance(
  points: number[],
  canvasZoom: number = 1,
  elementSize?: { width: number; height: number }
): number {
  // Base tolerance
  let tolerance = 1;
  
  // Adjust for zoom level - higher zoom needs higher precision
  tolerance = tolerance / Math.max(canvasZoom, 0.1);
  
  // Adjust for drawing size - larger drawings can tolerate more simplification
  if (elementSize) {
    const avgSize = (elementSize.width + elementSize.height) / 2;
    if (avgSize > 500) {
      tolerance *= 1.5; // Allow more simplification for large drawings
    } else if (avgSize < 100) {
      tolerance *= 0.5; // Preserve detail for small drawings
    }
  }
  
  // Adjust for path complexity - more points = more aggressive simplification
  if (points.length > 5000) {
    tolerance *= 2;
  } else if (points.length > 2000) {
    tolerance *= 1.5;
  }
  
  return Math.max(tolerance, 0.1); // Never go below minimum threshold
}

/**
 * Smart path optimization that considers drawing context
 */
export function smartOptimizePenPath(
  points: number[],
  context: {
    zoom?: number;
    elementSize?: { width: number; height: number };
    isRealTimeDrawing?: boolean;
  } = {}
): number[] {
  const { zoom = 1, elementSize, isRealTimeDrawing = false } = context;
  
  // Use adaptive tolerance
  const tolerance = calculateAdaptiveTolerance(points, zoom, elementSize);
  
  // For real-time drawing, use less aggressive optimization
  const adjustedTolerance = isRealTimeDrawing ? tolerance * 0.5 : tolerance;
  
  return optimizePenPath(points, {
    tolerance: adjustedTolerance,
    preserveDetail: !isRealTimeDrawing
  });
}

export default {
  optimizePenPath,
  completePenStroke,
  smartOptimizePenPath,
  douglasPeucker,
  calculateAdaptiveTolerance
};
