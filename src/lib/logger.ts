/**
 * A simple, hardened environment-aware logger.
 * NUCLEAR VERSION: Completely silent in test mode
 */
export const logger = {
  log: (...args: unknown[]): void => {
    // NUCLEAR: Do absolutely nothing in test mode
    if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    // NUCLEAR: Do absolutely nothing in test mode  
    if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    // NUCLEAR: Only show errors, but check environment first
    if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
      console.error(...args);
    }
  },
  debug: (...args: unknown[]): void => {
    // NUCLEAR: Do absolutely nothing in test mode
    if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
      console.debug(...args);
    }
  },
};
