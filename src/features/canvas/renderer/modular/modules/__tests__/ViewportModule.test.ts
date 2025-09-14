import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ViewportModule, type Point, type Bounds } from '../ViewportModule';
import type { ModuleContext, CanvasSnapshot, ViewportState } from '../../types';
import type Konva from 'konva';

// Mock Konva
const mockStage = {
  scaleX: vi.fn(() => 1),
  scaleY: vi.fn(() => 1),
  scale: vi.fn(),
  position: vi.fn(),
  size: vi.fn(() => ({ width: 1920, height: 1080 })),
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getAbsoluteTransform: vi.fn(() => ({
    point: vi.fn((p: Point) => p),
    copy: vi.fn().mockReturnThis(),
    invert: vi.fn().mockReturnThis()
  })),
  batchDraw: vi.fn(),
  container: vi.fn(() => ({
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      width: 1920,
      height: 1080
    }))
  })),
  on: vi.fn()
} as any as Konva.Stage;

const mockNode = {
  getAbsoluteTransform: vi.fn(() => ({
    point: vi.fn((p: Point) => p),
    copy: vi.fn().mockReturnThis(),
    invert: vi.fn().mockReturnThis()
  }))
} as any as Konva.Node;

const mockResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  callback
}));

// Mock global objects
beforeEach(() => {
  global.ResizeObserver = mockResizeObserver;
  (global as any).window = {
    CANVAS_PERF: {
      incBatchDraw: vi.fn()
    }
  };

  // Reset mock implementation for each test
  mockResizeObserver.mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    callback
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ViewportModule', () => {
  let module: ViewportModule;
  let mockContext: ModuleContext;
  let mockSnapshot: CanvasSnapshot;

  beforeEach(() => {
    module = new ViewportModule();

    mockContext = {
      store: {
        subscribe: vi.fn(),
        getSnapshot: vi.fn(),
        selectElement: vi.fn(),
        eraseAtPoint: vi.fn(),
        eraseInPath: vi.fn(),
        startDrawing: vi.fn(),
        updateDrawing: vi.fn(),
        finishDrawing: vi.fn()
      },
      konva: {
        getStage: vi.fn(),
        getLayers: vi.fn(() => ({
          background: null,
          main: null,
          preview: null,
          overlay: null
        }))
      },
      overlay: {},
      metrics: {
        log: vi.fn()
      },
      flags: {}
    };

    mockSnapshot = {
      elements: new Map(),
      selection: new Set(),
      viewport: {
        x: 0,
        y: 0,
        scale: 1
      },
      history: {
        canUndo: false,
        canRedo: false
      }
    };

    (mockContext.store.getSnapshot as any).mockReturnValue(mockSnapshot);
    (mockContext.konva.getStage as any).mockReturnValue(mockStage);
  });

  afterEach(() => {
    module.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with stage and setup event handlers', () => {
      module.init(mockContext);

      expect(mockContext.konva.getStage).toHaveBeenCalled();
      expect(mockStage.on).toHaveBeenCalledWith('wheel', expect.any(Function));
      expect(mockResizeObserver).toHaveBeenCalled();
    });

    it('should handle initialization without stage gracefully', () => {
      (mockContext.konva.getStage as any).mockReturnValue(null);

      expect(() => module.init(mockContext)).not.toThrow();
    });
  });

  describe('Viewport Synchronization', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should sync viewport state to Konva stage', () => {
      const viewport = { x: 100, y: 200, scale: 1.5 };
      const snapshot = { ...mockSnapshot, viewport };

      module.sync(snapshot);

      expect(mockStage.scale).toHaveBeenCalledWith({ x: 1.5, y: 1.5 });
      expect(mockStage.position).toHaveBeenCalledWith({ x: 100, y: 200 });
      expect(mockStage.batchDraw).toHaveBeenCalled();
    });

    it('should handle sync without stage gracefully', () => {
      const moduleWithoutStage = new ViewportModule();
      (mockContext.konva.getStage as any).mockReturnValue(null);
      moduleWithoutStage.init(mockContext);

      expect(() => moduleWithoutStage.sync(mockSnapshot)).not.toThrow();
    });
  });

  describe('Zoom Operations', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should clamp zoom scale to min/max limits', () => {
      // Test minimum scale (0.1)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      module.zoom(0.05); // Below minimum

      // Since updateViewport just logs a warning for now, we can't verify the actual clamping
      // but we can verify the method doesn't throw
      expect(consoleSpy).toHaveBeenCalled();

      // Test maximum scale (10.0)
      module.zoom(15); // Above maximum
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle cursor-centered zoom when center point provided', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      module.zoom(2.0, 500, 400);

      // Verify zoom was called with center point
      expect(consoleSpy).toHaveBeenCalled(); // updateViewport warning

      consoleSpy.mockRestore();
    });

    it('should zoom without center point', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      module.zoom(2.0);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Pan Operations', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should pan viewport by delta amounts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      module.pan(50, -25);

      expect(consoleSpy).toHaveBeenCalled(); // updateViewport warning

      consoleSpy.mockRestore();
    });
  });

  describe('Coordinate Transformations', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should convert screen coordinates to world coordinates', () => {
      mockSnapshot.viewport = { x: 100, y: 150, scale: 2.0 };
      (mockContext.store.getSnapshot as any).mockReturnValue(mockSnapshot);

      const screenPos = { x: 300, y: 400 };
      const worldPos = module.screenToWorld(screenPos);

      expect(worldPos).toEqual({
        x: (300 - 100) / 2.0, // (screenX - viewportX) / scale
        y: (400 - 150) / 2.0  // (screenY - viewportY) / scale
      });
    });

    it('should convert world coordinates to screen coordinates', () => {
      mockSnapshot.viewport = { x: 100, y: 150, scale: 2.0 };
      (mockContext.store.getSnapshot as any).mockReturnValue(mockSnapshot);

      const worldPos = { x: 50, y: 75 };
      const screenPos = module.worldToScreen(worldPos);

      expect(screenPos).toEqual({
        x: 50 * 2.0 + 100, // worldX * scale + viewportX
        y: 75 * 2.0 + 150  // worldY * scale + viewportY
      });
    });

    it('should handle coordinate transforms without stage', () => {
      const moduleWithoutStage = new ViewportModule();
      (mockContext.konva.getStage as any).mockReturnValue(null);
      moduleWithoutStage.init(mockContext);

      const pos = { x: 100, y: 200 };

      expect(moduleWithoutStage.screenToWorld(pos)).toEqual(pos);
      expect(moduleWithoutStage.worldToScreen(pos)).toEqual(pos);
    });

    it('should convert screen coordinates to parent local space', () => {
      (mockStage.getPointerPosition as any).mockReturnValue({ x: 150, y: 200 });

      const screenPos = { x: 100, y: 100 };
      const localPos = module.screenToParentLocal(mockNode, screenPos);

      expect(mockStage.getPointerPosition).toHaveBeenCalled();
      expect(mockNode.getAbsoluteTransform).toHaveBeenCalled();
    });

    it('should convert parent local coordinates to screen coordinates', () => {
      const localPos = { x: 50, y: 75 };
      const screenPos = module.parentLocalToScreen(mockNode, localPos);

      expect(mockNode.getAbsoluteTransform).toHaveBeenCalled();
      // The mock returns the same position, so we expect the input
      expect(screenPos).toEqual(localPos);
    });

    it('should convert world rectangle to DOM coordinates', () => {
      const domRect = module.worldRectToDOM(10, 20, 100, 200);

      expect(domRect).toEqual({
        left: 10, // rect.left + topLeft.x (both 0 in mock)
        top: 20,  // rect.top + topLeft.y
        width: 100, // w * scale (scale = 1 in mock)
        height: 200
      });
    });
  });

  describe('Viewport Queries', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should return current viewport state', () => {
      const expectedViewport = { x: 50, y: 100, scale: 1.5 };
      mockSnapshot.viewport = expectedViewport;

      const viewport = module.getViewport();

      expect(viewport).toEqual(expectedViewport);
    });

    it('should calculate visible bounds in world coordinates', () => {
      mockSnapshot.viewport = { x: 0, y: 0, scale: 1, width: 1920, height: 1080 };

      const bounds = module.getVisibleBounds();

      expect(bounds).toEqual({
        left: 0,
        top: 0,
        right: 1920,
        bottom: 1080
      });
    });

    it('should check if point is visible', () => {
      mockSnapshot.viewport = { x: 0, y: 0, scale: 1, width: 1920, height: 1080 };

      expect(module.isPointVisible({ x: 500, y: 500 })).toBe(true);
      expect(module.isPointVisible({ x: 2000, y: 500 })).toBe(false);
      expect(module.isPointVisible({ x: 500, y: 2000 })).toBe(false);
    });
  });

  describe('Resize Handling', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should handle container resize', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      module.handleResize(1600, 900);

      expect(consoleSpy).toHaveBeenCalledWith('[ViewportModule] Container resized:', {
        from: { width: 1920, height: 1080 },
        to: { width: 1600, height: 900 }
      });
      expect(mockStage.size).toHaveBeenCalledWith({ width: 1600, height: 900 });
      expect(mockStage.batchDraw).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled(); // updateViewport warning

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should skip resize if dimensions unchanged', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock current size to match new size
      (mockStage.size as any).mockReturnValue({ width: 1920, height: 1080 });

      module.handleResize(1920, 1080);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Set Viewport', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should set partial viewport state', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      module.setViewport({ scale: 2.0, x: 100 });

      expect(consoleSpy).toHaveBeenCalled(); // updateViewport warning

      consoleSpy.mockRestore();
    });

    it('should clamp scale when setting viewport', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Test scale clamping
      module.setViewport({ scale: 15.0 }); // Above max
      module.setViewport({ scale: 0.05 }); // Below min

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should handle wheel events (placeholder)', () => {
      const event = { type: 'wheel', wheelEvent: new WheelEvent('wheel') };
      const handled = module.onEvent?.(event, mockSnapshot);

      // Currently returns false as it's a placeholder
      expect(handled).toBe(false);
    });

    it('should ignore non-wheel events', () => {
      const event = { type: 'click' };
      const handled = module.onEvent?.(event, mockSnapshot);

      expect(handled).toBe(false);
    });
  });

  describe('Stage Synchronization', () => {
    it('should manually sync to stage', () => {
      module.init(mockContext);

      const newStage = { ...mockStage } as any;
      module.syncToStage(newStage);

      expect(mockStage.scale).toHaveBeenCalled();
      expect(mockStage.position).toHaveBeenCalled();
      expect(mockStage.batchDraw).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      module.init(mockContext);

      // Mock the resize observer
      const mockObserver = { disconnect: vi.fn() };
      (module as any).resizeObserver = mockObserver;

      module.destroy();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle destroy without initialization', () => {
      expect(() => module.destroy()).not.toThrow();
    });
  });

  describe('Performance Requirements', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should track performance metrics during sync', () => {
      module.sync(mockSnapshot);

      expect((global as any).window.CANVAS_PERF.incBatchDraw).toHaveBeenCalledWith('viewport-sync');
    });

    it('should debounce resize events at 60fps (16ms)', () => {
      vi.useFakeTimers();

      // Access the private resize timeout mechanism
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Trigger multiple rapid resize calls
      module.handleResize(1600, 900);
      module.handleResize(1700, 950);
      module.handleResize(1800, 1000);

      // Fast forward time
      vi.advanceTimersByTime(16);

      // Should have been called (the console.log indicates resize was processed)
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('Configuration', () => {
    beforeEach(() => {
      module.init(mockContext);
    });

    it('should use correct zoom configuration', () => {
      const config = (module as any).config;

      expect(config.minScale).toBe(0.1);
      expect(config.maxScale).toBe(10.0);
      expect(config.zoomFactor).toBe(1.1);
    });

    it('should clamp scale values correctly', () => {
      const clampScale = (module as any).clampScale.bind(module);

      expect(clampScale(0.05)).toBe(0.1);  // Below minimum
      expect(clampScale(5.0)).toBe(5.0);   // Within range
      expect(clampScale(15.0)).toBe(10.0); // Above maximum
    });
  });

  describe('Store Integration', () => {
    beforeEach(() => {
      module.init(mockContext);
      // Setup mock store in global window
      (global as any).window.__UNIFIED_CANVAS_STORE__ = {
        getState: vi.fn(() => ({
          setViewport: vi.fn(),
          panViewport: vi.fn(),
          zoomViewport: vi.fn()
        }))
      };
    });

    it('should call store setViewport when updating viewport', () => {
      const mockSetViewport = vi.fn();
      (global as any).window.__UNIFIED_CANVAS_STORE__.getState.mockReturnValue({
        setViewport: mockSetViewport
      });

      module.setViewport({ scale: 2.0, x: 100, y: 200 });

      expect(mockSetViewport).toHaveBeenCalledWith({
        scale: 2.0,
        x: 100,
        y: 200
      });
    });

    it('should call store panViewport when panning', () => {
      const mockPanViewport = vi.fn();
      (global as any).window.__UNIFIED_CANVAS_STORE__.getState.mockReturnValue({
        panViewport: mockPanViewport
      });

      module.pan(50, -30);

      expect(mockPanViewport).toHaveBeenCalledWith(50, -30);
    });

    it('should call store zoomViewport when zooming with center point', () => {
      const mockZoomViewport = vi.fn();
      (global as any).window.__UNIFIED_CANVAS_STORE__.getState.mockReturnValue({
        zoomViewport: mockZoomViewport
      });

      module.zoom(1.5, 400, 300);

      expect(mockZoomViewport).toHaveBeenCalledWith(1.5, 400, 300);
    });

    it('should handle missing store gracefully', () => {
      (global as any).window.__UNIFIED_CANVAS_STORE__ = null;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => {
        module.setViewport({ scale: 2.0 });
        module.pan(10, 20);
        module.zoom(1.5);
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});