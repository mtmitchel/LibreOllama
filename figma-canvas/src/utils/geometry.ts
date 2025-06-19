import { Point, Bounds, CanvasElement } from '../types/canvas';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

// Basic point operations
export const pointDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const pointAdd = (p1: Point, p2: Point): Point => ({
  x: p1.x + p2.x,
  y: p1.y + p2.y
});

export const pointSubtract = (p1: Point, p2: Point): Point => ({
  x: p1.x - p2.x,
  y: p1.y - p2.y
});

export const pointMultiply = (p: Point, scalar: number): Point => ({
  x: p.x * scalar,
  y: p.y * scalar
});

export const pointDivide = (p: Point, scalar: number): Point => ({
  x: p.x / scalar,
  y: p.y / scalar
});

export const pointNormalize = (p: Point): Point => {
  const length = Math.sqrt(p.x * p.x + p.y * p.y);
  return length > 0 ? { x: p.x / length, y: p.y / length } : { x: 0, y: 0 };
};

export const pointDot = (p1: Point, p2: Point): number => {
  return p1.x * p2.x + p1.y * p2.y;
};

export const pointCross = (p1: Point, p2: Point): number => {
  return p1.x * p2.y - p1.y * p2.x;
};

export const pointRotate = (p: Point, angle: number, origin: Point = { x: 0, y: 0 }): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos
  };
};

export const pointEquals = (p1: Point, p2: Point, tolerance = 1e-10): boolean => {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
};

// Bounds operations
export const boundsFromPoints = (points: Point[]): Bounds => {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  
  for (let i = 1; i < points.length; i++) {
    minX = Math.min(minX, points[i].x);
    minY = Math.min(minY, points[i].y);
    maxX = Math.max(maxX, points[i].x);
    maxY = Math.max(maxY, points[i].y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

export const boundsContainsPoint = (bounds: Bounds, point: Point): boolean => {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
};

export const boundsIntersects = (bounds1: Bounds, bounds2: Bounds): boolean => {
  return !(
    bounds1.x + bounds1.width < bounds2.x ||
    bounds2.x + bounds2.width < bounds1.x ||
    bounds1.y + bounds1.height < bounds2.y ||
    bounds2.y + bounds2.height < bounds1.y
  );
};

export const boundsUnion = (bounds1: Bounds, bounds2: Bounds): Bounds => {
  const x = Math.min(bounds1.x, bounds2.x);
  const y = Math.min(bounds1.y, bounds2.y);
  const maxX = Math.max(bounds1.x + bounds1.width, bounds2.x + bounds2.width);
  const maxY = Math.max(bounds1.y + bounds1.height, bounds2.y + bounds2.height);
  
  return {
    x,
    y,
    width: maxX - x,
    height: maxY - y
  };
};

export const boundsIntersection = (bounds1: Bounds, bounds2: Bounds): Bounds | null => {
  if (!boundsIntersects(bounds1, bounds2)) {
    return null;
  }
  
  const x = Math.max(bounds1.x, bounds2.x);
  const y = Math.max(bounds1.y, bounds2.y);
  const maxX = Math.min(bounds1.x + bounds1.width, bounds2.x + bounds2.width);
  const maxY = Math.min(bounds1.y + bounds1.height, bounds2.y + bounds2.height);
  
  return {
    x,
    y,
    width: maxX - x,
    height: maxY - y
  };
};

export const boundsExpand = (bounds: Bounds, amount: number): Bounds => ({
  x: bounds.x - amount,
  y: bounds.y - amount,
  width: bounds.width + amount * 2,
  height: bounds.height + amount * 2
});

export const boundsCenter = (bounds: Bounds): Point => ({
  x: bounds.x + bounds.width / 2,
  y: bounds.y + bounds.height / 2
});

// Line operations
export const lineIntersection = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null => {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  
  if (Math.abs(denom) < 1e-10) {
    return null; // Lines are parallel
  }
  
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  };
};

export const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return pointDistance(point, lineStart);
  }
  
  let param = dot / lenSq;
  
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
};

export const pointOnLineSegment = (
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  tolerance = 5
): boolean => {
  return pointToLineDistance(point, lineStart, lineEnd) <= tolerance;
};

// Circle operations
export const pointInCircle = (point: Point, center: Point, radius: number): boolean => {
  return pointDistance(point, center) <= radius;
};

export const circleIntersectsRect = (
  center: Point,
  radius: number,
  rect: Bounds
): boolean => {
  const dx = Math.max(0, Math.max(rect.x - center.x, center.x - (rect.x + rect.width)));
  const dy = Math.max(0, Math.max(rect.y - center.y, center.y - (rect.y + rect.height)));
  return (dx * dx + dy * dy) <= (radius * radius);
};

// Polygon operations
export const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      ((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
      (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)
    ) {
      inside = !inside;
    }
  }
  
  return inside;
};

export const polygonBounds = (polygon: Point[]): Bounds => {
  return boundsFromPoints(polygon);
};

// Curve operations
export const bezierPoint = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
  const u = 1 - t;
  const t2 = t * t;
  const u2 = u * u;
  const t3 = t2 * t;
  const u3 = u2 * u;
  
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y
  };
};

