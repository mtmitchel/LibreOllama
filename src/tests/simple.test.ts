// Simple test to validate Jest setup
// Vitest globals enabled in config - no need to import describe, test, expect

describe('Simple Jest Test', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});
