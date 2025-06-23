// src/tests/system/environment.diagnostic.test.ts
import { describe, test, expect } from 'vitest';

describe('Environment Diagnostic Test', () => {
  test('should show actual environment variables', () => {
    console.log('=== ENVIRONMENT DIAGNOSTIC ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VITEST:', process.env.VITEST);
    console.log('Test environment:', process.env.NODE_ENV === 'test' ? 'CORRECT' : 'INCORRECT');
    console.log('================================');
    
    // The test itself doesn't matter, we just want to see the console output
    expect(true).toBe(true);
  });
});
