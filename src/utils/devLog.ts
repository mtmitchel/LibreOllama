import { logger } from '@/core/lib/logger';

/**
 * Development-only logging utility
 * All logs are stripped from production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const devLog = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      logger.debug('[DEVLOG]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      logger.warn('[DEVLOG]', ...args);
    }
  },
  error: (...args: any[]) => {
    // For development-only errors that should not appear in production logs
    if (isDevelopment) {
      logger.error('[DEVLOG]', ...args);
    }
  }
};
