import { performanceTracker } from '../../features/canvas/utils/performance/performanceTracker';

export const logger = {
  log: (...args: unknown[]): void => {
    console.log(...args);
  },
  info: (...args: unknown[]): void => {
    console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
  debug: (...args: unknown[]): void => {
    console.debug(...args);
  },
};

export const canvasLogger = {
  debug: (...args: any[]): void => {
    performanceTracker.recordMetric({ name: 'canvas-debug', value: 0, timestamp: Date.now(), category: 'canvas', metadata: { args } });
  },
  info: (...args: any[]): void => {
    performanceTracker.recordMetric({ name: 'canvas-info', value: 0, timestamp: Date.now(), category: 'canvas', metadata: { args } });
  },
  warn: (...args: any[]): void => {
    performanceTracker.recordMetric({ name: 'canvas-warn', value: 0, timestamp: Date.now(), category: 'canvas', metadata: { args } });
  },
  error: (...args: any[]): void => {
    const error = args.find(arg => arg instanceof Error) || new Error(String(args[0]));
    performanceTracker.recordError(error, 'canvas-error', { args });
  },
  group: (label: string): void => {
    console.group(label);
  },
  groupEnd: (): void => {
    console.groupEnd();
  },
  time: (label: string): void => {
    performance.mark(`${label}-start`);
  },
  timeEnd: (label: string): void => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    if (measure) {
      performanceTracker.recordMetric({ name: label, value: measure.duration, timestamp: Date.now(), category: 'canvas' });
    }
  },
};

export const logCanvasOperation = (operation: string, elementId?: string, details?: any) => {
  performanceTracker.trackOperation(operation, () => {}, 'canvas', { elementId, details });
};

export const logCanvasError = (error: Error, context: string, additionalInfo?: any) => {
  performanceTracker.recordError(error, context, additionalInfo);
};
