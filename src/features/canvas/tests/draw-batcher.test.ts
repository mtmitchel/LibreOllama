import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Konva from 'konva';
import { DrawBatcher, createDrawBatcher, type DrawBatcherConfig, type LayerType } from '../renderer/drawing/DrawBatcher';

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRAF = vi.fn();
const mockCAF = vi.fn();
global.requestAnimationFrame = mockRAF;
global.cancelAnimationFrame = mockCAF;

// Mock performance tracker
const mockPerformance = {
  incBatchDraw: vi.fn(),
};

// Create mock Konva layers
const createMockLayer = (): Konva.Layer => {
  const layer = new Konva.Layer();
  layer.batchDraw = vi.fn();
  return layer;
};

describe('DrawBatcher', () => {
  let drawBatcher: DrawBatcher;
  let mainLayer: Konva.Layer;
  let overlayLayer: Konva.Layer;
  let previewLayer: Konva.Layer;
  let config: DrawBatcherConfig;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockRAF.mockImplementation((callback) => {
      // Execute callback immediately in tests
      setTimeout(callback, 0);
      return 123; // Mock RAF ID
    });

    // Create mock layers
    mainLayer = createMockLayer();
    overlayLayer = createMockLayer();
    previewLayer = createMockLayer();

    // Create configuration
    config = {
      layers: {
        main: mainLayer,
        overlay: overlayLayer,
        preview: previewLayer,
      },
      performance: mockPerformance,
      debug: { log: false },
    };

    drawBatcher = new DrawBatcher(config);
  });

  afterEach(() => {
    drawBatcher.destroy();
  });

  describe('initialization', () => {
    it('should initialize with proper configuration', () => {
      expect(drawBatcher).toBeDefined();
      expect(drawBatcher.isDrawScheduled()).toBe(false);
      expect(drawBatcher.hasAnyDirtyLayers()).toBe(false);
    });

    it('should initialize with debug logging', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const debugConfig = { ...config, debug: { log: true } };
      const debugBatcher = new DrawBatcher(debugConfig);

      expect(consoleSpy).toHaveBeenCalledWith('[DrawBatcher] Drawing batcher initialized');
      
      debugBatcher.destroy();
      consoleSpy.mockRestore();
    });
  });

  describe('scheduleDraw', () => {
    it('should schedule drawing for single layer', () => {
      drawBatcher.scheduleDraw('main');

      expect(mockRAF).toHaveBeenCalledTimes(1);
      expect(drawBatcher.isDrawScheduled()).toBe(true);
      expect(drawBatcher.isLayerDirty('main')).toBe(true);
      expect(drawBatcher.getDirtyLayers()).toContain('main');
    });

    it('should schedule drawing for multiple layers', () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');
      drawBatcher.scheduleDraw('preview');

      // Should only call RAF once (batched)
      expect(mockRAF).toHaveBeenCalledTimes(1);
      expect(drawBatcher.getDirtyLayers()).toEqual(['main', 'overlay', 'preview']);
    });

    it('should not double-schedule when already scheduled', () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('main'); // Should not schedule again

      expect(mockRAF).toHaveBeenCalledTimes(1);
    });

    it('should execute batch draw after RAF callback', async () => {
      drawBatcher.scheduleDraw('main');
      
      // Wait for RAF callback to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mainLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(mockPerformance.incBatchDraw).toHaveBeenCalledWith('main-layer');
    });

    it('should draw multiple layers in batch', async () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mainLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(overlayLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(mockPerformance.incBatchDraw).toHaveBeenCalledWith('main-layer');
      expect(mockPerformance.incBatchDraw).toHaveBeenCalledWith('overlay-layer');
    });

    it('should reset state after batch draw', async () => {
      drawBatcher.scheduleDraw('main');
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(drawBatcher.isDrawScheduled()).toBe(false);
      expect(drawBatcher.hasAnyDirtyLayers()).toBe(false);
    });
  });

  describe('forceDraw', () => {
    it('should immediately draw specific layer', () => {
      drawBatcher.forceDraw('main');

      expect(mainLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(mockPerformance.incBatchDraw).toHaveBeenCalledWith('main-layer-force');
      expect(mockRAF).not.toHaveBeenCalled();
    });

    it('should draw each layer type correctly', () => {
      drawBatcher.forceDraw('main');
      drawBatcher.forceDraw('overlay');
      drawBatcher.forceDraw('preview');

      expect(mainLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(overlayLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(previewLayer.batchDraw).toHaveBeenCalledTimes(1);
    });

    it('should handle missing layers gracefully', () => {
      const partialConfig: DrawBatcherConfig = {
        layers: { main: mainLayer },
        debug: { log: false },
      };
      const partialBatcher = new DrawBatcher(partialConfig);

      expect(() => {
        partialBatcher.forceDraw('overlay');
        partialBatcher.forceDraw('preview');
      }).not.toThrow();

      partialBatcher.destroy();
    });

    it('should handle layer draw errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Make batchDraw throw an error
      mainLayer.batchDraw = vi.fn(() => {
        throw new Error('Draw failed');
      });

      expect(() => {
        drawBatcher.forceDraw('main');
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[DrawBatcher] Error force drawing main layer:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('forceDrawAll', () => {
    it('should immediately draw all layers', () => {
      drawBatcher.forceDrawAll();

      expect(mainLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(overlayLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(previewLayer.batchDraw).toHaveBeenCalledTimes(1);
    });

    it('should cancel scheduled draw before force drawing', () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.forceDrawAll();

      expect(mockCAF).toHaveBeenCalledWith(123);
      expect(drawBatcher.isDrawScheduled()).toBe(false);
    });
  });

  describe('cancelScheduledDraw', () => {
    it('should cancel scheduled RAF', () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.cancelScheduledDraw();

      expect(mockCAF).toHaveBeenCalledWith(123);
      expect(drawBatcher.isDrawScheduled()).toBe(false);
      expect(drawBatcher.hasAnyDirtyLayers()).toBe(false);
    });

    it('should handle no scheduled draw gracefully', () => {
      expect(() => {
        drawBatcher.cancelScheduledDraw();
      }).not.toThrow();

      expect(mockCAF).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should track dirty layers correctly', () => {
      expect(drawBatcher.isLayerDirty('main')).toBe(false);
      
      drawBatcher.scheduleDraw('main');
      expect(drawBatcher.isLayerDirty('main')).toBe(true);
      expect(drawBatcher.isLayerDirty('overlay')).toBe(false);
    });

    it('should track multiple dirty layers', () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');

      expect(drawBatcher.getDirtyLayers()).toEqual(['main', 'overlay']);
      expect(drawBatcher.hasAnyDirtyLayers()).toBe(true);
    });

    it('should clear individual layer dirty state', () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');

      drawBatcher.clearLayerDirtyState('main');

      expect(drawBatcher.isLayerDirty('main')).toBe(false);
      expect(drawBatcher.isLayerDirty('overlay')).toBe(true);
    });
  });

  describe('invalidateAll', () => {
    it('should mark all layers as dirty', () => {
      drawBatcher.invalidateAll();

      expect(drawBatcher.isLayerDirty('main')).toBe(true);
      expect(drawBatcher.isLayerDirty('overlay')).toBe(true);
      expect(drawBatcher.isLayerDirty('preview')).toBe(true);
      expect(drawBatcher.isDrawScheduled()).toBe(true);
    });

    it('should not double-schedule if already scheduled', () => {
      drawBatcher.scheduleDraw('main');
      const rafCallCount = mockRAF.mock.calls.length;

      drawBatcher.invalidateAll();

      expect(mockRAF).toHaveBeenCalledTimes(rafCallCount); // No additional calls
    });
  });

  describe('configuration updates', () => {
    it('should update configuration', () => {
      const newPerformance = { incBatchDraw: vi.fn() };
      
      drawBatcher.updateConfig({
        performance: newPerformance,
        debug: { log: true },
      });

      // Force a draw to test new configuration
      drawBatcher.forceDraw('main');

      expect(newPerformance.incBatchDraw).toHaveBeenCalledWith('main-layer-force');
    });
  });

  describe('statistics and debugging', () => {
    it('should provide accurate statistics', () => {
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');

      const stats = drawBatcher.getStats();

      expect(stats.dirtyLayerCount).toBe(2);
      expect(stats.isScheduled).toBe(true);
      expect(stats.currentRAFId).toBe(123);
    });

    it('should log debug information when enabled', () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      const debugConfig = { ...config, debug: { log: true } };
      const debugBatcher = new DrawBatcher(debugConfig);

      debugBatcher.scheduleDraw('main');

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DrawBatcher] Scheduled batch draw for main'
      );

      debugBatcher.destroy();
      consoleDebugSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle batch draw errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Make main layer throw an error
      mainLayer.batchDraw = vi.fn(() => {
        throw new Error('Batch draw failed');
      });

      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still draw overlay despite main layer error
      expect(overlayLayer.batchDraw).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[DrawBatcher] Error drawing main layer:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing layers in configuration', () => {
      const emptyConfig: DrawBatcherConfig = {
        layers: {},
        debug: { log: false },
      };
      const emptyBatcher = new DrawBatcher(emptyConfig);

      expect(() => {
        emptyBatcher.scheduleDraw('main');
        emptyBatcher.forceDraw('overlay');
        emptyBatcher.forceDrawAll();
      }).not.toThrow();

      emptyBatcher.destroy();
    });
  });

  describe('cleanup', () => {
    it('should destroy cleanly', () => {
      drawBatcher.scheduleDraw('main');
      
      const rafId = drawBatcher.getStats().currentRAFId;
      drawBatcher.destroy();

      expect(mockCAF).toHaveBeenCalledWith(rafId);
      expect(drawBatcher.isDrawScheduled()).toBe(false);
      expect(drawBatcher.hasAnyDirtyLayers()).toBe(false);
    });

    it('should handle multiple destroy calls', () => {
      expect(() => {
        drawBatcher.destroy();
        drawBatcher.destroy();
      }).not.toThrow();
    });
  });

  describe('createDrawBatcher utility', () => {
    it('should create DrawBatcher with utility function', () => {
      // Mock window.CANVAS_PERF for the utility function
      (window as any).CANVAS_PERF = mockPerformance;

      const layers = {
        main: mainLayer,
        overlay: overlayLayer,
      };

      const utilityBatcher = createDrawBatcher(layers, {
        enablePerformanceTracking: true,
        debug: true,
      });

      expect(utilityBatcher).toBeInstanceOf(DrawBatcher);
      
      // Test that performance tracking is enabled
      utilityBatcher.forceDraw('main');
      expect(mockPerformance.incBatchDraw).toHaveBeenCalledWith('main-layer-force');

      utilityBatcher.destroy();
      
      // Clean up
      delete (window as any).CANVAS_PERF;
    });

    it('should create DrawBatcher without options', () => {
      const utilityBatcher = createDrawBatcher({ main: mainLayer });

      expect(utilityBatcher).toBeInstanceOf(DrawBatcher);
      utilityBatcher.destroy();
    });
  });

  describe('RAF callback execution', () => {
    it('should handle RAF callback errors gracefully', async () => {
      // Make RAF callback throw during execution
      mockRAF.mockImplementation((callback) => {
        setTimeout(() => {
          try {
            callback();
          } catch (error) {
            // Simulate RAF callback error - should not crash the system
          }
        }, 0);
        return 123;
      });

      // Mock batchDraw to throw to trigger the error
      mainLayer.batchDraw = vi.fn(() => {
        throw new Error('RAF execution error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      drawBatcher.scheduleDraw('main');
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});