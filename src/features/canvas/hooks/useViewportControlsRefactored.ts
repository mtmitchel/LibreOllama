/**
 * useViewportControls (Refactored) - Phase 4B: Component Migration
 * 
 * Updated to use unified store architecture:
 * - Uses unified store selectors for viewport state
 * - Type-safe viewport operations
 * - Consistent with unified store patterns
 * - Maintains all existing functionality
 */

import { useCallback } from 'react';
import { useUnifiedCanvasStore, canvasSelectors } from '../stores/unifiedCanvasStore';

/**
 * useViewportControlsRefactored - Zoom/pan controls from unified store
 * - Integrates with unifiedCanvasStore for viewport operations
 * - Provides convenient methods for common viewport operations
 * - Handles coordinate transformations
 * - Type-safe operations with unified store
 */
export const useViewportControlsRefactored = () => {
  // Use unified store with type-safe selectors
  const viewport = useUnifiedCanvasStore(canvasSelectors.viewport);
  const { setViewport, panViewport, zoomViewport } = useUnifiedCanvasStore();

  // Extract viewport properties for backward compatibility
  const zoom = viewport.scale;
  const pan = { x: viewport.x, y: viewport.y };
  const viewportSize = { width: viewport.width, height: viewport.height };

  // Enhanced zoom functions using unified store methods
  const setZoom = useCallback((newZoom: number, centerPoint?: { x: number; y: number }) => {
    if (centerPoint) {
      zoomViewport(newZoom, centerPoint.x, centerPoint.y);
    } else {
      setViewport({ scale: newZoom });
    }
  }, [setViewport, zoomViewport]);

  const setPan = useCallback((newPan: { x: number; y: number }) => {
    setViewport({ x: newPan.x, y: newPan.y });
  }, [setViewport]);

  // Zoom in by a factor
  const zoomIn = useCallback((factor: number = 1.2) => {
    const newZoom = Math.min(zoom * factor, 5.0); // Max zoom 5x
    setZoom(newZoom);
  }, [zoom, setZoom]);

  // Zoom out by a factor
  const zoomOut = useCallback((factor: number = 1.2) => {
    const newZoom = Math.max(zoom / factor, 0.1); // Min zoom 0.1x
    setZoom(newZoom);
  }, [zoom, setZoom]);

  // Reset viewport to default state
  const resetViewport = useCallback(() => {
    setViewport({
      x: 0,
      y: 0,
      scale: 1
    });
  }, [setViewport]);

  // Zoom to a specific point on the canvas
  const zoomToPoint = useCallback((zoomLevel: number, point: { x: number; y: number }) => {
    zoomViewport(zoomLevel, point.x, point.y);
  }, [zoomViewport]);

  // Pan by a relative amount
  const panBy = useCallback((delta: { x: number; y: number }) => {
    panViewport(delta.x, delta.y);
  }, [panViewport]);

  // Center the viewport on a specific point
  const centerOn = useCallback((point: { x: number; y: number }) => {
    const newX = viewportSize.width / 2 - point.x * zoom;
    const newY = viewportSize.height / 2 - point.y * zoom;
    setPan({ x: newX, y: newY });
  }, [setPan, viewportSize, zoom]);

  // Screen to canvas coordinate transformation
  const screenToCanvas = useCallback((screenPoint: { x: number; y: number }) => {
    return {
      x: (screenPoint.x - pan.x) / zoom,
      y: (screenPoint.y - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Canvas to screen coordinate transformation
  const canvasToScreen = useCallback((canvasPoint: { x: number; y: number }) => {
    return {
      x: canvasPoint.x * zoom + pan.x,
      y: canvasPoint.y * zoom + pan.y
    };
  }, [pan, zoom]);

  // Fit viewport to specific bounds
  const fitToBounds = useCallback((
    bounds: { x: number; y: number; width: number; height: number }, 
    padding: number = 50
  ) => {
    const scaleX = (viewportSize.width - padding * 2) / bounds.width;
    const scaleY = (viewportSize.height - padding * 2) / bounds.height;
    const newZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Set zoom first, then center
    setZoom(newZoom);
    centerOn({ x: centerX, y: centerY });
  }, [viewportSize, setZoom, centerOn]);

  // Zoom to fit all elements (placeholder - would need elements from store)
  const zoomToFit = useCallback(() => {
    // This would need to get all elements and calculate their bounds
    // For now, reset to default view
    resetViewport();
  }, [resetViewport]);

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

  // Check if a rectangle is visible in the current viewport
  const isRectVisible = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const bounds = getVisibleBounds();
    return !(rect.x + rect.width < bounds.x ||
             rect.x > bounds.x + bounds.width ||
             rect.y + rect.height < bounds.y ||
             rect.y > bounds.y + bounds.height);
  }, [getVisibleBounds]);

  // Get viewport state summary
  const getViewportState = useCallback(() => {
    return {
      zoom,
      pan,
      viewportSize,
      visibleBounds: getVisibleBounds(),
      viewport: viewport // Include full viewport object
    };
  }, [zoom, pan, viewportSize, getVisibleBounds, viewport]);

  return {
    // Current state (backward compatibility)
    zoom,
    pan,
    viewportSize,
    viewport, // New: full viewport object
    
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
    isRectVisible, // New: rectangle visibility check
    getViewportState
  };
};