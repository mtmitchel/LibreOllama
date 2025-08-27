import { useRef, useCallback, useEffect } from 'react';
import { canvasLog } from '../utils/canvasLogger';

/**
 * Enhanced RequestAnimationFrame management hook
 * 
 * Features:
 * - Automatic RAF cleanup on unmount
 * - Named RAF tracking for debugging
 * - Memory leak prevention
 * - Advanced performance monitoring
 * - RAF batching and throttling
 * - Priority-based scheduling
 * - Automatic frame budget management
 */

interface RAFEntry {
  id: number;
  name: string;
  createdAt: number;
  priority: RAFPriority;
  callback: () => void;
}

interface RAFStats {
  activeCount: number;
  totalCreated: number;
  totalCanceled: number;
  longestRunning: number;
  frameBudgetExceeded: number;
  batchedOperations: number;
}

enum RAFPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

interface BatchedOperation {
  callback: () => void;
  priority: RAFPriority;
  name: string;
}

export const useRAFManager = (componentName?: string) => {
  const rafMap = useRef<Map<string, RAFEntry>>(new Map());
  const batchedOperations = useRef<BatchedOperation[]>([]);
  const frameStartTime = useRef<number>(0);
  const FRAME_BUDGET = 16.67; // Target 60fps = 16.67ms per frame
  
  const statsRef = useRef<RAFStats>({
    activeCount: 0,
    totalCreated: 0,
    totalCanceled: 0,
    longestRunning: 0,
    frameBudgetExceeded: 0,
    batchedOperations: 0
  });

  // Expose stats to monitoring system
  useEffect(() => {
    if (!((window as any).__RAF_MANAGER_STATS__)) {
      (window as any).__RAF_MANAGER_STATS__ = {
        activeCount: 0,
        totalCreated: 0,
        totalCanceled: 0,
        longestRunning: 0
      };
    }
    
    // Update global stats
    const globalStats = (window as any).__RAF_MANAGER_STATS__;
    globalStats.activeCount = Math.max(globalStats.activeCount, statsRef.current.activeCount);
    globalStats.totalCreated += statsRef.current.totalCreated;
    globalStats.totalCanceled += statsRef.current.totalCanceled;
    globalStats.longestRunning = Math.max(globalStats.longestRunning, statsRef.current.longestRunning);
  });

  // Enhanced RAF scheduling with priority and batching
  const scheduleRAF = useCallback((
    callback: () => void,
    name: string = 'anonymous',
    priority: RAFPriority = RAFPriority.NORMAL
  ): string => {
    const rafKey = `${componentName || 'unknown'}-${name}-${Date.now()}`;
    
    const rafId = requestAnimationFrame(() => {
      frameStartTime.current = performance.now();
      const startTime = frameStartTime.current;
      
      try {
        // Process batched operations with remaining frame budget
        processBatchedOperations();
        
        // Execute main callback
        callback();
      } catch (error) {
        canvasLog.error(`🚨 [RAFManager] Error in RAF callback '${rafKey}':`, error);
      } finally {
        // Clean up from map
        rafMap.current.delete(rafKey);
        statsRef.current.activeCount--;
        
        const executionTime = performance.now() - startTime;
        if (executionTime > statsRef.current.longestRunning) {
          statsRef.current.longestRunning = executionTime;
        }
        
        if (executionTime > FRAME_BUDGET) {
          statsRef.current.frameBudgetExceeded++;
        }
      }
    });

    // Track RAF entry
    const entry: RAFEntry = {
      id: rafId,
      name: rafKey,
      createdAt: performance.now(),
      priority,
      callback
    };
    
    rafMap.current.set(rafKey, entry);
    statsRef.current.activeCount++;
    statsRef.current.totalCreated++;

    return rafKey;
  }, [componentName]);

  // Batch operations to be processed within frame budget
  const batchRAF = useCallback((
    callback: () => void,
    name: string = 'batched',
    priority: RAFPriority = RAFPriority.LOW
  ): void => {
    batchedOperations.current.push({
      callback,
      priority,
      name: `${componentName || 'unknown'}-${name}`
    });
    
    statsRef.current.batchedOperations++;
  }, [componentName]);

  // Process batched operations within frame budget
  const processBatchedOperations = useCallback(() => {
    if (batchedOperations.current.length === 0) return;
    
    // Sort by priority
    batchedOperations.current.sort((a, b) => b.priority - a.priority);
    
    const startTime = performance.now();
    let processed = 0;
    
    while (
      batchedOperations.current.length > 0 && 
      (performance.now() - frameStartTime.current) < FRAME_BUDGET * 0.8 // Use 80% of frame budget
    ) {
      const operation = batchedOperations.current.shift();
      if (operation) {
        try {
          operation.callback();
          processed++;
        } catch (error) {
          canvasLog.error(`🚨 [RAFManager] Error in batched operation '${operation.name}':`, error);
        }
      }
    }
    
    if (processed > 0) {
      canvasLog.debug(`⚡ [RAFManager] Processed ${processed} batched operations in ${(performance.now() - startTime).toFixed(2)}ms`);
    }
  }, []);

  // Priority-based scheduling
  const scheduleHighPriorityRAF = useCallback((
    callback: () => void,
    name: string = 'high-priority'
  ): string => {
    return scheduleRAF(callback, name, RAFPriority.HIGH);
  }, [scheduleRAF]);

  const scheduleCriticalRAF = useCallback((
    callback: () => void,
    name: string = 'critical'
  ): string => {
    return scheduleRAF(callback, name, RAFPriority.CRITICAL);
  }, [scheduleRAF]);

  const cancelRAF = useCallback((rafKey: string): boolean => {
    const entry = rafMap.current.get(rafKey);
    if (!entry) {
      return false;
    }

    cancelAnimationFrame(entry.id);
    rafMap.current.delete(rafKey);
    statsRef.current.activeCount--;
    statsRef.current.totalCanceled++;

    return true;
  }, []);

  const cancelAllRAFs = useCallback(() => {
    let canceledCount = 0;
    
    rafMap.current.forEach((entry) => {
      cancelAnimationFrame(entry.id);
      canceledCount++;
    });

    rafMap.current.clear();
    statsRef.current.activeCount = 0;
    statsRef.current.totalCanceled += canceledCount;

    if (canceledCount > 0) {
      canvasLog.debug(`🔄 [RAFManager] Canceled ${canceledCount} pending RAF calls for ${componentName}`);
    }

    return canceledCount;
  }, [componentName]);

  const getRAFStats = useCallback((): RAFStats & { pendingRAFs: string[] } => {
    const pendingRAFs = Array.from(rafMap.current.keys());
    return {
      ...statsRef.current,
      pendingRAFs
    };
  }, []);

  const scheduleThrottledRAF = useCallback((
    callback: () => void,
    name: string = 'throttled',
    throttleMs: number = 16 // ~60fps
  ): string => {
    const throttleKey = `${name}-throttle`;
    
    // Cancel existing throttled RAF if it exists
    const existingEntry = Array.from(rafMap.current?.entries() || [])
      .find(([key]) => key.includes(throttleKey));
    
    if (existingEntry) {
      cancelRAF(existingEntry[0]);
    }

    // Schedule new throttled RAF
    return scheduleRAF(() => {
      callback();
    }, throttleKey);
  }, [scheduleRAF, cancelRAF]);

  // Automatic cleanup on unmount
  useEffect(() => {
    return () => {
      const canceledCount = cancelAllRAFs();
      if (canceledCount > 0) {
        canvasLog.warn(`🧹 [RAFManager] Cleaned up ${canceledCount} RAF calls on unmount for ${componentName}`);
      }
    };
  }, [cancelAllRAFs, componentName]);

  // Development monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const monitoringInterval = setInterval(() => {
        const stats = getRAFStats();
        
        if (stats.activeCount > 10) {
          canvasLog.warn(`⚠️ [RAFManager] High RAF count detected for ${componentName}:`, {
            activeCount: stats.activeCount,
            pendingRAFs: stats.pendingRAFs.slice(0, 5) // Show first 5
          });
        }

        // Check for long-running RAFs
        const now = performance.now();
        rafMap.current.forEach((entry, key) => {
          const age = now - entry.createdAt;
          if (age > 1000) { // 1 second
            canvasLog.warn(`🐌 [RAFManager] Long-running RAF detected:`, {
              name: key,
              ageMs: age.toFixed(2),
              component: componentName
            });
          }
        });
      }, 5000);

      return () => clearInterval(monitoringInterval);
    }
  }, [componentName, getRAFStats]);

  return {
    scheduleRAF,
    batchRAF,
    scheduleHighPriorityRAF,
    scheduleCriticalRAF,
    cancelRAF,
    cancelAllRAFs,
    getRAFStats,
    scheduleThrottledRAF,
    processBatchedOperations,
    getFrameBudget: () => FRAME_BUDGET,
    getCurrentFrameTime: () => performance.now() - frameStartTime.current
  };
};

/**
 * Hook for simple, single RAF management
 * Automatically cancels the RAF on unmount or when a new one is scheduled
 */
export const useSingleRAF = (componentName?: string) => {
  const rafManager = useRAFManager(componentName);
  const currentRAFKey = useRef<string | null>(null);

  const scheduleRAF = useCallback((
    callback: () => void,
    name: string = 'single'
  ) => {
    // Cancel existing RAF if any
    if (currentRAFKey.current) {
      rafManager.cancelRAF(currentRAFKey.current);
    }

    // Schedule new RAF
    currentRAFKey.current = rafManager.scheduleRAF(callback, name);
    return currentRAFKey.current;
  }, [rafManager]);

  const cancelRAF = useCallback(() => {
    if (currentRAFKey.current) {
      const canceled = rafManager.cancelRAF(currentRAFKey.current);
      if (canceled) {
        currentRAFKey.current = null;
      }
      return canceled;
    }
    return false;
  }, [rafManager]);

  return {
    scheduleRAF,
    cancelRAF,
    isScheduled: () => currentRAFKey.current !== null,
    getStats: rafManager.getRAFStats
  };
};