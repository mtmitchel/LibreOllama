// src/hooks/canvas/useMemoryTracking.ts
/**
 * React hooks for integrating memory tracking with canvas components
 * Part of Phase 4 Performance Optimizations
 */

import { useEffect, useCallback, useRef } from 'react';
import { MemoryUsageMonitor, type MemoryAlert } from '../utils/performance/MemoryUsageMonitor';

/**
 * Hook for tracking component memory usage
 */
export function useComponentMemoryTracking(componentName: string) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      // Track component mount
      MemoryUsageMonitor.setComponentInstances(
        MemoryUsageMonitor.getCanvasMemoryInfo().componentInstances + 1
      );
      mountedRef.current = true;
    }

    return () => {
      // Track component unmount
      if (mountedRef.current) {
        MemoryUsageMonitor.setComponentInstances(
          Math.max(0, MemoryUsageMonitor.getCanvasMemoryInfo().componentInstances - 1)
        );
        mountedRef.current = false;
      }
    };
  }, []);

  // Return tracking utilities
  return {
    trackOperation: useCallback(<T>(operationName: string, operation: () => T): T => {
      return MemoryUsageMonitor.trackCanvasOperation(`${componentName}.${operationName}`, operation);
    }, [componentName]),
    
    addKonvaNode: useCallback((count = 1) => {
      MemoryUsageMonitor.addKonvaNode(count);
    }, []),
    
    removeKonvaNode: useCallback((count = 1) => {
      MemoryUsageMonitor.removeKonvaNode(count);
    }, []),
    
    addTextureMemory: useCallback((sizeMB: number) => {
      MemoryUsageMonitor.addTextureMemory(sizeMB);
    }, []),
    
    removeTextureMemory: useCallback((sizeMB: number) => {
      MemoryUsageMonitor.removeTextureMemory(sizeMB);
    }, [])
  };
}

/**
 * Hook for tracking Konva node lifecycle
 */
export function useKonvaNodeTracking(nodeCount: number = 1) {
  useEffect(() => {
    // Add nodes on mount
    MemoryUsageMonitor.addKonvaNode(nodeCount);
    
    return () => {
      // Remove nodes on unmount
      MemoryUsageMonitor.removeKonvaNode(nodeCount);
    };
  }, [nodeCount]);
}

/**
 * Hook for tracking image/texture memory
 */
export function useTextureMemoryTracking(
  width: number, 
  height: number, 
  format: string = 'RGBA'
) {
  const memorySize = useRef(0);

  useEffect(() => {
    // Calculate and track texture memory
    const newMemorySize = MemoryUsageMonitor.estimateImageMemory(width, height, format);
    
    // Remove old memory tracking if it exists
    if (memorySize.current > 0) {
      MemoryUsageMonitor.removeTextureMemory(memorySize.current);
    }
    
    // Add new memory tracking
    MemoryUsageMonitor.addTextureMemory(newMemorySize);
    memorySize.current = newMemorySize;

    return () => {
      // Cleanup on unmount
      if (memorySize.current > 0) {
        MemoryUsageMonitor.removeTextureMemory(memorySize.current);
        memorySize.current = 0;
      }
    };
  }, [width, height, format]);

  return memorySize.current;
}

/**
 * Hook for monitoring memory alerts
 */
export function useMemoryAlerts(onAlert?: (alert: MemoryAlert) => void) {
  useEffect(() => {
    if (!onAlert) return;

    const unsubscribe = MemoryUsageMonitor.subscribeToAlerts(onAlert);
    return unsubscribe;
  }, [onAlert]);

  return {
    getRecentAlerts: useCallback((timeWindowMs = 300000) => {
      return MemoryUsageMonitor.getMemoryAlerts(timeWindowMs);
    }, []),
    
    forceGarbageCollection: useCallback(() => {
      return MemoryUsageMonitor.forceGarbageCollection();
    }, [])
  };
}

/**
 * Hook for getting canvas memory statistics
 */
export function useCanvasMemoryStats() {
  const getStats = useCallback(() => {
    return {
      memory: MemoryUsageMonitor.getMemoryStats(),
      canvas: MemoryUsageMonitor.getCanvasMemoryInfo(),
      leakDetection: MemoryUsageMonitor.detectMemoryLeaks(),
      optimizations: MemoryUsageMonitor.getOptimizationSuggestions()
    };
  }, []);

  return getStats;
}

/**
 * Hook for tracking event listeners
 */
export function useEventListenerTracking() {
  const listenerCountRef = useRef(0);

  const addListener = useCallback(() => {
    listenerCountRef.current++;
    MemoryUsageMonitor.setEventListeners(
      MemoryUsageMonitor.getCanvasMemoryInfo().eventListeners + 1
    );
  }, []);

  const removeListener = useCallback(() => {
    if (listenerCountRef.current > 0) {
      listenerCountRef.current--;
      MemoryUsageMonitor.setEventListeners(
        Math.max(0, MemoryUsageMonitor.getCanvasMemoryInfo().eventListeners - 1)
      );
    }
  }, []);

  const removeAllListeners = useCallback(() => {
    if (listenerCountRef.current > 0) {
      MemoryUsageMonitor.setEventListeners(
        Math.max(0, MemoryUsageMonitor.getCanvasMemoryInfo().eventListeners - listenerCountRef.current)
      );
      listenerCountRef.current = 0;
    }
  }, []);

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      removeAllListeners();
    };
  }, [removeAllListeners]);

  return {
    addListener,
    removeListener,
    removeAllListeners,
    getListenerCount: () => listenerCountRef.current
  };
}

/**
 * Utility for tracking cache memory usage
 */
export function useCacheMemoryTracking(initialCacheSize: number = 0) {
  const currentSizeRef = useRef(initialCacheSize);

  const updateCacheSize = useCallback((newSize: number) => {
    currentSizeRef.current = newSize;
    MemoryUsageMonitor.setCachedElements(newSize);
  }, []);

  const incrementCache = useCallback((count: number = 1) => {
    updateCacheSize(currentSizeRef.current + count);
  }, [updateCacheSize]);

  const decrementCache = useCallback((count: number = 1) => {
    updateCacheSize(Math.max(0, currentSizeRef.current - count));
  }, [updateCacheSize]);

  const clearCache = useCallback(() => {
    updateCacheSize(0);
  }, [updateCacheSize]);

  // Initialize cache size tracking
  useEffect(() => {
    MemoryUsageMonitor.setCachedElements(initialCacheSize);
    
    return () => {
      // Clean up cache tracking on unmount
      MemoryUsageMonitor.setCachedElements(
        Math.max(0, MemoryUsageMonitor.getCanvasMemoryInfo().cachedElements - currentSizeRef.current)
      );
    };
  }, [initialCacheSize]);

  return {
    updateCacheSize,
    incrementCache,
    decrementCache,
    clearCache,
    getCurrentSize: () => currentSizeRef.current
  };
}
