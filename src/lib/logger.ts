/**
 * A simple, hardened environment-aware logger.
 * NUCLEAR VERSION: Completely silent in test mode
 * Browser-compatible: Safely checks for process existence
 */

// Safe environment check that works in both Node.js and browser
const isBrowser = typeof window !== 'undefined';
const isTestMode = !isBrowser && (
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (typeof process !== 'undefined' && process.env?.VITEST === 'true')
);

export const logger = {
  log: (...args: unknown[]): void => {
    // NUCLEAR: Do absolutely nothing in test mode
    if (!isTestMode) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    // NUCLEAR: Do absolutely nothing in test mode  
    if (!isTestMode) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    // NUCLEAR: Only show errors, but check environment first
    if (!isTestMode) {
      console.error(...args);
    }
  },
  debug: (...args: unknown[]): void => {
    // NUCLEAR: Do absolutely nothing in test mode
    if (!isTestMode) {
      console.debug(...args);
    }
  },
};
