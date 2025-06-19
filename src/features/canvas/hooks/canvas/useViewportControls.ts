// src/hooks/canvas/useViewportControls.ts
import { useCallback } from 'react';
import { useCanvasStore } from '../../stores/canvasStore.enhanced';

/**
 * useViewportControls - Zoom/pan controls from the main canvas store
 * - Integrates with konvaCanvasStore for zoom and pan operations
 * - Provides convenient methods for common viewport operations
 * - Handles coordinate transformations
 */
export const useViewportControls = () => {
  // Use the unified canvas store with selectors
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const viewportSize = useCanvasStore((state) => state.viewportSize);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPan = useCanvasStore((state) => state.setPan);
  const zoomIn = useCanvasStore((state) => state.zoomIn);
  const zoomOut = useCanvasStore((state) => state.zoomOut);
  const zoomToFit = useCanvasStore((state) => state.zoomToFit);
  const resetViewport = useCanvasStore((state) => state.resetViewport);
  const screenToCanvas = useCanvasStore((state) => state.screenToCanvas);
  const canvasToScreen = useCanvasStore((state) => state.canvasToScreen);

  // Zoom to a specific point on the canvas
  const zoomToPoint = useCallback((zoomLevel: number, point: { x: number; y: number }) => {
    // Use setZoom with center point support
    setZoom(zoomLevel, point);
  }, [setZoom]);

  // Pan by a relative amount
  const panBy = useCallback((delta: { x: number; y: number }) => {
    setPan({
      x: pan.x + delta.x,
      y: pan.y + delta.y
    });
  }, [pan, setPan]);

  // Center the viewport on a specific point
  const centerOn = useCallback((point: { x: number; y: number }) => {
    setPan({
      x: viewportSize.width / 2 - point.x * zoom,
      y: viewportSize.height / 2 - point.y * zoom
    });
  }, [setPan, viewportSize, zoom]);

  // Fit viewport to specific bounds
  const fitToBounds = useCallback((bounds: { x: number; y: number; width: number; height: number }, padding: number = 50) => {
    const scaleX = (viewportSize.width - padding * 2) / bounds.width;
    const scaleY = (viewportSize.height - padding * 2) / bounds.height;
    const newZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // For now, use basic setZoom - can be enhanced later
    setZoom(newZoom);
    centerOn({ x: centerX, y: centerY });
  }, [viewportSize, setZoom]);

  // Get visible area bounds in canvas coordinates
  const getVisibleBounds = useCallback(() => {
    const topLeft = screenToCanvas({ x: 0, y: 0 });
    const bottomRight = screenToCanvas({ 
      x: viewportSize.width, 
      y: viewportSize.height 
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }, [screenToCanvas, viewportSize]);

  // Check if a point is visible in the current viewport
  const isPointVisible = useCallback((point: { x: number; y: number }) => {
    const bounds = getVisibleBounds();
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }, [getVisibleBounds]);

  // Get viewport state summary
  const getViewportState = useCallback(() => {
    return {
      zoom,
      pan,
      viewportSize,
      visibleBounds: getVisibleBounds()
    };
  }, [zoom, pan, viewportSize, getVisibleBounds]);

  return {
    // Current state
    zoom,
    pan,
    viewportSize,
    
    // Actions
    setZoom,
    setPan,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetViewport,
    
    // Viewport transformations
    screenToCanvas,
    canvasToScreen,
    
    // Derived actions and getters
    zoomToPoint,
    panBy,
    centerOn,
    fitToBounds,
    getVisibleBounds,
    isPointVisible,
    getViewportState
  };
};