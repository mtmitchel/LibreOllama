import { logger, canvasLogger } from '../../../core/lib/logger'; // Import canvasLogger directly

/**
 * Canvas-specific environment-aware logging utility
 * Improves production performance by disabling non-critical logging
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Simple RAF-based throttle for noisy dev logs
let lastFrame = 0;
const frameThrottle = (fn: (...args: unknown[]) => void) => {
  return (...args: unknown[]) => {
    const now = performance.now();
    if (now - lastFrame < 16) return; // Skip if already logged this frame
    lastFrame = now;
    fn(...args);
  };
};

export const canvasLog = {
  // Debug logs only in development (throttled)
  debug: isDevelopment ? frameThrottle(logger.debug.bind(logger)) : () => {},
  
  // Info logs in development and test (throttled)
  log: (isDevelopment || isTest) ? frameThrottle(logger.log.bind(logger)) : () => {},
  
  // Info logs in development and test (throttled) - same as log but semantic distinction
  info: (isDevelopment || isTest) ? frameThrottle((logger as any).info?.bind(logger) || logger.log.bind(logger)) : () => {},
  
  // Warnings always shown but throttled in production
  warn: logger.warn,
  
  // Errors always logged
  error: logger.error,
  
  // Performance logging only in development
  perf: isDevelopment ? logger.debug : () => {},
  
  // Group operations only in development (using console directly since logger doesn't have group methods)
  group: isDevelopment ? console.group.bind(console) : () => {},
  groupEnd: isDevelopment ? console.groupEnd.bind(console) : () => {},
  
  // Memory logging only in development
  memory: isDevelopment ? logger.debug : () => {},
  
  // Table-specific logging (heavily used in TableElement)
  table: isDevelopment ? logger.debug : () => {},
};

// Canvas-specific performance profiler
export const canvasPerf = {
  mark: (name: string) => {
    if (isDevelopment && performance.mark) {
      performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark?: string) => {
    if (isDevelopment && performance.measure) {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        canvasLog.perf(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    }
  },
  
  time: (label: string) => {
    if (isDevelopment) {
      canvasLogger.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment) {
      canvasLogger.timeEnd(label);
    }
  }
}; 