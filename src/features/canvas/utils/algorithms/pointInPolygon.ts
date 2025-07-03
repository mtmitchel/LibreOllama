/**
 * Point-in-Polygon Algorithm
 * Used for lasso selection and complex shape intersection testing
 */

export type Point = [number, number];
export type Polygon = Point[];

/**
 * Ray casting algorithm to determine if a point is inside a polygon
 * Uses the even-odd rule (odd number of crossings = inside)
 */
export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    // Check if ray crosses the edge
    if (((yi > y) !== (yj > y)) && 
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Winding number algorithm (alternative to ray casting)
 * More accurate for complex polygons with holes
 */
export function pointInPolygonWinding(point: Point, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  
  const [px, py] = point;
  let wn = 0; // Winding number
  
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    
    if (y1 <= py) {
      if (y2 > py) { // Upward crossing
        if (isLeft(x1, y1, x2, y2, px, py) > 0) {
          wn++;
        }
      }
    } else {
      if (y2 <= py) { // Downward crossing
        if (isLeft(x1, y1, x2, y2, px, py) < 0) {
          wn--;
        }
      }
    }
  }
  
  return wn !== 0;
}

/**
 * Test if point is left|on|right of an infinite line
 * Returns: >0 for point left of line, =0 for on line, <0 for right of line
 */
