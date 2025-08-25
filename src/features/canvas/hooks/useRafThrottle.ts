import { useRef, useCallback } from 'react';

export function useRafThrottle<T extends (...args: any[]) => void>(fn: T) {
  const frame = useRef<number | null>(null);
  const lastArgs = useRef<any[] | null>(null);

  const throttled = useCallback((...args: any[]) => {
    lastArgs.current = args;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const a = lastArgs.current;
      lastArgs.current = null;
      if (a) fn(...a);
    });
  }, [fn]);

  return throttled as T;
}

import { useCallback, useRef } from 'react';

/**
 * React hook that throttles function calls using requestAnimationFrame
 * for smooth canvas updates and optimal performance
 */
export function useRafThrottle<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  const rafRef = useRef<number | null>(null);
  const latestCallbackRef = useRef(callback);
  
  // Keep callback ref up to date
  latestCallbackRef.current = callback;
  
  return useCallback((...args: Parameters<T>) => {
    if (rafRef.current !== null) {
      // Already have a pending RAF, skip this call
      return;
    }
    
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      latestCallbackRef.current(...args);
    });
  }, []);
} 