// Vitest globals enabled in config - no need to import describe, test, expect, beforeEach
import { vi } from 'vitest';

// Mock canvas module before any imports that might use it
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

describe('canvasElementsStore import test', () => {
  test('can import PerformanceMonitor', async () => {
    const { PerformanceMonitor } = await import('@/utils/performance/PerformanceMonitor');
    expect(PerformanceMonitor).toBeDefined();
  });

  test('can import types', async () => {
    const types = await import('@/features/canvas/types/enhanced.types');
    expect(types).toBeDefined();
  });

  test('can import canvasElementsStore gradually', async () => {
    try {
      const store = await import('@/features/canvas/stores/slices/canvasElementsStore');
      expect(store).toBeDefined();
      expect(store.createCanvasElementsStore).toBeDefined();
    } catch (error) {
      console.error('Failed to import canvasElementsStore:', error);
      throw error;
    }
  });
});
