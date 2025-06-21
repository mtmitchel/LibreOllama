// src/tests/hooks/useTauriCanvas-fixed.test.ts
import { vi } from 'vitest';

// Mock canvas module FIRST, before any other imports
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
    toDataURL: vi.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600,
  })),
}));

// Mock Tauri API - use vi.fn() directly in factory
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock the canvas store - use vi.fn() directly in factory
vi.mock('@/features/canvas/stores/canvasStore.enhanced', () => ({
  useCanvasStore: vi.fn(() => ({
    exportElements: vi.fn(),
    importElements: vi.fn(),
  })),
}));

// Use relative import to avoid path resolution issues
import { useTauriCanvas } from '../../features/canvas/hooks/useTauriCanvas';

describe('useTauriCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('hook can be imported without canvas.node errors', () => {
    // The key test: verify the hook loads without the canvas module error
    expect(typeof useTauriCanvas).toBe('function');
  });

  test('hook returns expected interface', () => {
    const hook = useTauriCanvas();
    expect(hook).toHaveProperty('saveToFile');
    expect(hook).toHaveProperty('loadFromFile');
    expect(typeof hook.saveToFile).toBe('function');
    expect(typeof hook.loadFromFile).toBe('function');
  });
});
