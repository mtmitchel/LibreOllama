/**
 * Canvas Loading State Management System
 * 
 * Provides centralized loading state management for:
 * - Element creation and updates
 * - Store operations
 * - File operations (save/load)
 * - Image loading
 * - Font loading
 * - Background operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { canvasLog } from '../utils/canvasLogger';
import { recordCanvasMetric } from '../utils/performance/performanceTracker';

export type LoadingOperation = 
  | 'element-create'
  | 'element-update'
  | 'element-delete'
  | 'store-save'
  | 'store-load'
  | 'image-load'
  | 'font-load'
  | 'file-save'
  | 'file-load'
  | 'canvas-export'
  | 'bulk-operation';

interface LoadingState {
  isLoading: boolean;
  operation: LoadingOperation | null;
  progress: number; // 0-100
  message: string;
  startTime: number | null;
  estimatedDuration?: number; // in milliseconds
}

interface LoadingEntry {
  id: string;
  operation: LoadingOperation;
  startTime: number;
  promise: Promise<any>;
  metadata?: Record<string, unknown>;
}

interface LoadingHookOptions {
  defaultMessage?: string;
  enableAutoTimeout?: boolean;
  timeoutDuration?: number;
  enableProgressTracking?: boolean;
}

export const useLoadingStates = (options: LoadingHookOptions = {}) => {
  const {
    defaultMessage = 'Loading...',
    enableAutoTimeout = true,
    timeoutDuration = 30000, // 30 seconds
    enableProgressTracking = false
  } = options;

  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());
  const [globalLoading, setGlobalLoading] = useState<LoadingState>({
    isLoading: false,
    operation: null,
    progress: 0,
    message: '',
    startTime: null
  });

  const activeOperations = useRef<Map<string, LoadingEntry>>(new Map());
  const timeouts = useRef<Map<string, number>>(new Map());

  const startLoading = useCallback((
    operation: LoadingOperation,
    message?: string,
    operationId?: string
  ): string => {
    const id = operationId || `${operation}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const startTime = performance.now();

    const newState: LoadingState = {
      isLoading: true,
      operation,
      progress: 0,
      message: message || defaultMessage,
      startTime
    };

    // Update individual loading state
    setLoadingStates(prev => new Map(prev).set(id, newState));

    // Update global loading state if no other operations are running
    setGlobalLoading(prev => ({
      ...newState,
      isLoading: prev.isLoading || true // Keep loading if other operations are running
    }));

    // Set up auto-timeout if enabled
    if (enableAutoTimeout) {
      const timeoutId = window.setTimeout(() => {
        canvasLog.warn(`⚠️ [LoadingStates] Operation '${operation}' timed out after ${timeoutDuration}ms`);
        finishLoading(id, new Error(`Operation ${operation} timed out`));
      }, timeoutDuration);

      timeouts.current.set(id, timeoutId);
    }

    canvasLog.debug(`🔄 [LoadingStates] Started loading: ${operation}`, { id, message });

    return id;
  }, [defaultMessage, enableAutoTimeout, timeoutDuration]);

  const updateProgress = useCallback((
    operationId: string,
    progress: number,
    message?: string
  ) => {
    if (!enableProgressTracking) return;

    setLoadingStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(operationId);
      if (currentState) {
        newMap.set(operationId, {
          ...currentState,
          progress: Math.max(0, Math.min(100, progress)),
          message: message || currentState.message
        });
      }
      return newMap;
    });

    // Update global progress (average of all operations)
    setGlobalLoading(prev => {
      const states = Array.from(loadingStates.values());
      const avgProgress = states.length > 0 
        ? states.reduce((sum, state) => sum + state.progress, 0) / states.length 
        : 0;

      return {
        ...prev,
        progress: avgProgress,
        message: message || prev.message
      };
    });
  }, [enableProgressTracking, loadingStates]);

  const finishLoading = useCallback((
    operationId: string,
    error?: Error | null
  ) => {
    const entry = activeOperations.current.get(operationId);
    const currentState = loadingStates.get(operationId);
    
    if (currentState) {
      const duration = currentState.startTime 
        ? performance.now() - currentState.startTime 
        : 0;

      // Record performance metrics
      recordCanvasMetric(
        `loading-${currentState.operation}`,
        duration,
        error ? 'error' : 'interaction',
        {
          operationId,
          success: !error,
          error: error?.message,
          metadata: entry?.metadata
        }
      );

      if (error) {
        canvasLog.error(`❌ [LoadingStates] Loading failed: ${currentState.operation}`, {
          operationId,
          duration: `${duration.toFixed(2)}ms`,
          error: error.message
        });
      } else {
        canvasLog.debug(`✅ [LoadingStates] Loading completed: ${currentState.operation}`, {
          operationId,
          duration: `${duration.toFixed(2)}ms`
        });
      }
    }

    // Clean up timeout
    const timeoutId = timeouts.current.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeouts.current.delete(operationId);
    }

    // Remove from active operations
    activeOperations.current.delete(operationId);

    // Update loading states
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });

    // Update global loading state
    setGlobalLoading(prev => {
      const hasActiveOperations = loadingStates.size > 1; // > 1 because we haven't updated loadingStates yet
      return {
        ...prev,
        isLoading: hasActiveOperations,
        operation: hasActiveOperations ? prev.operation : null,
        progress: hasActiveOperations ? prev.progress : 0
      };
    });
  }, [loadingStates]);

  const wrapAsyncOperation = useCallback(<T = any>(
    operation: LoadingOperation,
    asyncFn: () => Promise<T>,
    message?: string,
    metadata?: Record<string, unknown>,
    operationId?: string
  ): Promise<T> => {
    const id = startLoading(operation, message, operationId);
    
    const promise = asyncFn()
      .then((result) => {
        finishLoading(id);
        return result;
      })
      .catch((error) => {
        finishLoading(id, error);
        throw error;
      });

    // Track the operation
    activeOperations.current.set(id, {
      id,
      operation,
      startTime: performance.now(),
      promise,
      metadata
    });

    return promise;
  }, [startLoading, finishLoading]);

  const isOperationLoading = useCallback((operation: LoadingOperation): boolean => {
    return Array.from(loadingStates.values()).some(state => 
      state.isLoading && state.operation === operation
    );
  }, [loadingStates]);

  const getOperationProgress = useCallback((operation: LoadingOperation): number => {
    const state = Array.from(loadingStates.values()).find(state => 
      state.operation === operation
    );
    return state?.progress || 0;
  }, [loadingStates]);

  const cancelOperation = useCallback((operationId: string) => {
    const entry = activeOperations.current.get(operationId);
    if (entry && 'abort' in entry.promise) {
      // If the promise has an abort method, call it
      (entry.promise as any).abort();
    }
    
    finishLoading(operationId, new Error('Operation cancelled'));
  }, [finishLoading]);

  const getLoadingStats = useCallback(() => {
    const operations = Array.from(activeOperations.current.values());
    return {
      totalActive: operations.length,
      operationTypes: operations.reduce((acc, op) => {
        acc[op.operation] = (acc[op.operation] || 0) + 1;
        return acc;
      }, {} as Record<LoadingOperation, number>),
      longestRunning: operations.reduce((max, op) => {
        const duration = performance.now() - op.startTime;
        return Math.max(max, duration);
      }, 0)
    };
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all active operations
      activeOperations.current.forEach((_, id) => {
        finishLoading(id, new Error('Component unmounted'));
      });

      // Clear all timeouts
      timeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeouts.current.clear();
    };
  }, [finishLoading]);

  // Development monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const monitoringInterval = setInterval(() => {
        const stats = getLoadingStats();
        if (stats.totalActive > 0) {
          canvasLog.debug('📊 [LoadingStates] Active operations:', stats);
        }
        
        // Warn about long-running operations
        if (stats.longestRunning > 10000) { // 10 seconds
          canvasLog.warn('⏰ [LoadingStates] Long-running operation detected:', {
            longestRunning: `${(stats.longestRunning / 1000).toFixed(2)}s`
          });
        }
      }, 5000);

      return () => clearInterval(monitoringInterval);
    }
  }, [getLoadingStats]);

  return {
    // State
    globalLoading,
    loadingStates: Array.from(loadingStates?.entries() || []).map(([id, state]) => ({ id, ...state })),
    
    // Operations
    startLoading,
    finishLoading,
    updateProgress,
    wrapAsyncOperation,
    cancelOperation,
    
    // Queries
    isOperationLoading,
    getOperationProgress,
    isLoading: globalLoading.isLoading,
    currentOperation: globalLoading.operation,
    currentMessage: globalLoading.message,
    currentProgress: globalLoading.progress,
    
    // Stats
    getLoadingStats
  };
};

/**
 * Hook for simple loading states (single operation at a time)
 */
