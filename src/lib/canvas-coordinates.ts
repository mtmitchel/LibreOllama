/**
 * Comprehensive coordinate system utilities for canvas interactions
 * Handles all transformations between screen, world, and local coordinates
 * Enhanced for infinite canvas support
 */

import React from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportState {
  zoom: number;
  pan: Point;
  containerBounds: DOMRect;
}

// Infinite canvas configuration
export const INFINITE_CANVAS_CONFIG = {
  // Virtual canvas bounds (very large but finite for performance)
  WORLD_SIZE: 100000, // 100k x 100k units
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 10,
  // Viewport culling margin (in world units)
  CULLING_MARGIN: 1000,
  // Grid configuration
  GRID_SIZE: 20,
  GRID_MAJOR_SIZE: 100,
};

export class CoordinateSystem {
  private viewport: ViewportState;

  constructor(viewport: ViewportState) {
    this.viewport = viewport;
  }
  /**
   * Convert screen coordinates (mouse/touch) to world coordinates
   * Enhanced for infinite canvas with proper bounds checking
   */
  screenToWorld(screenPoint: Point): Point {
    const { zoom, pan, containerBounds } = this.viewport;
    
    // Convert to container-relative coordinates
    const containerX = screenPoint.x - containerBounds.left;
    const containerY = screenPoint.y - containerBounds.top;
    
    // Apply zoom and pan transformations
    const worldX = (containerX - pan.x) / zoom;
    const worldY = (containerY - pan.y) / zoom;
    
    // Clamp to infinite canvas bounds
    const clampedX = Math.max(-INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, 
                             Math.min(INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, worldX));
    const clampedY = Math.max(-INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, 
                             Math.min(INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, worldY));
    
    return { x: clampedX, y: clampedY };
  }

  /**
   * Convert world coordinates to screen coordinates
   * Enhanced for infinite canvas
   */
  worldToScreen(worldPoint: Point): Point {
    const { zoom, pan, containerBounds } = this.viewport;
    
    const containerX = worldPoint.x * zoom + pan.x;
    const containerY = worldPoint.y * zoom + pan.y;
    
    const screenX = containerX + containerBounds.left;
    const screenY = containerY + containerBounds.top;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Convert PixiJS global coordinates to world coordinates
   * Enhanced for infinite canvas
   */
  pixiToWorld(pixiPoint: Point): Point {
    const { zoom, pan } = this.viewport;
    
    // PixiJS global coordinates are already in container space
    const worldX = (pixiPoint.x - pan.x) / zoom;
    const worldY = (pixiPoint.y - pan.y) / zoom;
    
    // Clamp to infinite canvas bounds
    const clampedX = Math.max(-INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, 
                             Math.min(INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, worldX));
    const clampedY = Math.max(-INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, 
                             Math.min(INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, worldY));
    
    return { x: clampedX, y: clampedY };
  }

  /**
   * Get world coordinates at the center of the current viewport
   * Useful for placing new elements
   */
  getViewportCenter(): Point {
    const { containerBounds } = this.viewport;
    
    const centerScreen = {
      x: containerBounds.left + containerBounds.width / 2,
      y: containerBounds.top + containerBounds.height / 2
    };
    
    return this.screenToWorld(centerScreen);
  }

  /**
   * Convert container-relative coordinates to world coordinates
   * This is useful for mouse events within the canvas container
   */
  containerToWorld(containerPoint: Point): Point {
    const { zoom, pan } = this.viewport;
    
    const worldX = (containerPoint.x - pan.x) / zoom;
    const worldY = (containerPoint.y - pan.y) / zoom;
    
    // Clamp to infinite canvas bounds
    const clampedX = Math.max(-INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, 
                             Math.min(INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, worldX));
    const clampedY = Math.max(-INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, 
                             Math.min(INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2, worldY));
    
    return { x: clampedX, y: clampedY };
  }

  /**
   * Convert world bounds to screen bounds for culling calculations
   */
  worldBoundsToScreen(bounds: Bounds): Bounds {
    const topLeft = this.worldToScreen({ x: bounds.x, y: bounds.y });
    const bottomRight = this.worldToScreen({ 
      x: bounds.x + bounds.width, 
      y: bounds.y + bounds.height 
    });
    
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }
  /**
   * Check if world bounds are visible in current viewport
   * Enhanced for infinite canvas with better culling
   */
  isVisible(worldBounds: Bounds, margin = INFINITE_CANVAS_CONFIG.CULLING_MARGIN): boolean {
    const visibleBounds = this.getVisibleWorldBounds(margin);
    
    // Check intersection with visible bounds
    return !(
      worldBounds.x + worldBounds.width < visibleBounds.x ||
      worldBounds.y + worldBounds.height < visibleBounds.y ||
      worldBounds.x > visibleBounds.x + visibleBounds.width ||
      worldBounds.y > visibleBounds.y + visibleBounds.height
    );
  }

  /**
   * Get visible world bounds for the current viewport
   * Enhanced for infinite canvas
   */  getVisibleWorldBounds(margin = INFINITE_CANVAS_CONFIG.CULLING_MARGIN): Bounds {
    const { containerBounds } = this.viewport;
    
    // Calculate visible area in world coordinates
    const topLeftWorld = this.containerToWorld({ x: -margin, y: -margin });
    const bottomRightWorld = this.containerToWorld({ 
      x: containerBounds.width + margin, 
      y: containerBounds.height + margin 
    });
    
    return {
      x: topLeftWorld.x,
      y: topLeftWorld.y,
      width: bottomRightWorld.x - topLeftWorld.x,
      height: bottomRightWorld.y - topLeftWorld.y
    };
  }

  /**
   * Clamp pan values to prevent excessive scrolling beyond reasonable bounds
   */
  clampPan(pan: Point): Point {
    const { zoom, containerBounds } = this.viewport;
    
    // Calculate maximum pan values based on world size and zoom
    const maxWorldCoord = INFINITE_CANVAS_CONFIG.WORLD_SIZE / 2;
    const minScreenCoord = -maxWorldCoord * zoom;
    const maxScreenCoord = containerBounds.width + maxWorldCoord * zoom;
    
    return {
      x: Math.max(minScreenCoord, Math.min(maxScreenCoord, pan.x)),
      y: Math.max(minScreenCoord, Math.min(maxScreenCoord, pan.y))
    };
  }

  /**
   * Clamp zoom values to prevent excessive zooming
   */
  clampZoom(zoom: number): number {
    return Math.max(INFINITE_CANVAS_CONFIG.MIN_ZOOM, 
                   Math.min(INFINITE_CANVAS_CONFIG.MAX_ZOOM, zoom));
  }

  /**
   * Get grid points for the current viewport
   * Used for rendering an infinite grid
   */
  getVisibleGridPoints(): { minor: Point[]; major: Point[] } {
    const visibleBounds = this.getVisibleWorldBounds();
    const { zoom } = this.viewport;
    
    const minorPoints: Point[] = [];
    const majorPoints: Point[] = [];
    
    // Only render grid if zoom is sufficient
    if (zoom < 0.5) return { minor: [], major: [] };
    
    const gridSize = INFINITE_CANVAS_CONFIG.GRID_SIZE;
    const majorGridSize = INFINITE_CANVAS_CONFIG.GRID_MAJOR_SIZE;
    
    // Calculate grid range
    const startX = Math.floor(visibleBounds.x / gridSize) * gridSize;
    const endX = Math.ceil((visibleBounds.x + visibleBounds.width) / gridSize) * gridSize;
    const startY = Math.floor(visibleBounds.y / gridSize) * gridSize;
    const endY = Math.ceil((visibleBounds.y + visibleBounds.height) / gridSize) * gridSize;
    
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        const point = { x, y };
        
        if (x % majorGridSize === 0 && y % majorGridSize === 0) {
          majorPoints.push(point);
        } else {
          minorPoints.push(point);
        }
      }
    }
    