function isLeft(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number {
  return ((x2 - x1) * (py - y1) - (px - x1) * (y2 - y1));
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(point: Point, center: Point, radius: number): boolean {
  const [px, py] = point;
  const [cx, cy] = center;
  const distanceSquared = (px - cx) * (px - cx) + (py - cy) * (py - cy);
  return distanceSquared <= radius * radius;
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRectangle(
  point: Point, 
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const [px, py] = point;
  return px >= rect.x && 
         px <= rect.x + rect.width && 
         py >= rect.y && 
         py <= rect.y + rect.height;
}

/**
 * Check if a point is inside an ellipse
 */
export function pointInEllipse(
  point: Point,
  center: Point,
  radiusX: number,
  radiusY: number,
  rotation: number = 0
): boolean {
  const [px, py] = point;
  const [cx, cy] = center;
  
  // Translate to origin
  let dx = px - cx;
  let dy = py - cy;
  
  // Rotate if necessary
  if (rotation !== 0) {
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const newDx = dx * cos - dy * sin;
    const newDy = dx * sin + dy * cos;
    dx = newDx;
    dy = newDy;
  }
  
  // Check ellipse equation
  return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
}

/**
 * Get multiple check points for complex shapes
 * Used to test if a shape intersects with a polygon
 * ENHANCED: Complete element type coverage for eraser tool
 */
export function getShapeCheckPoints(element: any): Point[] {
  const points: Point[] = [];
  
  // Always include center point for all elements
  const centerX = element.x + (element.width || 0) / 2;
  const centerY = element.y + (element.height || 0) / 2;
  points.push([centerX, centerY]);
  
  // Handle different element types with specific geometry
  switch (element.type) {
    case 'rectangle':
    case 'sticky-note':
    case 'text':
    case 'image':
    case 'table':
    case 'section':
      // Rectangular elements: corners and edge midpoints
      if (element.width && element.height) {
        const { x, y, width, height } = element;
        
        // All corners
        points.push([x, y]);
        points.push([x + width, y]);
        points.push([x, y + height]);
        points.push([x + width, y + height]);
        
        // Edge midpoints for better detection
        points.push([x + width / 2, y]);
        points.push([x + width, y + height / 2]);
        points.push([x + width / 2, y + height]);
        points.push([x, y + height / 2]);
        
        // Quarter points for higher accuracy
        points.push([x + width / 4, y + height / 4]);
        points.push([x + 3 * width / 4, y + height / 4]);
        points.push([x + width / 4, y + 3 * height / 4]);
        points.push([x + 3 * width / 4, y + 3 * height / 4]);
      }
      break;
      
    case 'circle':
      // Circular elements: sample points around circumference
      if (element.radius) {
        const { x, y, radius } = element;
        
        // Sample points around the circle (every 30 degrees)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
          points.push([
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius
          ]);
        }
        
        // Add points at different radii for better coverage
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          points.push([
            x + Math.cos(angle) * radius * 0.7,
            y + Math.sin(angle) * radius * 0.7
          ]);
        }
      }
      break;
      
    case 'triangle':
      // Triangle elements: use actual triangle points
      if (element.points && Array.isArray(element.points) && element.points.length >= 6) {
        // Extract triangle vertices
        const vertices = [];
        for (let i = 0; i < element.points.length; i += 2) {
          if (i + 1 < element.points.length) {
            vertices.push([element.points[i], element.points[i + 1]]);
          }
        }
        
        // Add all vertices
        points.push(...vertices);
        
        // Add edge midpoints
        for (let i = 0; i < vertices.length; i++) {
          const next = (i + 1) % vertices.length;
          const midX = (vertices[i][0] + vertices[next][0]) / 2;
          const midY = (vertices[i][1] + vertices[next][1]) / 2;
          points.push([midX, midY]);
        }
      } else if (element.width && element.height) {
        // Fallback for triangle without explicit points
        const { x, y, width, height } = element;
        // Standard triangle: top center, bottom left, bottom right
        points.push([x + width / 2, y]); // Top
        points.push([x, y + height]); // Bottom left
        points.push([x + width, y + height]); // Bottom right
        
        // Add edge midpoints
        points.push([x + width / 4, y + height / 2]); // Left edge
        points.push([x + 3 * width / 4, y + height / 2]); // Right edge
        points.push([x + width / 2, y + height]); // Bottom edge
      }
      break;
      
    case 'star':
      // Star elements: sample points around star shape
      if (element.innerRadius && element.outerRadius && element.numPoints) {
        const { x, y, innerRadius, outerRadius, numPoints } = element;
        const angleStep = (Math.PI * 2) / numPoints;
        
        // Add outer points
        for (let i = 0; i < numPoints; i++) {
          const angle = i * angleStep;
          points.push([
            x + Math.cos(angle) * outerRadius,
            y + Math.sin(angle) * outerRadius
          ]);
        }
        
        // Add inner points
        for (let i = 0; i < numPoints; i++) {
          const angle = i * angleStep + angleStep / 2;
          points.push([
            x + Math.cos(angle) * innerRadius,
            y + Math.sin(angle) * innerRadius
          ]);
        }
      }
      break;
      
    case 'connector':
      // Connector elements: sample points along the path
      if (element.startPoint && element.endPoint) {
        points.push([element.startPoint.x, element.startPoint.y]);
        points.push([element.endPoint.x, element.endPoint.y]);
        
        // Add intermediate points if they exist
        if (element.intermediatePoints) {
          element.intermediatePoints.forEach((point: any) => {
            points.push([point.x, point.y]);
          });
        }
        
        // Sample points along the line for better detection
        const dx = element.endPoint.x - element.startPoint.x;
        const dy = element.endPoint.y - element.startPoint.y;
        const steps = Math.max(5, Math.floor(Math.sqrt(dx * dx + dy * dy) / 20));
        
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          points.push([
            element.startPoint.x + dx * t,
            element.startPoint.y + dy * t
          ]);
        }
      }
      
      // Also handle path points if available
      if (element.pathPoints && Array.isArray(element.pathPoints)) {
        for (let i = 0; i < element.pathPoints.length; i += 2) {
          if (i + 1 < element.pathPoints.length) {
            points.push([element.pathPoints[i], element.pathPoints[i + 1]]);
          }
        }
      }
      break;
      
    case 'pen':
    case 'marker':
    case 'highlighter':
      // Stroke elements: sample points along the path
      if (element.points && Array.isArray(element.points)) {
        // Sample every few points to avoid performance issues but ensure coverage
        const sampleRate = Math.max(2, Math.floor(element.points.length / 40));
        for (let i = 0; i < element.points.length; i += sampleRate * 2) {
          if (i + 1 < element.points.length) {
            points.push([element.points[i], element.points[i + 1]]);
          }
        }
        
        // Always include start and end points
        if (element.points.length >= 4) {
          points.push([element.points[0], element.points[1]]);
          points.push([element.points[element.points.length - 2], element.points[element.points.length - 1]]);
        }
      }
      break;
      
    default:
      // Generic fallback for unknown element types
      if (element.points && Array.isArray(element.points)) {
        // Handle as stroke element
        for (let i = 0; i < element.points.length; i += 20) {
          if (i + 1 < element.points.length) {
            points.push([element.points[i], element.points[i + 1]]);
          }
        }
      } else if (element.width && element.height) {
        // Handle as rectangular element
        const { x, y, width, height } = element;
        points.push([x, y]);
        points.push([x + width, y]);
        points.push([x, y + height]);
        points.push([x + width, y + height]);
      } else if (element.radius) {
        // Handle as circular element
        const { x, y, radius } = element;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          points.push([
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius
          ]);
        }
      }
      break;
  }
  
  // Remove duplicate points for performance
  const uniquePoints = points.filter((point, index, arr) => {
    return !arr.slice(0, index).some(p => 
      Math.abs(p[0] - point[0]) < 0.1 && Math.abs(p[1] - point[1]) < 0.1
    );
  });
  
  return uniquePoints;
}

