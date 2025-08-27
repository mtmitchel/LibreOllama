import { useMemo } from 'react';
import { PanZoom, Size } from '../types';
import type { CanvasElement } from '../types/enhanced.types';
import { isRectangularElement } from '../types/enhanced.types';
import { SimpleQuadTree, Rectangle } from '../utils/spatialIndex';

export interface Camera {
  zoomLevel: number;
  panOffset: PanZoom;
  canvasSize: Size | null;
}

export interface SimpleViewportCullingProps {
  elements: CanvasElement[];
  camera: Camera;
  buffer?: number; // Optional buffer around viewport
}

export interface SimpleCullingResult {
  visibleElements: CanvasElement[];
  culledElements: CanvasElement[];
  cullingStats: {
    totalElements: number;
    visibleElements: number;
    culledElements: number;
  };
}

// QuadTree optimization threshold
const QUADTREE_THRESHOLD = 2000;

/**
 * Get simple bounding box for any element type
 * PERFORMANCE: Optimized for speed over complex shape handling
 */
const getElementBounds = (element: CanvasElement): { left: number; top: number; right: number; bottom: number } => {
  switch (element.type) {
    case 'circle':
      return {
        left: element.x - element.radius,
        top: element.y - element.radius,
        right: element.x + element.radius,
        bottom: element.y + element.radius,
      };
      
    case 'pen':
    case 'connector':
      // For complex shapes, use simple bounds calculation
      if (element.type === 'pen' && element.points && element.points.length >= 4) {
        let minX = element.points[0] ?? element.x;
        let maxX = element.points[0] ?? element.x;
        let minY = element.points[1] ?? element.y;
        let maxY = element.points[1] ?? element.y;
        
        // Sample every 4th point for performance (pen strokes have many points)
        for (let i = 0; i < element.points.length; i += 8) {
          const x = element.points[i];
          const y = element.points[i + 1];
          if (x !== undefined && y !== undefined) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
        return { left: minX, top: minY, right: maxX, bottom: maxY };
      }
      
      // Fallback for connectors or invalid pen strokes
      if (element.type === 'connector' && element.startPoint && element.endPoint) {
        return {
          left: Math.min(element.startPoint.x, element.endPoint.x),
          top: Math.min(element.startPoint.y, element.endPoint.y),
          right: Math.max(element.startPoint.x, element.endPoint.x),
          bottom: Math.max(element.startPoint.y, element.endPoint.y),
        };
      }
      
      // Fallback to point
      return { left: element.x, top: element.y, right: element.x + 50, bottom: element.y + 50 };
      
    default:
      // Handle rectangular elements (most common case)
      if (isRectangularElement(element)) {
        return {
          left: element.x,
          top: element.y,
          right: element.x + element.width,
          bottom: element.y + element.height,
        };
      }
      
      // Fallback for unknown types
      return { left: element.x, top: element.y, right: element.x + 100, bottom: element.y + 100 };
  }
};

/**
 * Calculate canvas bounds that encompass all elements for QuadTree initialization
 */
const calculateCanvasBounds = (elements: CanvasElement[]): Rectangle => {
  if (elements.length === 0) {
    return { x: -5000, y: -5000, width: 10000, height: 10000 }; // Default large area
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    const bounds = getElementBounds(element);
    minX = Math.min(minX, bounds.left);
    minY = Math.min(minY, bounds.top);
    maxX = Math.max(maxX, bounds.right);
    maxY = Math.max(maxY, bounds.bottom);
  }

  // Add padding around elements
  const padding = 1000;
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
};

/**
 * Simple viewport culling with QuadTree optimization for large element counts
 * 
 * - Uses linear intersection testing for <= 2000 elements (covers 90% of real-world usage)
 * - Automatically switches to QuadTree spatial indexing for > 2000 elements
 * - Maintains same interface for seamless performance scaling
 * 
 * PERFORMANCE: Uses single useMemo with [elements, camera] dependency for optimal re-render control
 */
export const useSimpleViewportCulling = ({
  elements,
  camera,
  buffer = 200 // Default 200px buffer around viewport
}: SimpleViewportCullingProps): SimpleCullingResult => {
  
  return useMemo(() => {
    // Destructure camera properties for use
    const { zoomLevel, panOffset, canvasSize } = camera;
    
    // Early return for invalid parameters
    if (!canvasSize || canvasSize.width === 0 || canvasSize.height === 0 || zoomLevel === 0) {
      return {
        visibleElements: elements,
        culledElements: [],
        cullingStats: {
          totalElements: elements.length,
          visibleElements: elements.length,
          culledElements: 0,
        }
      };
    }

    // Calculate viewport bounds with buffer
    const viewportBounds = {
      left: (-panOffset.x - buffer) / zoomLevel,
      top: (-panOffset.y - buffer) / zoomLevel,
      right: (canvasSize.width - panOffset.x + buffer) / zoomLevel,
      bottom: (canvasSize.height - panOffset.y + buffer) / zoomLevel,
    };

    // QuadTree optimization for large element counts
    if (elements.length > QUADTREE_THRESHOLD) {
      // Calculate canvas bounds for QuadTree initialization
      const canvasBounds = calculateCanvasBounds(elements);
      
      // Create and build QuadTree
      const quadTree = new SimpleQuadTree(canvasBounds);
      quadTree.build(elements);
      
      // Convert viewport bounds to Rectangle format for QuadTree query
      const viewportRect: Rectangle = {
        x: viewportBounds.left,
        y: viewportBounds.top,
        width: viewportBounds.right - viewportBounds.left,
        height: viewportBounds.bottom - viewportBounds.top
      };
      
      // Query visible elements using QuadTree
      const visibleElements = quadTree.query(viewportRect);
      const culledElements = elements.filter(el => !visibleElements.includes(el));
      
      return {
        visibleElements,
        culledElements,
        cullingStats: {
          totalElements: elements.length,
          visibleElements: visibleElements.length,
          culledElements: culledElements.length,
        }
      };
    }

    // Linear culling for smaller element counts (existing logic)
    const visibleElements: CanvasElement[] = [];
    const culledElements: CanvasElement[] = [];

    // Simple intersection test for each element
    for (const element of elements) {
      const elementBounds = getElementBounds(element);
      
      // Simple AABB intersection test
      const isVisible = 
        elementBounds.left < viewportBounds.right &&
        elementBounds.right > viewportBounds.left &&
        elementBounds.top < viewportBounds.bottom &&
        elementBounds.bottom > viewportBounds.top;

      if (isVisible) {
        visibleElements.push(element);
      } else {
        culledElements.push(element);
      }
    }

    return {
      visibleElements,
      culledElements,
      cullingStats: {
        totalElements: elements.length,
        visibleElements: visibleElements.length,
        culledElements: culledElements.length,
      }
    };
  }, [elements, camera, buffer]); // PERFORMANCE: Optimized dependency array using camera object
}; 