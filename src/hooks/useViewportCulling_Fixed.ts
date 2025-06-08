import { useMemo } from 'react';
import { PanZoom, Size, ViewportBounds } from '@/types';
import type { CanvasElement } from '@/components/canvas/CanvasElement'; 

export interface UseViewportCullingProps {
  elements: CanvasElement[];
  zoomLevel: number;
  panOffset: PanZoom;
  canvasSize: Size | null; 
}

export const useViewportCulling = ({ elements, zoomLevel, panOffset, canvasSize }: UseViewportCullingProps) => {
  return useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ViewportCulling] Calculating with:`, {
        canvasSize,
        zoomLevel,
        panOffset,
        elementCount: elements.length
      });
    }

    if (!canvasSize || canvasSize.width <= 0 || canvasSize.height <= 0 || zoomLevel === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[ViewportCulling] Invalid canvasSize or zoomLevel, returning empty elements.");
      }
      return { visibleElements: [], culledElements: elements };
    }

    // Add a small buffer to prevent elements from popping in/out at edges
    const buffer = 50; // pixels in screen space

    // Calculate viewport bounds in canvas coordinates
    // The viewport represents what's visible in the canvas container
    const viewportBounds: ViewportBounds = {
      left: (-panOffset.x - buffer) / zoomLevel,
      top: (-panOffset.y - buffer) / zoomLevel,
      right: (canvasSize.width - panOffset.x + buffer) / zoomLevel,
      bottom: (canvasSize.height - panOffset.y + buffer) / zoomLevel,
    };

    const visibleElements: CanvasElement[] = [];
    const culledElements: CanvasElement[] = [];

    elements.forEach(element => {
      // Handle elements without explicit dimensions (like text)
      const elementWidth = element.width || 100; // Default width for text
      const elementHeight = element.height || 50; // Default height for text

      // Calculate element bounds
      const elementBounds = {
        left: element.x,
        top: element.y,
        right: element.x + elementWidth,
        bottom: element.y + elementHeight,
      };

      // Check if element intersects with viewport
      const isIntersecting = 
        elementBounds.right >= viewportBounds.left &&
        elementBounds.left <= viewportBounds.right &&
        elementBounds.bottom >= viewportBounds.top &&
        elementBounds.top <= viewportBounds.bottom;

      if (isIntersecting) {
        visibleElements.push(element);
      } else {
        culledElements.push(element);
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ViewportCulling] Results:`, {
        viewportBounds,
        visible: visibleElements.length,
        culled: culledElements.length,
        visibleIds: visibleElements.map(e => e.id),
        culledIds: culledElements.map(e => e.id)
      });
    }

    return { visibleElements, culledElements };
  }, [elements, zoomLevel, panOffset, canvasSize]);
};