    return { minor: minorPoints, major: majorPoints };
  }

  /**
   * Update viewport state
   */
  updateViewport(newViewport: Partial<ViewportState>): void {
    this.viewport = { ...this.viewport, ...newViewport };
  }
}

/**
 * Utility hook for coordinate transformations
 * Enhanced for infinite canvas support
 */
export const useCoordinateSystem = (
  zoom: number,
  pan: Point,
  containerRef: React.RefObject<HTMLElement>
) => {
  const getCoordinateSystem = React.useCallback((): CoordinateSystem | null => {
    if (!containerRef.current) return null;
    
    const containerBounds = containerRef.current.getBoundingClientRect();
    return new CoordinateSystem({ zoom, pan, containerBounds });
  }, [zoom, pan, containerRef]);

  const getViewportCenter = React.useCallback((): Point | null => {
    const coordSystem = getCoordinateSystem();
    return coordSystem?.getViewportCenter() || null;
  }, [getCoordinateSystem]);

  const containerToWorld = React.useCallback((containerPoint: Point): Point | null => {
    const coordSystem = getCoordinateSystem();
    return coordSystem?.containerToWorld(containerPoint) || null;
  }, [getCoordinateSystem]);

  const clampPan = React.useCallback((newPan: Point): Point => {
    const coordSystem = getCoordinateSystem();
    return coordSystem?.clampPan(newPan) || newPan;
  }, [getCoordinateSystem]);

  const clampZoom = React.useCallback((newZoom: number): number => {
    const coordSystem = getCoordinateSystem();
    return coordSystem?.clampZoom(newZoom) || newZoom;
  }, [getCoordinateSystem]);

  return { 
    getCoordinateSystem,
    getViewportCenter,
    containerToWorld,
    clampPan,
    clampZoom
  };
};
