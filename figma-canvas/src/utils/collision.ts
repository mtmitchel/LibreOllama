import { Point, Bounds, CanvasElement, ElementType } from '../types/canvas';
import { 
  pointDistance, 
  boundsContainsPoint, 
  boundsIntersects, 
  pointInCircle, 
  pointOnLineSegment, 
  pointInPolygon,
  getElementBounds,
  getElementCenter,
  getRotatedElementBounds,
  pointToLineDistance,
  transformPoint,
  createTransformMatrix
} from './geometry';

export interface HitTestResult {
  hit: boolean;
  element?: CanvasElement;
  distance: number;
  point: Point;
  elementPoint: Point;
}

export interface CollisionResult {
  hasCollision: boolean;
  elements: CanvasElement[];
  penetrationDepth?: number;
  contactPoint?: Point;
  normal?: Point;
}

// Spatial partitioning for performance optimization
export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Set<string>>;
  private elements: Map<string, CanvasElement>;

  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.elements = new Map();
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private getCellsForBounds(bounds: Bounds): string[] {
    const startX = Math.floor(bounds.x / this.cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const startY = Math.floor(bounds.y / this.cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    const keys: string[] = [];
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  addElement(element: CanvasElement): void {
    this.removeElement(element.id);
    
    const bounds = getRotatedElementBounds(element);
    const cellKeys = this.getCellsForBounds(bounds);
    
    this.elements.set(element.id, element);
    
    cellKeys.forEach(key => {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(element.id);
    });
  }

  removeElement(elementId: string): void {
    const element = this.elements.get(elementId);
    if (!element) return;

    const bounds = getRotatedElementBounds(element);
    const cellKeys = this.getCellsForBounds(bounds);
    
    cellKeys.forEach(key => {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(elementId);
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
    });
    
    this.elements.delete(elementId);
  }

  updateElement(element: CanvasElement): void {
    this.addElement(element);
  }

  query(bounds: Bounds): CanvasElement[] {
    const cellKeys = this.getCellsForBounds(bounds);
    const elementIds = new Set<string>();
    
    cellKeys.forEach(key => {
      const cell = this.grid.get(key);
      if (cell) {
        cell.forEach(id => elementIds.add(id));
      }
    });
    
    return Array.from(elementIds)
      .map(id => this.elements.get(id))
      .filter(Boolean) as CanvasElement[];
  }

  queryPoint(point: Point): CanvasElement[] {
    const cellKey = this.getCellKey(point.x, point.y);
    const cell = this.grid.get(cellKey);
    
    if (!cell) return [];
    
    return Array.from(cell)
      .map(id => this.elements.get(id))
      .filter(Boolean) as CanvasElement[];
  }

  clear(): void {
    this.grid.clear();
    this.elements.clear();
  }

  size(): number {
    return this.elements.size;
  }
}

// Hit testing for different element types
export const hitTestElement = (element: CanvasElement, point: Point): HitTestResult => {
  const elementBounds = getElementBounds(element);
  const center = getElementCenter(element);
  const distance = pointDistance(point, center);
  
  // Transform point to element's local space if rotated
  let localPoint = point;
  if (element.rotation !== 0) {
    const matrix = createTransformMatrix(
      -element.x,
      -element.y,
      1,
      1,
      -element.rotation
    );
    localPoint = transformPoint(
      { x: point.x - element.x, y: point.y - element.y },
      matrix
    );
    localPoint = { x: localPoint.x + element.x, y: localPoint.y + element.y };
  }

  let hit = false;

  switch (element.type) {
    case ElementType.RECTANGLE:
    case ElementType.TEXT:
    case ElementType.STICKY_NOTE:
    case ElementType.TABLE:
    case ElementType.IMAGE:
    case ElementType.SECTION:
    case ElementType.FRAME:
      hit = boundsContainsPoint(elementBounds, localPoint);
      break;

    case ElementType.CIRCLE:
      const radius = Math.min(element.width, element.height) / 2;
      hit = pointInCircle(localPoint, center, radius);
      break;

    case ElementType.TRIANGLE:
      hit = hitTestTriangle(element, localPoint);
      break;

    case ElementType.LINE:
      hit = hitTestLine(element, localPoint);
      break;

    case ElementType.ARROW:
      hit = hitTestArrow(element, localPoint);
      break;

    case ElementType.CONNECTOR:
      hit = hitTestConnector(element, localPoint);
      break;

    case ElementType.FREEFORM:
      hit = hitTestFreeform(element, localPoint);
      break;

    case ElementType.CUSTOM_SHAPE:
      hit = hitTestCustomShape(element, localPoint);
      break;

    default:
      hit = boundsContainsPoint(elementBounds, localPoint);
  }

  return {
    hit,
    element: hit ? element : undefined,
    distance,
    point,
    elementPoint: center
  };
};

// Specific hit test implementations
const hitTestTriangle = (element: CanvasElement, point: Point): boolean => {
  const bounds = getElementBounds(element);
  const vertices: Point[] = [
    { x: bounds.x + bounds.width / 2, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
  ];
  
  return pointInPolygon(point, vertices);
};

const hitTestLine = (element: CanvasElement, point: Point): boolean => {
  const data = element.data as any;
  if (!data.points || data.points.length < 2) return false;
  
  const tolerance = Math.max(5, (data.strokeWidth || 2) + 3);
  
  for (let i = 0; i < data.points.length - 1; i++) {
    const start = data.points[i];
    const end = data.points[i + 1];
    
    if (pointOnLineSegment(point, start, end, tolerance)) {
      return true;
    }
  }
  
  return false;
};

const hitTestArrow = (element: CanvasElement, point: Point): boolean => {
  const data = element.data as any;
  const startPoint = data.startPoint || { x: element.x, y: element.y };
  const endPoint = data.endPoint || { x: element.x + element.width, y: element.y + element.height };
  
  const tolerance = Math.max(5, (data.strokeWidth || 2) + 3);
  return pointOnLineSegment(point, startPoint, endPoint, tolerance);
};

const hitTestConnector = (element: CanvasElement, point: Point): boolean => {
  const data = element.data as any;
  if (!data.points || data.points.length < 2) return false;
  
  const tolerance = Math.max(5, (data.strokeWidth || 2) + 3);
  
  for (let i = 0; i < data.points.length - 1; i++) {
    const start = data.points[i];
    const end = data.points[i + 1];
    
    if (pointOnLineSegment(point, start, end, tolerance)) {
      return true;
    }
  }
  
  return false;
};

const hitTestFreeform = (element: CanvasElement, point: Point): boolean => {
  const data = element.data as any;
  if (!data.points || data.points.length === 0) return false;
  
  const tolerance = Math.max(5, (data.strokeWidth || 2) + 3);
  
  // Test if point is close to any point in the freeform path
  for (const pathPoint of data.points) {
    if (pointDistance(point, pathPoint) <= tolerance) {
      return true;
    }
  }
  
  // Test line segments for more accurate hit detection
  for (let i = 0; i < data.points.length - 1; i++) {
    const start = data.points[i];
    const end = data.points[i + 1];
    
    if (pointToLineDistance(point, start, end) <= tolerance) {
      return true;
    }
  }
  
  return false;
};

const hitTestCustomShape = (element: CanvasElement, point: Point): boolean => {
  // For custom shapes, we'll use bounds testing as a fallback
  // In a real implementation, you'd parse the SVG path data
  return boundsContainsPoint(getElementBounds(element), point);
};

// Multi-element hit testing
export const hitTestMultiple = (
  elements: CanvasElement[],
  point: Point,
  maxResults = 10
): HitTestResult[] => {
  const results: HitTestResult[] = [];
  
  for (const element of elements) {
    if (!element.visible) continue;
    
    const result = hitTestElement(element, point);
    if (result.hit) {
      results.push(result);
    }
    
    if (results.length >= maxResults) break;
  }
  
  // Sort by z-index (higher z-index first) then by distance
  return results.sort((a, b) => {
    const zDiff = (b.element?.zIndex || 0) - (a.element?.zIndex || 0);
    return zDiff !== 0 ? zDiff : a.distance - b.distance;
  });
};

// Area selection
export const selectElementsInArea = (
  elements: CanvasElement[],
  selectionBounds: Bounds,
  mode: 'intersect' | 'contain' = 'intersect'
): CanvasElement[] => {
  return elements.filter(element => {
    if (!element.visible) return false;
    
    const elementBounds = getRotatedElementBounds(element);
    
    if (mode === 'contain') {
      return (
        elementBounds.x >= selectionBounds.x &&
        elementBounds.y >= selectionBounds.y &&
        elementBounds.x + elementBounds.width <= selectionBounds.x + selectionBounds.width &&
        elementBounds.y + elementBounds.height <= selectionBounds.y + selectionBounds.height
      );
    } else {
      return boundsIntersects(elementBounds, selectionBounds);
    }
  });
};

// Collision detection between elements
export const detectCollisions = (
  elements: CanvasElement[],
  movingElement: CanvasElement,
  newBounds: Bounds
): CollisionResult => {
  const collisions: CanvasElement[] = [];
  
  for (const element of elements) {
    if (element.id === movingElement.id || !element.visible) continue;
    
    const elementBounds = getRotatedElementBounds(element);
    
    if (boundsIntersects(newBounds, elementBounds)) {
      collisions.push(element);
    }
  }
  
  return {
    hasCollision: collisions.length > 0,
    elements: collisions
  };
};

// Snap to elements (alignment guides)
export const findSnapTargets = (
  elements: CanvasElement[],
  movingElement: CanvasElement,
  newBounds: Bounds,
  snapDistance = 10
): { x?: number; y?: number; guides: SnapGuide[] } => {
  const guides: SnapGuide[] = [];
  let snapX: number | undefined;
  let snapY: number | undefined;
  
  const movingCenter = {
    x: newBounds.x + newBounds.width / 2,
    y: newBounds.y + newBounds.height / 2
  };
  
  for (const element of elements) {
    if (element.id === movingElement.id || !element.visible) continue;
    
    const elementBounds = getRotatedElementBounds(element);
    const elementCenter = {
      x: elementBounds.x + elementBounds.width / 2,
      y: elementBounds.y + elementBounds.height / 2
    };
    
    // Horizontal alignment
    const centerXDiff = Math.abs(movingCenter.x - elementCenter.x);
    const leftXDiff = Math.abs(newBounds.x - elementBounds.x);
    const rightXDiff = Math.abs(newBounds.x + newBounds.width - elementBounds.x - elementBounds.width);
    
    if (centerXDiff <= snapDistance) {
      snapX = elementCenter.x - newBounds.width / 2;
      guides.push({
        type: 'center-vertical',
        x: elementCenter.x,
        y1: Math.min(newBounds.y, elementBounds.y),
        y2: Math.max(newBounds.y + newBounds.height, elementBounds.y + elementBounds.height)
      });
    } else if (leftXDiff <= snapDistance) {
      snapX = elementBounds.x;
      guides.push({
        type: 'edge-vertical',
        x: elementBounds.x,
        y1: Math.min(newBounds.y, elementBounds.y),
        y2: Math.max(newBounds.y + newBounds.height, elementBounds.y + elementBounds.height)
      });
    } else if (rightXDiff <= snapDistance) {
      snapX = elementBounds.x + elementBounds.width - newBounds.width;
      guides.push({
        type: 'edge-vertical',
        x: elementBounds.x + elementBounds.width,
        y1: Math.min(newBounds.y, elementBounds.y),
        y2: Math.max(newBounds.y + newBounds.height, elementBounds.y + elementBounds.height)
      });
    }
    
    // Vertical alignment
    const centerYDiff = Math.abs(movingCenter.y - elementCenter.y);
    const topYDiff = Math.abs(newBounds.y - elementBounds.y);
    const bottomYDiff = Math.abs(newBounds.y + newBounds.height - elementBounds.y - elementBounds.height);
    
    if (centerYDiff <= snapDistance) {
      snapY = elementCenter.y - newBounds.height / 2;
      guides.push({
        type: 'center-horizontal',
        y: elementCenter.y,
        x1: Math.min(newBounds.x, elementBounds.x),
        x2: Math.max(newBounds.x + newBounds.width, elementBounds.x + elementBounds.width)
      });
    } else if (topYDiff <= snapDistance) {
      snapY = elementBounds.y;
      guides.push({
        type: 'edge-horizontal',
        y: elementBounds.y,
        x1: Math.min(newBounds.x, elementBounds.x),
        x2: Math.max(newBounds.x + newBounds.width, elementBounds.x + elementBounds.width)
      });
    } else if (bottomYDiff <= snapDistance) {
      snapY = elementBounds.y + elementBounds.height - newBounds.height;
      guides.push({
        type: 'edge-horizontal',
        y: elementBounds.y + elementBounds.height,
        x1: Math.min(newBounds.x, elementBounds.x),
        x2: Math.max(newBounds.x + newBounds.width, elementBounds.x + elementBounds.width)
      });
    }
  }
  
  return { x: snapX, y: snapY, guides };
};

export interface SnapGuide {
  type: 'center-horizontal' | 'center-vertical' | 'edge-horizontal' | 'edge-vertical';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

// Connection point detection for connectors
export const findConnectionPoints = (
  element: CanvasElement,
  searchPoint: Point,
  maxDistance = 20
): ConnectionPoint[] => {
  const bounds = getElementBounds(element);
  const connectionPoints: ConnectionPoint[] = [
    {
      id: `${element.id}-top`,
      x: bounds.x + bounds.width / 2,
      y: bounds.y,
      direction: 'top',
      elementId: element.id
    },
    {
      id: `${element.id}-right`,
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height / 2,
      direction: 'right',
      elementId: element.id
    },
    {
      id: `${element.id}-bottom`,
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height,
      direction: 'bottom',
      elementId: element.id
    },
    {
      id: `${element.id}-left`,
      x: bounds.x,
      y: bounds.y + bounds.height / 2,
      direction: 'left',
      elementId: element.id
    },
    {
      id: `${element.id}-center`,
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      direction: 'center',
      elementId: element.id
    }
  ];
  
  return connectionPoints.filter(point =>
    pointDistance(searchPoint, { x: point.x, y: point.y }) <= maxDistance
  );
};

export interface ConnectionPoint {
  id: string;
  x: number;
  y: number;
  direction: 'top' | 'bottom' | 'left' | 'right' | 'center';
  elementId: string;
}

// Optimized element sorting for rendering
export const sortElementsByZIndex = (elements: CanvasElement[]): CanvasElement[] => {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
};

// Viewport culling for performance
export const cullElementsOutsideViewport = (
  elements: CanvasElement[],
  viewport: Bounds,
  padding = 100
): CanvasElement[] => {
  const expandedViewport = {
    x: viewport.x - padding,
    y: viewport.y - padding,
    width: viewport.width + padding * 2,
    height: viewport.height + padding * 2
  };
  
  return elements.filter(element => {
    const elementBounds = getRotatedElementBounds(element);
    return boundsIntersects(elementBounds, expandedViewport);
  });
};

// Efficient bounds calculation for multiple elements
export const calculateCombinedBounds = (elements: CanvasElement[]): Bounds | null => {
  if (elements.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const element of elements) {
    const bounds = getRotatedElementBounds(element);
    
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};
