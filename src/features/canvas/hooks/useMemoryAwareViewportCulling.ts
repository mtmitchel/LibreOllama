/**
 * Example integration of memory-optimized culling with existing viewport system
 * 
 * This shows how to integrate the memory optimization with your existing
 * useViewportCulling hook for immediate memory savings.
 */

import { useCallback, useEffect, useState } from 'react';
import { useViewportCulling, type UseViewportCullingProps } from '../hooks/useViewportCulling';
import { useMemoryOptimizedCulling } from '../utils/memory/MemoryOptimizedCulling';

/**
 * Enhanced viewport culling with memory optimization
 */
export function useMemoryAwareViewportCulling(props: UseViewportCullingProps) {
  const { getOptimizedConfig, memoryPressure, getLODLevel } = useMemoryOptimizedCulling();
  const [lastMemoryCheck, setLastMemoryCheck] = useState(Date.now());
  
  // Base culling configuration
  const baseCullingConfig = {
    enableHierarchicalCulling: true,
    enableLOD: true,
    enableIntersectionObserver: true,
    enableQuadtree: true,
    bufferMultiplier: 1.0,
    lodThresholds: {
      high: 2.0,
      medium: 0.5,
      low: 0.1
    },
    maxElementsPerGroup: 50,
    quadtreeConfig: {
      maxDepth: 8,
      maxElementsPerNode: 10,
      minNodeSize: 50
    }
  };
  
  // Get memory-optimized configuration
  const optimizedConfig = getOptimizedConfig(baseCullingConfig);
  
  // Use the original viewport culling hook with optimized config
  const cullingResult = useViewportCulling({
    ...props,
    config: optimizedConfig
  });
  
  // Log memory pressure changes
  useEffect(() => {
    const now = Date.now();
    if (now - lastMemoryCheck > 5000) { // Check every 5 seconds
      console.log(`[Memory] Pressure level: ${memoryPressure.level} (${(memoryPressure.memoryUsage * 100).toFixed(1)}%)`);
      console.log(`[Memory] Quadtree nodes per element: ${optimizedConfig.quadtreeConfig?.maxElementsPerNode}`);
      console.log(`[Memory] Viewport buffer: ${optimizedConfig.bufferMultiplier}x`);
      setLastMemoryCheck(now);
    }
  }, [memoryPressure, optimizedConfig, lastMemoryCheck]);
  
  // Enhanced LOD level calculation
  const getEnhancedLODLevel = useCallback((zoom: number) => {
    return getLODLevel(zoom, props.elements.length);
  }, [getLODLevel, props.elements.length]);
  
  return {
    ...cullingResult,
    memoryPressure,
    getLODLevel: getEnhancedLODLevel,
    isMemoryOptimized: memoryPressure.level !== 'normal'
  };
}

/**
 * Quick integration instructions for existing components
 * 
 * To use this in your existing Canvas component:
 * 
 * 1. Replace your useViewportCulling import:
 *    // OLD: import { useViewportCulling } from './useViewportCulling';  
 *    // NEW: import { useMemoryAwareViewportCulling } from './useMemoryAwareViewportCulling';
 * 
 * 2. Replace the hook call:
 *    // OLD: const cullingResult = useViewportCulling(props);
 *    // NEW: const cullingResult = useMemoryAwareViewportCulling(props);
 * 
 * 3. Access the additional memory information:
 *    const { visibleElements, memoryPressure, isMemoryOptimized } = cullingResult;
 * 
 * 4. Optional: Add memory pressure indicator to your UI:
 *    {isMemoryOptimized && <div>Memory optimization: {memoryPressure.level}</div>}
 */
