/**
 * Development-only logging utility
 * All logs are stripped from production builds
 */

export const devLog = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Errors should always be logged
    console.error(...args);
  }
};
