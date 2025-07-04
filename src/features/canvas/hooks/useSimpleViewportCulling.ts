import { useMemo } from 'react';
import { PanZoom, Size } from '../types';
import type { CanvasElement } from '../types/enhanced.types';
import { isRectangularElement } from '../types/enhanced.types';

export interface SimpleViewportCullingProps {
  elements: CanvasElement[];
  zoomLevel: number;
  panOffset: PanZoom;
  canvasSize: Size | null;
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
 * Simple viewport culling - MVP focused
 * 
 * Only does basic intersection testing - no LOD, no quadtree, no complex memory optimization
 * Perfect for <1000 elements which covers 90% of real-world canvas usage
 */
export const useSimpleViewportCulling = ({
  elements,
  zoomLevel,
  panOffset,
  canvasSize,
  buffer = 200 // Default 200px buffer around viewport
}: SimpleViewportCullingProps): SimpleCullingResult => {
  
  return useMemo(() => {
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

    const visibleElements: CanvasElement[] = [];
    const culledElements: CanvasElement[] = [];

    // Simple intersection test for each element
    for (const element of elements) {
      // Always show locked or text elements (critical for UX)
      if (element.isLocked || element.type === 'text') {
        visibleElements.push(element);
        continue;
      }

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
  }, [elements, zoomLevel, panOffset.x, panOffset.y, canvasSize?.width, canvasSize?.height, buffer]);
}; 