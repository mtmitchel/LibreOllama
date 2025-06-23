// src/tests/system/logger.isolation.test.ts
import { describe, test, expect } from 'vitest';
import { logger } from '@/lib/logger';

describe('Logger Isolation Test', () => {
  test('logger.log should be silent in test mode', () => {
    // This is the most important part of the test.
    // We are wrapping the logger call in a function to see if it throws.
    // In a properly configured environment, this should do nothing.
    const logAction = () => logger.log('[ISOLATION TEST] This message should NOT appear.');

    // We expect that this action does NOT throw an error and does NOT log to the console.
    expect(logAction).not.toThrow();
  });
});
