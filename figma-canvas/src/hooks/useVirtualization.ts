import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CanvasElement, Bounds, Viewport } from '../types/canvas';
import { ViewportVirtualizer, DirtyRegionTracker } from '../utils/performance';
import { getElementBounds, boundsIntersects } from '../utils/geometry';

interface VirtualizationConfig {
  bufferSize: number;
  chunkSize: number;
  updateThrottle: number;
  enableDirtyTracking: boolean;
  enableLevelOfDetail: boolean;
  minVisibleSize: number;
}

const DEFAULT_CONFIG: VirtualizationConfig = {
  bufferSize: 200,
  chunkSize: 50,
  updateThrottle: 16, // 60fps
  enableDirtyTracking: true,
  enableLevelOfDetail: true,
  minVisibleSize: 1
};

export const useVirtualization = (
  elements: CanvasElement[],
  viewport: Viewport,
  config: Partial<VirtualizationConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [visibleElements, setVisibleElements] = useState<CanvasElement[]>([]);
  const [virtualizedElements, setVirtualizedElements] = useState<CanvasElement[]>([]);
  const [levelOfDetailElements, setLevelOfDetailElements] = useState<CanvasElement[]>([]);
  
  const virtualizerRef = useRef<ViewportVirtualizer | null>(null);
  const dirtyTrackerRef = useRef<DirtyRegionTracker | null>(null);
  const lastUpdateTime = useRef(0);

  // Initialize virtualizer and dirty tracker
  useEffect(() => {
    if (!virtualizerRef.current) {
      virtualizerRef.current = new ViewportVirtualizer(finalConfig.bufferSize);
    }
    if (!dirtyTrackerRef.current && finalConfig.enableDirtyTracking) {
      dirtyTrackerRef.current = new DirtyRegionTracker();
    }
  }, [finalConfig.bufferSize, finalConfig.enableDirtyTracking]);

  // Calculate viewport bounds
  const viewportBounds = useMemo(() => ({
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: window.innerWidth / viewport.zoom,
    height: window.innerHeight / viewport.zoom
  }), [viewport]);

  // Expanded viewport bounds with buffer
  const expandedViewportBounds = useMemo(() => ({
    x: viewportBounds.x - finalConfig.bufferSize,
    y: viewportBounds.y - finalConfig.bufferSize,
    width: viewportBounds.width + finalConfig.bufferSize * 2,
    height: viewportBounds.height + finalConfig.bufferSize * 2
  }), [viewportBounds, finalConfig.bufferSize]);

  // Check if element is visible in viewport
  const isElementVisible = useCallback((element: CanvasElement, bounds: Bounds = expandedViewportBounds) => {
    const elementBounds = getElementBounds(element);
    
    // Apply zoom-based visibility culling
    const scaledWidth = elementBounds.width * viewport.zoom;
    const scaledHeight = elementBounds.height * viewport.zoom;
    
    if (scaledWidth < finalConfig.minVisibleSize || scaledHeight < finalConfig.minVisibleSize) {
      return false;
    }
    
    return boundsIntersects(elementBounds, bounds);
  }, [expandedViewportBounds, viewport.zoom, finalConfig.minVisibleSize]);

  // Apply level of detail based on zoom level
  const applyLevelOfDetail = useCallback((elements: CanvasElement[]) => {
    if (!finalConfig.enableLevelOfDetail) return elements;

    return elements.map(element => {
      const scaledSize = Math.min(element.width, element.height) * viewport.zoom;
      
      // Create simplified version for small elements
      if (scaledSize < 5) {
        return {
          ...element,
          // Simplify rendering data for very small elements
          data: { ...element.data, simplified: true }
        };
      }
      
      return element;
    });
  }, [viewport.zoom, finalConfig.enableLevelOfDetail]);

  // Spatial partitioning for efficient culling
  const spatialPartition = useCallback((elements: CanvasElement[]) => {
    const chunks = new Map<string, CanvasElement[]>();
    const chunkSize = finalConfig.chunkSize;
    
    elements.forEach(element => {
      const elementBounds = getElementBounds(element);
      const chunkX = Math.floor(elementBounds.x / chunkSize);
      const chunkY = Math.floor(elementBounds.y / chunkSize);
      const chunkKey = `${chunkX},${chunkY}`;
      
      if (!chunks.has(chunkKey)) {
        chunks.set(chunkKey, []);
      }
      chunks.get(chunkKey)!.push(element);
    });
    
    // Only return chunks that intersect with viewport
    const visibleChunks: CanvasElement[] = [];
    const startChunkX = Math.floor(expandedViewportBounds.x / chunkSize);
    const endChunkX = Math.ceil((expandedViewportBounds.x + expandedViewportBounds.width) / chunkSize);
    const startChunkY = Math.floor(expandedViewportBounds.y / chunkSize);
    const endChunkY = Math.ceil((expandedViewportBounds.y + expandedViewportBounds.height) / chunkSize);
    
    for (let x = startChunkX; x <= endChunkX; x++) {
      for (let y = startChunkY; y <= endChunkY; y++) {
        const chunkKey = `${x},${y}`;
        const chunk = chunks.get(chunkKey);
        if (chunk) {
          visibleChunks.push(...chunk);
        }
      }
    }
    
    return visibleChunks;
  }, [expandedViewportBounds, finalConfig.chunkSize]);

  // Update virtualization
  const updateVirtualization = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdateTime.current < finalConfig.updateThrottle) {
      return;
    }
    lastUpdateTime.current = now;

    // Use spatial partitioning for initial culling
    const spatiallyFiltered = spatialPartition(elements);
    
    // Filter visible elements
    const visible = spatiallyFiltered.filter(element => isElementVisible(element));
    
    // Apply level of detail
    const lodElements = applyLevelOfDetail(visible);
    
    // Create virtualized versions (simplified data for complex elements)
    const virtualized = lodElements.map(element => {
      // For complex elements that are far away, create simplified versions
      const distance = Math.sqrt(
        Math.pow(element.x - viewportBounds.x - viewportBounds.width / 2, 2) +
        Math.pow(element.y - viewportBounds.y - viewportBounds.height / 2, 2)
      );
      
      const scaledSize = Math.min(element.width, element.height) * viewport.zoom;
      
      if (distance > viewportBounds.width && scaledSize < 20) {
        // Very far and small - use simplified representation
        return {
          ...element,
          data: { ...element.data, virtualized: true, simplified: true }
        };
      }
      
      return element;
    });

    setVisibleElements(visible);
    setVirtualizedElements(virtualized);
    setLevelOfDetailElements(lodElements);

    // Update dirty regions if enabled
    if (dirtyTrackerRef.current) {
      visible.forEach(element => {
        dirtyTrackerRef.current!.markDirty(element.id, getElementBounds(element));
      });
    }
  }, [
    elements,
    spatialPartition,
    isElementVisible,
    applyLevelOfDetail,
    viewportBounds,
    viewport.zoom,
    finalConfig.updateThrottle
  ]);

  // Update when viewport or elements change
  useEffect(() => {
    updateVirtualization();
  }, [updateVirtualization]);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const totalElements = elements.length;
    const visibleCount = visibleElements.length;
    const virtualizedCount = virtualizedElements.length;
    const simplifiedCount = levelOfDetailElements.length;
    
    return {
      totalElements,
      visibleElements: visibleCount,
      culledElements: totalElements - visibleCount,
      virtualizedElements: virtualizedCount,
      simplifiedElements: simplifiedCount,
      cullRatio: totalElements > 0 ? (totalElements - visibleCount) / totalElements : 0,
      virtualizationRatio: visibleCount > 0 ? virtualizedCount / visibleCount : 0,
      memoryEfficiency: visibleCount / Math.max(totalElements, 1)
    };
  }, [elements.length, visibleElements.length, virtualizedElements, levelOfDetailElements]);

  // Dirty region management
  const markElementDirty = useCallback((elementId: string, bounds?: Bounds) => {
    if (dirtyTrackerRef.current) {
      const element = elements.find(el => el.id === elementId);
      if (element) {
        dirtyTrackerRef.current.markDirty(elementId, bounds || getElementBounds(element));
      }
    }
  }, [elements]);

  const markElementClean = useCallback((elementId: string) => {
    if (dirtyTrackerRef.current) {
      dirtyTrackerRef.current.markClean(elementId);
    }
  }, []);

  const getDirtyRegions = useCallback(() => {
    return dirtyTrackerRef.current?.getDirtyRegions() || [];
  }, []);

  const clearDirtyRegions = useCallback(() => {
    dirtyTrackerRef.current?.clear();
  }, []);

  // Element occlusion culling
  const occlusionCull = useCallback((elements: CanvasElement[]) => {
    if (elements.length < 100) return elements; // Only for large datasets
    
    // Sort by z-index (back to front)
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const visibleElements: CanvasElement[] = [];
    const occludedAreas: Bounds[] = [];
    
    for (const element of sortedElements) {
      const elementBounds = getElementBounds(element);
      
      // Check if element is completely occluded
      const isOccluded = occludedAreas.some(area => 
        elementBounds.x >= area.x &&
        elementBounds.y >= area.y &&
        elementBounds.x + elementBounds.width <= area.x + area.width &&
        elementBounds.y + elementBounds.height <= area.y + area.height
      );
      
      if (!isOccluded) {
        visibleElements.push(element);
        
        // If element is opaque and large enough, add to occluded areas
        if (element.opacity >= 0.95 && element.style?.fill && element.style.fill !== 'transparent') {
          const area = Math.min(elementBounds.width, elementBounds.height) * viewport.zoom;
          if (area > 100) { // Only large elements create occlusion
            occludedAreas.push(elementBounds);
          }
        }
      }
    }
    
    return visibleElements;
  }, [viewport.zoom]);

  // Frustum culling for 3D-like perspective
  const frustumCull = useCallback((elements: CanvasElement[], fov: number = 60) => {
    const tanHalfFov = Math.tan((fov * Math.PI / 180) / 2);
    const viewportCenter = {
      x: viewportBounds.x + viewportBounds.width / 2,
      y: viewportBounds.y + viewportBounds.height / 2
    };
    
    return elements.filter(element => {
      const elementCenter = {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(elementCenter.x - viewportCenter.x, 2) +
        Math.pow(elementCenter.y - viewportCenter.y, 2)
      );
      
      const maxDistance = Math.max(viewportBounds.width, viewportBounds.height) / (2 * tanHalfFov);
      
      return distance <= maxDistance;
    });
  }, [viewportBounds]);

  return {
    // Primary outputs
    visibleElements,
    virtualizedElements,
    levelOfDetailElements,
    
    // Viewport information
    viewportBounds,
    expandedViewportBounds,
    
    // Utility functions
    isElementVisible,
    updateVirtualization,
    
    // Performance
    getPerformanceMetrics,
    
    // Dirty region management
    markElementDirty,
    markElementClean,
    getDirtyRegions,
    clearDirtyRegions,
    
    // Advanced culling
    occlusionCull,
    frustumCull,
    
    // Configuration
    config: finalConfig
  };
};

