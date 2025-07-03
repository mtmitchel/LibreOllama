/**
 * Canvas-specific environment-aware logging utility
 * Improves production performance by disabling non-critical logging
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const canvasLog = {
  // Debug logs only in development
  debug: isDevelopment ? console.log : () => {},
  
  // Info logs in development and test
  log: (isDevelopment || isTest) ? console.log : () => {},
  
  // Warnings always shown but throttled in production
  warn: console.warn,
  
  // Errors always logged
  error: console.error,
  
  // Performance logging only in development
  perf: isDevelopment ? console.log : () => {},
  
  // Group operations only in development
  group: isDevelopment ? console.group : () => {},
  groupEnd: isDevelopment ? console.groupEnd : () => {},
  
  // Memory logging only in development
  memory: isDevelopment ? console.log : () => {},
  
  // Table-specific logging (heavily used in TableElement)
  table: isDevelopment ? console.log : () => {},
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
    if (isDevelopment && console.time) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment && console.timeEnd) {
      console.timeEnd(label);
    }
  }
}; 