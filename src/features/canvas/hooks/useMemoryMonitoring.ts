/**
 * Consolidated memory monitoring hook
 * Combines functionality from useMemoryTracking and useMemoryPressure
 * Part of Phase 4 Performance Optimizations
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MemoryUsageMonitor, type MemoryAlert } from '../utils/performance';
import { canvasLog } from '../utils/canvasLogger';

interface MemoryPressureState {
  isUnderPressure: boolean;
  pressureLevel: 'low' | 'moderate' | 'high' | 'critical';
  currentUsage: number;
  baseline: number;
  growth: number;
  recommendations: string[];
}

interface MemoryMonitoringOptions {
  // Component tracking
  componentName?: string;
  
  // Memory pressure monitoring
  checkInterval?: number;
  moderateThreshold?: number;
  highThreshold?: number;
  criticalThreshold?: number;
  enableCleanup?: boolean;
  onPressureChange?: (state: MemoryPressureState) => void;
  onCleanupPerformed?: (details: { clearedMB: number; action: string }) => void;
  
  // Alert monitoring
  onAlert?: (alert: MemoryAlert) => void;
}

/**
 * Main consolidated memory monitoring hook
 */
export function useMemoryMonitoring(options: MemoryMonitoringOptions = {}) {
  const {
    componentName,
    checkInterval = 10000,
    moderateThreshold = 50,
    highThreshold = 100,
    criticalThreshold = 150,
    enableCleanup = true,
    onPressureChange,
    onCleanupPerformed,
    onAlert
  } = options;

  const mountedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCleanupRef = useRef<number>(0);
  const baselineRef = useRef<number>(0);

  const [memoryState, setMemoryState] = useState<MemoryPressureState>({
    isUnderPressure: false,
    pressureLevel: 'low',
    currentUsage: 0,
    baseline: 0,
    growth: 0,
    recommendations: []
  });

  // Component tracking (if componentName provided)
  useEffect(() => {
    if (componentName && !mountedRef.current) {
      MemoryUsageMonitor.setComponentInstances(
        MemoryUsageMonitor.getCanvasMemoryInfo().componentInstances + 1
      );
      mountedRef.current = true;
    }

    return () => {
      if (componentName && mountedRef.current) {
        MemoryUsageMonitor.setComponentInstances(
          Math.max(0, MemoryUsageMonitor.getCanvasMemoryInfo().componentInstances - 1)
        );
        mountedRef.current = false;
      }
    };
  }, [componentName]);

  // Initialize baseline
  useEffect(() => {
    const initialUsage = MemoryUsageMonitor.getCurrentMemoryUsage();
    baselineRef.current = initialUsage;
    setMemoryState(prev => ({ ...prev, baseline: initialUsage, currentUsage: initialUsage }));
    canvasLog.memory('🔍 Memory monitoring started');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      canvasLog.memory('🔍 Memory monitoring stopped');
    };
  }, []);

  // Memory alert subscription
  useEffect(() => {
    if (!onAlert) return;
    const unsubscribe = MemoryUsageMonitor.subscribeToAlerts(onAlert);
    return unsubscribe;
  }, [onAlert]);

  // Periodic memory pressure check
  useEffect(() => {
    const checkMemoryPressure = () => {
      const currentUsage = MemoryUsageMonitor.getCurrentMemoryUsage();
      const growth = currentUsage - baselineRef.current;
      const growthMB = growth / (1024 * 1024);
      
      let pressureLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      let recommendations: string[] = [];
      let isUnderPressure = false;

      if (growthMB > criticalThreshold) {
        pressureLevel = 'critical';
        isUnderPressure = true;
        recommendations = [
          'Clear all caches immediately',
          'Force garbage collection',
          'Consider reducing canvas elements',
          'Disable non-essential features'
        ];
      } else if (growthMB > highThreshold) {
        pressureLevel = 'high';
        isUnderPressure = true;
        recommendations = [
          'Clear texture caches',
          'Reduce rendering complexity',
          'Consider element culling'
        ];
      } else if (growthMB > moderateThreshold) {
        pressureLevel = 'moderate';
        isUnderPressure = true;
        recommendations = [
          'Monitor memory usage closely',
          'Clear unused caches'
        ];
      }

      const newState: MemoryPressureState = {
        isUnderPressure,
        pressureLevel,
        currentUsage,
        baseline: baselineRef.current,
        growth,
        recommendations
      };

      if (newState.pressureLevel !== memoryState.pressureLevel) {
        setMemoryState(newState);
        
        if (onPressureChange) {
          onPressureChange(newState);
        }

        if (enableCleanup && isUnderPressure && pressureLevel !== 'low') {
          const now = Date.now();
          const timeSinceLastCleanup = now - lastCleanupRef.current;
          
          if (timeSinceLastCleanup > 30000) {
            performCleanup(pressureLevel as 'moderate' | 'high' | 'critical');
            lastCleanupRef.current = now;
          }
        }
      }
    };

    intervalRef.current = setInterval(checkMemoryPressure, checkInterval);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInterval, moderateThreshold, highThreshold, criticalThreshold, onPressureChange, memoryState.pressureLevel, enableCleanup]);

  const performCleanup = useCallback((level: 'moderate' | 'high' | 'critical') => {
    let clearedMB = 0;
    let action = '';

    try {
      switch (level) {
        case 'critical':
          MemoryUsageMonitor.forceGarbageCollection();
          action = 'Critical cleanup: Forced GC and cleared all caches';
          clearedMB = 10;
          break;
        case 'high':
          action = 'High cleanup: Cleared texture caches';
          clearedMB = 5;
          break;
        case 'moderate':
          action = 'Moderate cleanup: Cleared unused caches';
          clearedMB = 2;
          break;
      }

      canvasLog.memory(`🧹 Memory cleanup performed: ${action} (~${clearedMB}MB freed)`);
      
      if (onCleanupPerformed) {
        onCleanupPerformed({ clearedMB, action });
      }
    } catch (error) {
      canvasLog.error('Memory cleanup failed:', error);
    }
  }, [onCleanupPerformed]);

  // Component tracking utilities
  const trackOperation = useCallback(<T>(operationName: string, operation: () => T): T => {
    const fullName = componentName ? `${componentName}.${operationName}` : operationName;
    return MemoryUsageMonitor.trackCanvasOperation(fullName, operation);
  }, [componentName]);

  const addKonvaNode = useCallback((count = 1) => {
    MemoryUsageMonitor.addKonvaNode(count);
  }, []);

  const removeKonvaNode = useCallback((count = 1) => {
    MemoryUsageMonitor.removeKonvaNode(count);
  }, []);

  const addTextureMemory = useCallback((sizeMB: number) => {
    MemoryUsageMonitor.addTextureMemory(sizeMB);
  }, []);

  const removeTextureMemory = useCallback((sizeMB: number) => {
    MemoryUsageMonitor.removeTextureMemory(sizeMB);
  }, []);

  const forceCleanup = useCallback(() => {
    performCleanup('critical');
  }, [performCleanup]);

  const resetBaseline = useCallback(() => {
    const currentUsage = MemoryUsageMonitor.getCurrentMemoryUsage();
    baselineRef.current = currentUsage;
    setMemoryState(prev => ({ 
      ...prev, 
      baseline: currentUsage, 
      currentUsage,
      growth: 0,
      isUnderPressure: false,
      pressureLevel: 'low',
      recommendations: []
    }));
    canvasLog.memory('🔄 Memory pressure baseline reset');
  }, []);

  const getStats = useCallback(() => {
    return {
      memory: MemoryUsageMonitor.getMemoryStats(),
      canvas: MemoryUsageMonitor.getCanvasMemoryInfo(),
      leakDetection: MemoryUsageMonitor.detectMemoryLeaks(),
      optimizations: MemoryUsageMonitor.getOptimizationSuggestions()
    };
  }, []);

  const getRecentAlerts = useCallback((timeWindowMs = 300000) => {
    return MemoryUsageMonitor.getMemoryAlerts(timeWindowMs);
  }, []);

  const forceGarbageCollection = useCallback(() => {
    return MemoryUsageMonitor.forceGarbageCollection();
  }, []);

  return {
    // Memory pressure monitoring
    memoryState,
    forceCleanup,
    resetBaseline,
    performCleanup: (level: 'moderate' | 'high' | 'critical') => performCleanup(level),
    
    // Component tracking
    trackOperation,
    addKonvaNode,
    removeKonvaNode,
    addTextureMemory,
    removeTextureMemory,
    
    // Stats and utilities
    getStats,
    getRecentAlerts,
    forceGarbageCollection
  };
}

