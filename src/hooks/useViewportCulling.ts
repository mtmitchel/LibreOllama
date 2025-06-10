import { useMemo } from 'react';
import { PanZoom, Size, ViewportBounds } from '../types';
// Import CanvasElement from the correct store location
import type { CanvasElement } from '../stores/fabricCanvasStore'; 

export interface UseViewportCullingProps {
  elements: CanvasElement[];
  zoomLevel: number;
  panOffset: PanZoom;
  canvasSize: Size | null; 
}

// Helper to get element bounds
const getElementBounds = (element: CanvasElement) => {
  // Basic bounding box, can be expanded for more complex shapes
  // return {
  //   left: element.x,
  //   top: element.y,
  //   right: element.x + (element.width || 0),
  //   bottom: element.y + (element.height || 0),
  // };
  switch (element.type) {
    case 'line':
    case 'arrow':
      return {
        left: Math.min(element.x, element.x2 ?? element.x),
        top: Math.min(element.y, element.y2 ?? element.y),
        right: Math.max(element.x, element.x2 ?? element.x),
        bottom: Math.max(element.y, element.y2 ?? element.y),
      };
    case 'drawing':
      if (!element.points || element.points.length === 0) {
        return { left: element.x, top: element.y, right: element.x, bottom: element.y };
      }
      let minX = element.points[0].x, maxX = element.points[0].x;
      let minY = element.points[0].y, maxY = element.points[0].y;
      element.points.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      return { left: minX, top: minY, right: maxX, bottom: maxY };
    default:
      // Default for rectangle-like shapes
      return { left: element.x, top: element.y, right: element.x + (element.width || 0), bottom: element.y + (element.height || 0) };
  }
};

export const useViewportCulling = ({ elements, zoomLevel, panOffset, canvasSize }: UseViewportCullingProps) => {
  return useMemo(() => {
    // Early return for invalid parameters OR very small canvas sizes during initialization
    // Very small canvas likely means the window is minimized during page load
    const isInitializing = !canvasSize || canvasSize.width === 0 || canvasSize.height === 0 || zoomLevel === 0;
    const isVerySmallCanvas = canvasSize && (canvasSize.width < 200 || canvasSize.height < 200);
    
    if (isInitializing || isVerySmallCanvas) {
      if (import.meta.env.DEV) {
        console.log(`[ViewportCulling] ${isInitializing ? 'Initializing' : 'Very small canvas'} - showing all elements. CanvasSize: ${canvasSize?.width}x${canvasSize?.height}, ZoomLevel: ${zoomLevel}, Elements: ${elements.length}`);
      }
      // During initialization or very small windows, show all elements
      return { visibleElements: elements, culledElements: [] };
    }

    const buffer = 0; // Screen pixel buffer for strict culling

    const viewportBounds: ViewportBounds = {
      left: (-panOffset.x - buffer) / zoomLevel,
      top: (-panOffset.y - buffer) / zoomLevel,
      right: (canvasSize.width - panOffset.x + buffer) / zoomLevel,
      bottom: (canvasSize.height - panOffset.y + buffer) / zoomLevel,
    };

    const visibleElements: CanvasElement[] = [];
    const culledElements: CanvasElement[] = [];

    elements.forEach(element => {
      const elementBounds = getElementBounds(element);

      const isIntersecting = 
        elementBounds.left < viewportBounds.right &&
        elementBounds.right > viewportBounds.left &&
        elementBounds.top < viewportBounds.bottom &&
        elementBounds.bottom > viewportBounds.top;

      if (isIntersecting) {
        visibleElements.push(element);
      } else {
        culledElements.push(element);
      }
    });

    // Reduced logging - only log summary in development
    if (import.meta.env.DEV) {
      console.log(`[ViewportCulling] Canvas: ${canvasSize.width}x${canvasSize.height}, Zoom: ${zoomLevel}, Pan: (${panOffset.x}, ${panOffset.y}) => Visible: ${visibleElements.length}, Culled: ${culledElements.length}`);
    }

    return { visibleElements, culledElements };
  }, [elements, zoomLevel, panOffset.x, panOffset.y, canvasSize?.width, canvasSize?.height]);
};
