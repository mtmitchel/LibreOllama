/**
 * Memory-Optimized Quadtree Configuration
 * Extends the existing quadtree system with memory-aware optimizations
 */

import type { CullingConfig } from '../../hooks/useViewportCulling';

// Extend Performance interface for memory API
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export interface MemoryPressureLevel {
  level: 'normal' | 'moderate' | 'high' | 'critical';
  memoryUsage: number;
}

/**
 * Get memory-optimized culling configuration based on current memory pressure
 */
export function getMemoryOptimizedCullingConfig(
  memoryPressure: MemoryPressureLevel,
  baseConfig: CullingConfig
): CullingConfig {
  const { level, memoryUsage } = memoryPressure;
  
  switch (level) {
    case 'critical': // >80% memory usage
      return {
        ...baseConfig,
        enableQuadtree: true,
        bufferMultiplier: 0.1,  // Minimal viewport buffer
        lodThresholds: {
          high: 2.5,    // Very high threshold for high detail
          medium: 0.8,  // Aggressive medium detail
          low: 0.1      // Very aggressive low detail
        },
        maxElementsPerGroup: 20,
        quadtreeConfig: {
          maxDepth: 6,            // Shallower tree for less memory
          maxElementsPerNode: 2,  // Fewer elements per node
          minNodeSize: 100        // Larger minimum node size
        }
      };
      
    case 'high': // 60-80% memory usage
      return {
        ...baseConfig,
        enableQuadtree: true,
        bufferMultiplier: 0.25,
        lodThresholds: {
          high: 2.0,
          medium: 0.5,
          low: 0.05
        },
        maxElementsPerGroup: 30,
        quadtreeConfig: {
          maxDepth: 7,
          maxElementsPerNode: 3,
          minNodeSize: 75
        }
      };
      
    case 'moderate': // 40-60% memory usage
      return {
        ...baseConfig,
        enableQuadtree: true,
        bufferMultiplier: 0.5,
        lodThresholds: {
          high: 1.8,
          medium: 0.4,
          low: 0.05
        },
        maxElementsPerGroup: 40,
        quadtreeConfig: {
          maxDepth: 8,
          maxElementsPerNode: 5,
          minNodeSize: 50
        }
      };
      
    default: // <40% memory usage - normal operation
      return baseConfig;
  }
}

/**
 * Memory-aware LOD level calculation
 */
export function getMemoryAwareLODLevel(
  zoomLevel: number,
  memoryPressure: MemoryPressureLevel,
  elementCount: number
) {
  const baseComplexity = zoomLevel >= 2.0 ? 1.0 : 
                        zoomLevel >= 0.5 ? 0.7 : 0.3;
  
  // Reduce complexity based on memory pressure and element count
  let complexityMultiplier = 1.0;
  
  if (memoryPressure.level === 'critical') {
    complexityMultiplier = 0.3;
  } else if (memoryPressure.level === 'high') {
    complexityMultiplier = 0.5;
  } else if (memoryPressure.level === 'moderate') {
    complexityMultiplier = 0.7;
  }
  
  // Further reduce complexity for large canvases
  if (elementCount > 1000) {
    complexityMultiplier *= 0.8;
  } else if (elementCount > 2000) {
    complexityMultiplier *= 0.6;
  }
  
  return {
    level: memoryPressure.level === 'critical' ? 'low' : 
           memoryPressure.level === 'high' ? 'medium' : 'high',
    renderComplexity: Math.max(0.1, baseComplexity * complexityMultiplier),
    enableEffects: memoryPressure.level !== 'critical',
    enableText: memoryPressure.level !== 'critical',
    maxTextSize: memoryPressure.level === 'critical' ? 12 : 
                 memoryPressure.level === 'high' ? 16 : Infinity
  };
}

/**
 * Optimize quadtree rebuild frequency based on memory pressure
 */
export function shouldRebuildQuadtree(
  elementCountChange: number,
  memoryPressure: MemoryPressureLevel,
  timeSinceLastRebuild: number
): boolean {
  const baseThreshold = 10;
  
  // More conservative rebuilding during high memory pressure
  const threshold = memoryPressure.level === 'critical' ? baseThreshold * 3 :
                   memoryPressure.level === 'high' ? baseThreshold * 2 :
                   baseThreshold;
  
  // Also consider time-based rebuilding for memory cleanup
  const timeThreshold = memoryPressure.level === 'critical' ? 30000 : // 30s
                       memoryPressure.level === 'high' ? 60000 :     // 1min
                       300000; // 5min
  
  return Math.abs(elementCountChange) > threshold || 
         timeSinceLastRebuild > timeThreshold;
}

/**
 * Get memory usage level from MemoryUsageMonitor
 */
export function getMemoryPressureLevel(): MemoryPressureLevel {
  // This would integrate with your existing MemoryUsageMonitor
  // For now, using a simple heuristic based on performance.memory if available
  
  if (typeof performance !== 'undefined' && performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
    const memoryUsage = usedJSHeapSize / totalJSHeapSize;
    
    if (memoryUsage > 0.8) {
      return { level: 'critical', memoryUsage };
    } else if (memoryUsage > 0.6) {
      return { level: 'high', memoryUsage };
    } else if (memoryUsage > 0.4) {
      return { level: 'moderate', memoryUsage };
    }
  }
  
  return { level: 'normal', memoryUsage: 0.3 };
}

/**
 * Hook to use memory-optimized viewport culling
 */
export function useMemoryOptimizedCulling() {
  const memoryPressure = getMemoryPressureLevel();
  
  return {
    memoryPressure,
    getOptimizedConfig: (baseConfig: CullingConfig) => 
      getMemoryOptimizedCullingConfig(memoryPressure, baseConfig),
    getLODLevel: (zoom: number, elementCount: number) =>
      getMemoryAwareLODLevel(zoom, memoryPressure, elementCount)
  };
}