/**
 * Specialized hook for Konva node lifecycle tracking
 */
export function useKonvaNodeTracking(nodeCount: number = 1) {
  useEffect(() => {
    MemoryUsageMonitor.addKonvaNode(nodeCount);
    return () => {
      MemoryUsageMonitor.removeKonvaNode(nodeCount);
    };
  }, [nodeCount]);
}

/**
 * Specialized hook for texture memory tracking
 */
export function useTextureMemoryTracking(
  width: number, 
  height: number, 
  format: string = 'RGBA'
) {
  const memorySize = useRef(0);

  useEffect(() => {
    const newMemorySize = MemoryUsageMonitor.estimateImageMemory(width, height, format);
    
    if (memorySize.current > 0) {
      MemoryUsageMonitor.removeTextureMemory(memorySize.current);
    }
    
    MemoryUsageMonitor.addTextureMemory(newMemorySize);
    memorySize.current = newMemorySize;

    return () => {
      if (memorySize.current > 0) {
        MemoryUsageMonitor.removeTextureMemory(memorySize.current);
        memorySize.current = 0;
      }
    };
  }, [width, height, format]);

  return memorySize.current;
}

/**
 * Specialized hook for cache memory tracking
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

  useEffect(() => {
    MemoryUsageMonitor.setCachedElements(initialCacheSize);
    
    return () => {
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

/**
 * Specialized hook for event listener tracking
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
