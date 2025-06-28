// src/hooks/canvas/useViewportControls.ts
import { useCallback } from 'react';
import { useCanvasStore } from '../../../stores';

/**
 * useViewportControls - Zoom/pan controls from the main canvas store
 * - Integrates with konvaCanvasStore for zoom and pan operations
 * - Provides convenient methods for common viewport operations
 * - Handles coordinate transformations
 */
export const useViewportControls = () => {
  // Use the unified canvas store with stable selectors
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const panViewport = useCanvasStore((state) => state.panViewport);
  const zoomViewport = useCanvasStore((state) => state.zoomViewport);
  
  // Extract values from viewport object to avoid recreating objects on every render
  const zoom = viewport.scale;
  const pan = { x: viewport.x, y: viewport.y };
  const viewportSize = { width: viewport.width, height: viewport.height };

  // Simplified viewport controls using unified store methods
  const setZoom = useCallback((scale: number) => {
    zoomViewport(scale);
  }, [zoomViewport]);

  const setPan = useCallback((newPan: { x: number; y: number }) => {
    setViewport(newPan);
  }, [setViewport]);

  const zoomIn = useCallback(() => {
    zoomViewport(zoom * 1.2);
  }, [zoomViewport, zoom]);

  const zoomOut = useCallback(() => {
    zoomViewport(zoom * 0.8);
  }, [zoomViewport, zoom]);

  const resetViewport = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 });
  }, [setViewport]);

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
    resetViewport
  };
};