/**
 * Consolidated Production-Safe Logger
 * Merges simple logger with canvas-specific advanced logging capabilities
 * Environment-aware and test-mode safe
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

// Safe environment check that works in both Node.js and browser
const isBrowser = typeof window !== 'undefined';
const isTestMode = !isBrowser && (
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (typeof process !== 'undefined' && process.env?.VITEST === 'true')
);

class Logger {
  private config: LogConfig;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      enabled: !isTestMode && (isBrowser || process.env.NODE_ENV === 'development'),
      level: 'debug',
      prefix: '',
      timestamp: true,
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled || isTestMode) return false;

    const levels = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);

    return messageIndex >= currentIndex;
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const parts: any[] = [];

    if (this.config.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }

    parts.push(`[${level.toUpperCase()}]`);
    parts.push(...args);

    return parts;
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', ...args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', ...args));
    }
  }

  log(...args: any[]): void {
    if (!isTestMode) {
      console.log(...args);
    }
  }

  group(label: string): void {
    if (this.config.enabled && !isTestMode) {
      console.group(...this.formatMessage('info', label));
    }
  }

  groupEnd(): void {
    if (this.config.enabled && !isTestMode) {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (this.config.enabled && !isTestMode) {
      console.time(`${this.config.prefix} ${label}`);
    }  
  }

  timeEnd(label: string): void {
    if (this.config.enabled && !isTestMode) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }

  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default simple logger (backward compatibility)
export const logger = {
  log: (...args: unknown[]): void => {
    if (!isTestMode) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => { 
    if (!isTestMode) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (!isTestMode) {
      console.error(...args);
    }
  },
  debug: (...args: unknown[]): void => {
    if (!isTestMode) {
      console.debug(...args);
    }
  },
};

// Domain-specific loggers
export const canvasLogger = new Logger({
  prefix: '[Canvas]',
  level: 'info'
});

export const performanceLogger = new Logger({
  prefix: '[Performance]',
  level: 'warn'
});

export const memoryLogger = new Logger({
  prefix: '[Memory]',
  level: 'warn'
});

export const debugLogger = new Logger({
  prefix: '[Debug]',
  level: 'debug'
});

// Performance-specific logging utilities
export const logPerformance = (operation: string, duration: number) => {
  if (duration > 16) { // Longer than one frame
    performanceLogger.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
  } else {
    performanceLogger.debug(`${operation}: ${duration.toFixed(2)}ms`);
  }
};

export const logMemoryUsage = (context: string, used: number, growth: number) => {
  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (growth > 10 * 1024 * 1024) { // 10MB growth
    memoryLogger.warn(`${context}: Memory usage ${formatBytes(used)}, growth: ${formatBytes(growth)}`);
  } else {
    memoryLogger.debug(`${context}: Memory usage ${formatBytes(used)}`);
  }
};

// Canvas operation logging
export const logCanvasOperation = (operation: string, elementId?: string, details?: any) => {
  if (elementId) {
    canvasLogger.debug(`${operation} [${elementId}]`, details);
  } else {
    canvasLogger.debug(operation, details);
  }
};

// Error boundary logging
export const logCanvasError = (error: Error, context: string, additionalInfo?: any) => {
  canvasLogger.error(`Error in ${context}:`, error.message, additionalInfo);
  
  if (!isBrowser && process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', error.stack);
  }
};

// Development-only assertions
export const assert = (condition: boolean, message: string) => {
  if (!isBrowser && process.env.NODE_ENV === 'development' && !condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

// Conditional logging that can be stripped in production
export const devLog = (...args: any[]) => {
  if (!isBrowser && process.env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args);
  }
};

// Export the main Logger class for custom instances
export { Logger };
export type { LogLevel, LogConfig };