// Hook for adaptive quality based on performance
export const useAdaptiveQuality = (
  targetFPS: number = 60,
  measurementWindow: number = 1000
) => {
  const [currentFPS, setCurrentFPS] = useState(60);
  const [qualityLevel, setQualityLevel] = useState(1); // 0-1 scale
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    enableAntialiasing: true,
    enableShadows: true,
    enableComplexShapes: true,
    renderDistance: 1000
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());

  const measureFPS = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTimeRef.current;
    const fps = 1000 / deltaTime;
    
    frameTimesRef.current.push(fps);
    
    // Keep only recent measurements
    const cutoff = now - measurementWindow;
    frameTimesRef.current = frameTimesRef.current.filter((_, index) => {
      const frameTime = now - (frameTimesRef.current.length - index - 1) * deltaTime;
      return frameTime > cutoff;
    });
    
    // Calculate average FPS
    if (frameTimesRef.current.length > 0) {
      const avgFPS = frameTimesRef.current.reduce((sum, fps) => sum + fps, 0) / frameTimesRef.current.length;
      setCurrentFPS(avgFPS);
    }
    
    lastFrameTimeRef.current = now;
  }, [measurementWindow]);

  // Adjust quality based on FPS
  useEffect(() => {
    const fpsRatio = currentFPS / targetFPS;
    let newQualityLevel = qualityLevel;
    
    if (fpsRatio < 0.8) {
      // FPS too low, reduce quality
      newQualityLevel = Math.max(0.1, qualityLevel - 0.1);
    } else if (fpsRatio > 1.2) {
      // FPS high enough, increase quality
      newQualityLevel = Math.min(1.0, qualityLevel + 0.05);
    }
    
    if (newQualityLevel !== qualityLevel) {
      setQualityLevel(newQualityLevel);
      
      // Adjust settings based on quality level
      setAdaptiveSettings({
        enableAntialiasing: newQualityLevel > 0.7,
        enableShadows: newQualityLevel > 0.5,
        enableComplexShapes: newQualityLevel > 0.3,
        renderDistance: 1000 * newQualityLevel
      });
    }
  }, [currentFPS, targetFPS, qualityLevel]);

  return {
    currentFPS,
    qualityLevel,
    adaptiveSettings,
    measureFPS,
    isPerformanceGood: currentFPS >= targetFPS * 0.9
  };
};

export default useVirtualization;
