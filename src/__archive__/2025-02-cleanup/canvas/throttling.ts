/**
 * Event System Optimization Utilities
 * Phase 4.4 of Canvas Master Plan
 * 
 * Provides throttling, delegation, and performance optimizations
 * for high-frequency canvas events
 */

/**
 * Throttles a function using requestAnimationFrame
 * Ensures smooth 60fps performance for drag/zoom operations
 */
export function throttleRAF<T extends (...args: any[]) => void>(fn: T): T {
  let rafId: number | null = null;
  let lastArgs: Parameters<T>;

  return ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs);
        rafId = null;
      });
    }
  }) as T;
}

/**
 * Throttles high-frequency events with configurable delay
 * Used for events that don't need frame-rate synchronization
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T, 
  delay: number = 16
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T>;

  return ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        fn(...lastArgs);
        timeoutId = null;
      }, delay);
    }
  }) as T;
}

/**
 * Debounces a function to prevent excessive calls
 * Useful for resize/viewport change events
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T, 
  delay: number = 250
): T {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  }) as T;
}

/**
 * Performance monitoring for event handlers
 */
export function withPerformanceTracking<T extends (...args: any[]) => void>(
  fn: T,
  eventName: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    fn(...args);
    const end = performance.now();
    
    if (end - start > 16) {
      console.warn(`[PERFORMANCE] Event "${eventName}" took ${(end - start).toFixed(2)}ms`);
    }
  }) as T;
}
