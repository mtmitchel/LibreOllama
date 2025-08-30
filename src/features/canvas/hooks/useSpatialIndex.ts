/**
 * Hook for spatial indexing using QuadTree
 * Provides O(log n) viewport culling for large canvases
 */

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { CanvasElement } from '../types/enhanced.types';
import { QuadTree, BoundingBox } from '../utils/spatial/QuadTree';
import { canvasLog } from '../utils/canvasLogger';

interface ViewportState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

interface SpatialIndexConfig {
  enabled?: boolean;
  maxElementsPerNode?: number;
  maxDepth?: number;
  rebuildThreshold?: number;
  bufferSize?: number;
}

const DEFAULT_CONFIG: SpatialIndexConfig = {
  enabled: true,
  maxElementsPerNode: 10,
  maxDepth: 6,
  rebuildThreshold: 100, // Rebuild after 100 operations
  bufferSize: 200 // Viewport buffer in pixels
};

export function useSpatialIndex(
  elements: CanvasElement[],
  viewport: ViewportState,
  config: SpatialIndexConfig = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const quadTreeRef = useRef<QuadTree | null>(null);
  const operationCountRef = useRef(0);
  const lastElementCountRef = useRef(0);

  // Initialize QuadTree with canvas bounds
  useEffect(() => {
    if (!mergedConfig.enabled) return;

    // Create QuadTree with reasonable bounds
    const canvasBounds: BoundingBox = {
      x: -10000,
      y: -10000,
      width: 20000,
      height: 20000
    };

    quadTreeRef.current = new QuadTree(
      canvasBounds,
      mergedConfig.maxElementsPerNode,
      mergedConfig.maxDepth
    );

    // Initial population
    if (elements.length > 0) {
      quadTreeRef.current.rebuild(elements);
      lastElementCountRef.current = elements.length;
    }

    canvasLog.info('🌳 [SpatialIndex] QuadTree initialized', {
      elementCount: elements.length,
      config: mergedConfig
    });
  }, [mergedConfig.enabled]);

  // Update QuadTree when elements change significantly
  useEffect(() => {
    if (!mergedConfig.enabled || !quadTreeRef.current) return;

    const elementCountChanged = Math.abs(elements.length - lastElementCountRef.current) > 10;
    const shouldRebuild = elementCountChanged || operationCountRef.current > (mergedConfig.rebuildThreshold ?? 100);

    if (shouldRebuild) {
      const startTime = performance.now();
      quadTreeRef.current.rebuild(elements);
      const rebuildTime = performance.now() - startTime;

      lastElementCountRef.current = elements.length;
      operationCountRef.current = 0;

      canvasLog.debug('🌳 [SpatialIndex] QuadTree rebuilt', {
        elementCount: elements.length,
        rebuildTime: `${rebuildTime.toFixed(2)}ms`,
        stats: quadTreeRef.current.getStats()
      });
    }
  }, [elements, mergedConfig]);

  // Query visible elements using QuadTree
  const visibleElements = useMemo(() => {
    let lastQueryTime = 0;
    // Fallback to linear search if disabled or not initialized
    if (!mergedConfig.enabled || !quadTreeRef.current || elements.length < 100) {
      return performLinearCulling(elements, viewport, mergedConfig.bufferSize ?? 200);
    }

    const startTime = performance.now();

    // Calculate viewport bounds with buffer
    const bufferSize = mergedConfig.bufferSize ?? 200;
    const viewportBounds: BoundingBox = {
      x: (-viewport.x - bufferSize) / viewport.scale,
      y: (-viewport.y - bufferSize) / viewport.scale,
      width: (viewport.width + bufferSize * 2) / viewport.scale,
      height: (viewport.height + bufferSize * 2) / viewport.scale
    };

    // Query QuadTree
    const visible = quadTreeRef.current.query(viewportBounds);
    const queryTime = performance.now() - startTime;
    lastQueryTime = queryTime;
    (window as any).__SPATIAL_INDEX_LAST__ = {
      queryTime,
      total: elements.length,
      visible: visible.length,
      cullingEfficiency: elements.length > 0 ? 1 - visible.length / elements.length : 0
    };

    // Log performance gains for large element counts
    if (elements.length > 500) {
      const reductionPercent = ((1 - visible.length / elements.length) * 100).toFixed(1);
      canvasLog.debug('🌳 [SpatialIndex] Viewport query complete', {
        total: elements.length,
        visible: visible.length,
        culled: `${reductionPercent}%`,
        queryTime: `${queryTime.toFixed(2)}ms`,
        method: 'QuadTree'
      });
    }

    return visible;
  }, [elements, viewport, mergedConfig]);

  // Update element in QuadTree
  const updateElement = useCallback((element: CanvasElement) => {
    if (!mergedConfig.enabled || !quadTreeRef.current) return;

    quadTreeRef.current.update(element);
    operationCountRef.current++;
  }, [mergedConfig.enabled]);

  // Remove element from QuadTree
  const removeElement = useCallback((elementId: string) => {
    if (!mergedConfig.enabled || !quadTreeRef.current) return;

    quadTreeRef.current.remove(elementId as any);
    operationCountRef.current++;
  }, [mergedConfig.enabled]);

  // Add element to QuadTree
  const addElement = useCallback((element: CanvasElement) => {
    if (!mergedConfig.enabled || !quadTreeRef.current) return;

    quadTreeRef.current.insert(element);
    operationCountRef.current++;
  }, [mergedConfig.enabled]);

  // Get QuadTree statistics
  const getStats = useCallback(() => {
    if (!quadTreeRef.current) {
      return {
        elementCount: elements.length,
        nodeCount: 0,
        maxDepth: 0,
        averageElementsPerNode: 0,
        method: 'linear'
      };
    }

    return {
      ...quadTreeRef.current.getStats(),
      method: 'QuadTree'
    };
  }, [elements.length]);

  return {
    visibleElements,
    updateElement,
    removeElement,
    addElement,
    getStats,
    isEnabled: mergedConfig.enabled && elements.length >= 100
  };
}

/**
 * Fallback linear viewport culling
 */
function performLinearCulling(
  elements: CanvasElement[],
  viewport: ViewportState,
  bufferSize: number
): CanvasElement[] {
  const viewportBounds = {
    left: (-viewport.x - bufferSize) / viewport.scale,
    top: (-viewport.y - bufferSize) / viewport.scale,
    right: (viewport.width - viewport.x + bufferSize) / viewport.scale,
    bottom: (viewport.height - viewport.y + bufferSize) / viewport.scale,
  };

  return elements.filter(element => {
    // Always include locked or text elements
    if (element.isLocked || element.type === 'text') {
      return true;
    }

    const elementBounds = getElementBounds(element);
    
    // Simple AABB intersection test
    return (
      elementBounds.left < viewportBounds.right &&
      elementBounds.right > viewportBounds.left &&
      elementBounds.top < viewportBounds.bottom &&
      elementBounds.bottom > viewportBounds.top
    );
  });
}

/**
 * Get element bounds for culling
 */
function getElementBounds(element: CanvasElement) {
  let width = 100;
  let height = 100;

  // Type-specific bounds calculation
  if (element.type === 'circle') {
    const radius = (element as any).radius || 50;
    width = height = radius * 2;
  } else if ((element as any).width !== undefined) {
    width = (element as any).width;
    height = (element as any).height || 100;
  }

  return {
    left: element.x,
    top: element.y,
    right: element.x + width,
    bottom: element.y + height
  };
}