export const useSimpleLoading = (defaultMessage?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(defaultMessage || 'Loading...');
  const [progress, setProgress] = useState(0);
  const currentOperation = useRef<LoadingOperation | null>(null);
  const startTime = useRef<number | null>(null);

  const startLoading = useCallback((operation: LoadingOperation, loadingMessage?: string) => {
    currentOperation.current = operation;
    startTime.current = performance.now();
    setIsLoading(true);
    setMessage(loadingMessage || defaultMessage || 'Loading...');
    setProgress(0);
    
    canvasLog.debug(`🔄 [SimpleLoading] Started: ${operation}`);
  }, [defaultMessage]);

  const updateProgress = useCallback((newProgress: number, newMessage?: string) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
    if (newMessage) {
      setMessage(newMessage);
    }
  }, []);

  const finishLoading = useCallback((error?: Error | null) => {
    const duration = startTime.current 
      ? performance.now() - startTime.current 
      : 0;

    if (currentOperation.current) {
      recordCanvasMetric(
        `loading-${currentOperation.current}`,
        duration,
        error ? 'error' : 'interaction',
        {
          success: !error,
          error: error?.message
        }
      );

      if (error) {
        canvasLog.error(`❌ [SimpleLoading] Failed: ${currentOperation.current}`, {
          duration: `${duration.toFixed(2)}ms`,
          error: error.message
        });
      } else {
        canvasLog.debug(`✅ [SimpleLoading] Completed: ${currentOperation.current}`, {
          duration: `${duration.toFixed(2)}ms`
        });
      }
    }

    setIsLoading(false);
    setProgress(0);
    currentOperation.current = null;
    startTime.current = null;
  }, []);

  const wrapAsyncOperation = useCallback(<T = any>(
    operation: LoadingOperation,
    asyncFn: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T> => {
    startLoading(operation, loadingMessage);
    
    return asyncFn()
      .then((result) => {
        finishLoading();
        return result;
      })
      .catch((error) => {
        finishLoading(error);
        throw error;
      });
  }, [startLoading, finishLoading]);

  return {
    isLoading,
    message,
    progress,
    currentOperation: currentOperation.current,
    startLoading,
    updateProgress,
    finishLoading,
    wrapAsyncOperation
  };
};