export const quadraticBezierPoint = (t: number, p0: Point, p1: Point, p2: Point): Point => {
  const u = 1 - t;
  const t2 = t * t;
  const u2 = u * u;
  
  return {
    x: u2 * p0.x + 2 * u * t * p1.x + t2 * p2.x,
    y: u2 * p0.y + 2 * u * t * p1.y + t2 * p2.y
  };
};

export const bezierLength = (p0: Point, p1: Point, p2: Point, p3: Point, steps = 100): number => {
  let length = 0;
  let prevPoint = p0;
  
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const currentPoint = bezierPoint(t, p0, p1, p2, p3);
    length += pointDistance(prevPoint, currentPoint);
    prevPoint = currentPoint;
  }
  
  return length;
};

// Transformation matrix operations
export const createTransformMatrix = (
  x = 0,
  y = 0,
  scaleX = 1,
  scaleY = 1,
  rotation = 0,
  skewX = 0,
  skewY = 0
): Matrix2D => {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const tanX = Math.tan(skewX);
  const tanY = Math.tan(skewY);
  
  return {
    a: scaleX * cos + tanY * scaleY * sin,
    b: scaleX * sin - tanY * scaleY * cos,
    c: -tanX * scaleX * cos + scaleY * sin,
    d: -tanX * scaleX * sin + scaleY * cos,
    e: x,
    f: y
  };
};

export const transformPoint = (point: Point, matrix: Matrix2D): Point => ({
  x: matrix.a * point.x + matrix.c * point.y + matrix.e,
  y: matrix.b * point.x + matrix.d * point.y + matrix.f
});

export const multiplyMatrices = (m1: Matrix2D, m2: Matrix2D): Matrix2D => ({
  a: m1.a * m2.a + m1.b * m2.c,
  b: m1.a * m2.b + m1.b * m2.d,
  c: m1.c * m2.a + m1.d * m2.c,
  d: m1.c * m2.b + m1.d * m2.d,
  e: m1.e * m2.a + m1.f * m2.c + m2.e,
  f: m1.e * m2.b + m1.f * m2.d + m2.f
});

export const invertMatrix = (matrix: Matrix2D): Matrix2D | null => {
  const det = matrix.a * matrix.d - matrix.b * matrix.c;
  
  if (Math.abs(det) < 1e-10) {
    return null; // Matrix is not invertible
  }
  
  return {
    a: matrix.d / det,
    b: -matrix.b / det,
    c: -matrix.c / det,
    d: matrix.a / det,
    e: (matrix.c * matrix.f - matrix.d * matrix.e) / det,
    f: (matrix.b * matrix.e - matrix.a * matrix.f) / det
  };
};

// Snapping utilities
export const snapToGrid = (point: Point, gridSize: number): Point => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize
});

export const snapToAngle = (
  startPoint: Point,
  currentPoint: Point,
  snapAngles = [0, 45, 90, 135, 180, 225, 270, 315]
): Point => {
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return currentPoint;
  
  let currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (currentAngle < 0) currentAngle += 360;
  
  let closestAngle = snapAngles[0];
  let minDifference = Math.abs(currentAngle - snapAngles[0]);
  
  for (const angle of snapAngles) {
    const difference = Math.min(
      Math.abs(currentAngle - angle),
      Math.abs(currentAngle - angle - 360),
      Math.abs(currentAngle - angle + 360)
    );
    
    if (difference < minDifference) {
      minDifference = difference;
      closestAngle = angle;
    }
  }
  
  const radians = closestAngle * (Math.PI / 180);
  return {
    x: startPoint.x + length * Math.cos(radians),
    y: startPoint.y + length * Math.sin(radians)
  };
};

// Element bounds utilities
export const getElementBounds = (element: CanvasElement): Bounds => {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height
  };
};

export const getElementCenter = (element: CanvasElement): Point => {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2
  };
};

export const getElementCorners = (element: CanvasElement): Point[] => {
  const bounds = getElementBounds(element);
  return [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height }
  ];
};

export const getRotatedElementBounds = (element: CanvasElement): Bounds => {
  if (element.rotation === 0) {
    return getElementBounds(element);
  }
  
  const center = getElementCenter(element);
  const corners = getElementCorners(element);
  const rotatedCorners = corners.map(corner => 
    pointRotate(corner, element.rotation, center)
  );
  
  return boundsFromPoints(rotatedCorners);
};

// Utility for smooth curves
export const smoothPath = (points: Point[], tension = 0.5): Point[] => {
  if (points.length < 3) return points;
  
  const smoothed: Point[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    const cp1 = {
      x: curr.x - tension * (next.x - prev.x) / 6,
      y: curr.y - tension * (next.y - prev.y) / 6
    };
    
    const cp2 = {
      x: curr.x + tension * (next.x - prev.x) / 6,
      y: curr.y + tension * (next.y - prev.y) / 6
    };
    
    // Add multiple points along the curve for smoother rendering
    for (let t = 0; t <= 1; t += 0.1) {
      const point = quadraticBezierPoint(t, prev, cp1, curr);
      smoothed.push(point);
    }
  }
  
  smoothed.push(points[points.length - 1]);
  return smoothed;
};
