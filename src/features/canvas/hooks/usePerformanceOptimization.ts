// Performance Optimization Utilities - Phase 4
import React, { useCallback, useRef, useMemo } from 'react';

/**
 * useThrottledUpdate - Throttles high-frequency updates using requestAnimationFrame
 * Prevents excessive re-renders during drag operations and transformations
 */
export const useThrottledUpdate = (updateFn: Function, delay = 16) => {
  const frameRef = useRef<number | null>(null);
  const lastCallTime = useRef<number>(0);
  
  return useCallback((...args: any[]) => {
    const now = performance.now();
    
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    // Throttle to maintain 60fps
    if (now - lastCallTime.current >= delay) {
      updateFn(...args);
      lastCallTime.current = now;
    } else {
      frameRef.current = requestAnimationFrame(() => {
        updateFn(...args);
        lastCallTime.current = performance.now();
      });
    }
  }, [updateFn, delay]);
};

/**
 * useDebounced - Debounces rapid successive calls
 * Useful for search, validation, and expensive operations
 */
export const useDebounced = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Simple Memoized Selectors without external dependencies
 * Creates memoized selectors for complex state calculations
 */
export const createMemoizedSelector = <TState, TResult>(
  selector: (state: TState) => TResult,
  equalityFn?: (a: TResult, b: TResult) => boolean
) => {
  let lastState: TState | undefined;
  let lastResult: TResult;
  
  const defaultEqualityFn = (a: TResult, b: TResult): boolean => {
    return a === b;
  };
  
  const isEqual = equalityFn || defaultEqualityFn;
  
  return (state: TState): TResult => {
    if (lastState === undefined || lastState !== state) {
      const newResult = selector(state);
      
      if (lastState === undefined || !isEqual(lastResult, newResult)) {
        lastResult = newResult;
      }
      
      lastState = state;
    }
    
    return lastResult;
  };
};

/**
 * Performance Monitoring Hook
 * Tracks rendering performance and memory usage
 */
export const usePerformanceMonitor = () => {
  const startTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  
  const startMeasure = useCallback((label: string) => {
    startTime.current = performance.now();
    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
  }, []);
  
  const endMeasure = useCallback((label: string) => {
    const endTime = performance.now();
    
    if (performance.mark && performance.measure) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
    
    const duration = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }, []);
  
  const measureFrameRate = useCallback(() => {
    frameCount.current++;
    const now = performance.now();
    
    if (now - lastFrameTime.current >= 1000) {
      const fps = (frameCount.current * 1000) / (now - lastFrameTime.current);
      frameCount.current = 0;
      lastFrameTime.current = now;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`FPS: ${fps.toFixed(1)}`);
      }
      
      return fps;
    }
    
    return null;
  }, []);
  
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);
  
  return {
    startMeasure,
    endMeasure,
    measureFrameRate,
    measureMemory
  };
};

/**
 * Memoized Component Wrapper
 * Creates memoized versions of components with custom comparison
 */
export const withMemoization = <T extends object>(
  Component: React.ComponentType<T>,
  areEqual?: (prevProps: T, nextProps: T) => boolean
) => {
  const defaultAreEqual = (prevProps: T, nextProps: T): boolean => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    for (const key of prevKeys) {
      if (prevProps[key as keyof T] !== nextProps[key as keyof T]) {
        return false;
      }
    }
    
    return true;
  };
  
  return React.memo(Component, areEqual || defaultAreEqual);
};

/**
 * Batch Updates Hook
 * Batches multiple state updates to prevent excessive re-renders
 */
export const useBatchUpdate = () => {
  const batchRef = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const addToBatch = useCallback((updateFn: () => void) => {
    batchRef.current.push(updateFn);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = batchRef.current.splice(0);
      // Use React 18's automatic batching instead of unstable_batchedUpdates
      updates.forEach(update => update());
    }, 0);
  }, []);
  
  return { addToBatch };
};

/**
 * Viewport Culling Hook
 * Efficiently determines which elements are visible in the current viewport
 */
export const useViewportCulling = (
  elements: any[],
  viewport: { x: number; y: number; width: number; height: number },
  margin = 100
) => {
  return useMemo(() => {
    if (!viewport || !elements) return elements;
    
    const expandedViewport = {
      x: viewport.x - margin,
      y: viewport.y - margin,
      width: viewport.width + (margin * 2),
      height: viewport.height + (margin * 2)
    };
    
    return elements.filter(element => {
      if (!element) return false;
      
      const elementRight = element.x + (element.width || 0);
      const elementBottom = element.y + (element.height || 0);
      const viewportRight = expandedViewport.x + expandedViewport.width;
      const viewportBottom = expandedViewport.y + expandedViewport.height;
      
      return element.x < viewportRight &&
             elementRight > expandedViewport.x &&
             element.y < viewportBottom &&
             elementBottom > expandedViewport.y;
    });
  }, [elements, viewport, margin]);
};
