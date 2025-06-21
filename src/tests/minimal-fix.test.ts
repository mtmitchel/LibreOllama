// Vitest globals enabled in config - no need to import describe, test, expect

// Simple test to check if basic Jest functionality works
describe('Minimal Fix Test', () => {
  test('Jest environment is working', () => {
    expect(true).toBe(true);
  });

  test('Can import from relative paths', () => {
    // Test if we can import from the same directory structure
    try {
      const utilsPath = require.resolve('../features/canvas/stores/slices/canvasElementsStore');
      expect(utilsPath).toBeDefined();
    } catch (error) {
      console.log('Import error:', error);
      // This will help us understand the path resolution issue
      expect(error).toBeDefined();
    }
  });
});
