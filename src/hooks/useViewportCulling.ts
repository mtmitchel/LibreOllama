import { useMemo } from 'react';
import { PanZoom, Size, ViewportBounds } from '@/types';
// Correctly import the CanvasElement interface, not the component
import type { CanvasElement } from '@/components/canvas/CanvasElement'; 

export interface UseViewportCullingProps {
  elements: CanvasElement[];
  zoomLevel: number;
  panOffset: PanZoom;
  canvasSize: Size | null; 
}

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
      // Ensure width and height are not undefined before using them
      const elementWidth = element.width || 0;
      const elementHeight = element.height || 0;

      const elementBounds = {
        left: element.x,
        top: element.y,
        right: element.x + elementWidth,
        bottom: element.y + elementHeight,
      };

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