/**
 * Check if any part of a shape is inside a polygon
 * Uses multiple sample points for accurate detection
 */
export function shapeIntersectsPolygon(element: any, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  
  const checkPoints = getShapeCheckPoints(element);
  
  // If any check point is inside the polygon, the shape intersects
  return checkPoints.some(point => pointInPolygon(point, polygon));
}

/**
 * Create a polygon from a lasso path (array of x,y coordinates)
 */
export function pathToPolygon(path: number[]): Polygon {
  const polygon: Polygon = [];
  
  for (let i = 0; i < path.length; i += 2) {
    if (i + 1 < path.length) {
      polygon.push([path[i], path[i + 1]]);
    }
  }
  
  return polygon;
}

/**
 * Simplify a polygon by removing redundant points
 * Uses Douglas-Peucker algorithm
 */
export function simplifyPolygon(polygon: Polygon, tolerance: number = 2): Polygon {
  if (polygon.length <= 2) return polygon;
  
  return douglasPeuckerPolygon(polygon, 0, polygon.length - 1, tolerance);
}

function douglasPeuckerPolygon(
  polygon: Polygon, 
  start: number, 
  end: number, 
  tolerance: number
): Polygon {
  if (end - start <= 1) {
    return [polygon[start], polygon[end]];
  }
  
  // Find the point with maximum distance from line
  let maxDistance = 0;
  let maxIndex = start;
  
  for (let i = start + 1; i < end; i++) {
    const distance = pointToLineDistance2D(polygon[i], polygon[start], polygon[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = douglasPeuckerPolygon(polygon, start, maxIndex, tolerance);
    const right = douglasPeuckerPolygon(polygon, maxIndex, end, tolerance);
    
    // Combine results (remove duplicate point at junction)
    return [...left.slice(0, -1), ...right];
  }
  
  // Otherwise, just return endpoints
  return [polygon[start], polygon[end]];
}

/**
 * Calculate perpendicular distance from point to line
 */
function pointToLineDistance2D(point: Point, lineStart: Point, lineEnd: Point): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return Math.hypot(A, B);
  }
  
  const param = dot / lenSq;
  
  let closestX, closestY;
  
  if (param < 0) {
    closestX = x1;
    closestY = y1;
  } else if (param > 1) {
    closestX = x2;
    closestY = y2;
  } else {
    closestX = x1 + param * C;
    closestY = y1 + param * D;
  }
  
  return Math.hypot(px - closestX, py - closestY);
}

/**
 * Calculate the area of a polygon
 * Uses the shoelace formula
 */
export function polygonArea(polygon: Polygon): number {
  if (polygon.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculate the centroid of a polygon
 */
export function polygonCentroid(polygon: Polygon): Point {
  if (polygon.length === 0) return [0, 0];
  if (polygon.length === 1) return polygon[0];
  
  const area = polygonArea(polygon);
  if (area === 0) {
    // Fallback to simple average for degenerate polygons
    const sumX = polygon.reduce((sum, point) => sum + point[0], 0);
    const sumY = polygon.reduce((sum, point) => sum + point[1], 0);
    return [sumX / polygon.length, sumY / polygon.length];
  }
  
  let cx = 0;
  let cy = 0;
  
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const factor = polygon[i][0] * polygon[j][1] - polygon[j][0] * polygon[i][1];
    cx += (polygon[i][0] + polygon[j][0]) * factor;
    cy += (polygon[i][1] + polygon[j][1]) * factor;
  }
  
  const sixArea = 6 * area;
  return [cx / sixArea, cy / sixArea];
} 