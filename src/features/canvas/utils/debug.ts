// Debug Utility for Production-Safe Logging
// Implements research recommendation to remove console.log statements in production

import { CanvasElement } from '../types/enhanced.types';
import { ExtendedPerformance } from '../types/type-safe-replacements';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Allow debugging in development and test environments
const shouldLog = isDevelopment || isTest;

export const debug = {
  // Regular logging - only in development
  log: shouldLog ? console.log.bind(console) : () => {},
  
  // Warnings - only in development
  warn: shouldLog ? console.warn.bind(console) : () => {},
  
  // Errors - always log (critical for production debugging)
  error: console.error.bind(console),
  
  // Grouping - only in development
  group: shouldLog ? console.group.bind(console) : () => {},
  groupCollapsed: shouldLog ? console.groupCollapsed.bind(console) : () => {},
  groupEnd: shouldLog ? console.groupEnd.bind(console) : () => {},
  
  // Performance timing - only in development
  time: shouldLog ? console.time.bind(console) : () => {},
  timeEnd: shouldLog ? console.timeEnd.bind(console) : () => {},
  timeLog: shouldLog ? console.timeLog.bind(console) : () => {},
  
  // Table formatting - only in development
  table: shouldLog ? console.table.bind(console) : () => {},
  
  // Canvas-specific debugging utilities
  canvas: {
    // Log element operations
    elementOperation: (operation: string, elementId: string, data?: unknown) => {
      if (shouldLog) {
        console.group(`🎨 Canvas: ${operation}`);
        console.log('Element ID:', elementId);
        if (data) console.log('Data:', data);
        console.groupEnd();
      }
    },
    
    // Log performance metrics
    performance: (operation: string, duration: number, elementCount?: number) => {
      if (shouldLog) {
        console.log(`⚡ Performance: ${operation} took ${duration.toFixed(2)}ms${elementCount ? ` (${elementCount} elements)` : ''}`);
      }
    },
    
    // Log store state changes
    storeUpdate: (slice: string, action: string, payload?: unknown) => {
      if (shouldLog) {
        console.group(`🏪 Store: ${slice}.${action}`);
        if (payload) console.log('Payload:', payload);
        console.groupEnd();
      }
    },
    
    // Log Konva events
    konvaEvent: (event: string, target?: string, details?: unknown) => {
      if (shouldLog) {
        console.log(`🎭 Konva: ${event}${target ? ` on ${target}` : ''}`, details || '');
      }
    }
  }
};

// Performance measurement utility
export const measurePerformance = <T>(
  operation: string,
  fn: () => T,
  elementCount?: number
): T => {
  if (!shouldLog) {
    return fn();
  }
  
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  debug.canvas.performance(operation, endTime - startTime, elementCount);
  
  return result;
};

// Memory usage monitoring (development only)
export const logMemoryUsage = (operation: string) => {
  if (!shouldLog || !('memory' in performance)) {
    return;
  }
  
  const memory = (performance as ExtendedPerformance).memory!;
  console.log(`💾 Memory after ${operation}:`, {
    used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
  });
};

// Canvas element debugging helper
export const logElementState = (elementId: string, element: CanvasElement) => {
  if (!shouldLog) return;
  
  console.group(`🔍 Element State: ${elementId}`);
  console.log('Type:', element.type);
  console.log('Position:', { x: element.x, y: element.y });
  if ('width' in element && 'height' in element) {
    console.log('Size:', { width: (element as any).width, height: (element as any).height });
  } else if ('radius' in element) {
    console.log('Size:', { radius: (element as any).radius });
  } else {
    console.log('Size:', 'Not applicable for this element type');
  }
  console.log('Properties:', element);
  console.groupEnd();
};

// Export for backward compatibility with existing console.log statements
export default debug;
