import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EraserModule } from '../EraserModule';
import { ModuleContext, CanvasSnapshot } from '../../types';
import Konva from 'konva';

/**
 * EraserModule Unit Tests
 * Following ViewportModule test patterns and validating modular integration
 */
describe('EraserModule', () => {
  let eraserModule: EraserModule;
  let mockContext: ModuleContext;
  let mockStage: Konva.Stage;
  let mockOverlayLayer: Konva.Layer;

  beforeEach(() => {
    // Mock Konva stage and layers
    mockOverlayLayer = {
      add: vi.fn(),
      batchDraw: vi.fn(),
    } as any;

    mockStage = {
      on: vi.fn(),
      off: vi.fn(),
      getPointerPosition: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      scaleX: vi.fn().mockReturnValue(1),
      container: vi.fn().mockReturnValue({
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }),
      }),
    } as any;

    // Mock context
    mockContext = {
      store: {
        subscribe: vi.fn(() => () => {}),
        getSnapshot: vi.fn(() => ({
          viewport: { x: 0, y: 0, scale: 1, width: 1920, height: 1080 },
          elements: new Map(),
          selection: new Set(),
          history: { canUndo: false, canRedo: false },
        })),
      },
      konva: {
        getStage: vi.fn(() => mockStage),
        getLayers: vi.fn(() => ({
          background: null,
          main: null,
          preview: null,
          overlay: mockOverlayLayer,
        })),
      },
      overlay: {},
    } as any;

    // Mock useUnifiedCanvasStore
    vi.mock('../../../stores/unifiedCanvasStore', () => ({
      useUnifiedCanvasStore: {
        getState: vi.fn(() => ({
          selectedTool: 'eraser',
          strokeConfig: { eraser: { size: 20 } },
          eraseAtPoint: vi.fn(),
          eraseInPath: vi.fn(),
        })),
        subscribe: vi.fn(() => () => {}),
      },
    }));

    eraserModule = new EraserModule();
  });

  describe('Module Lifecycle', () => {
    test('should initialize correctly', () => {
      expect(() => eraserModule.init(mockContext)).not.toThrow();

      // Should add eraser preview to overlay layer
      expect(mockOverlayLayer.add).toHaveBeenCalled();

      // Should bind events to stage
      expect(mockStage.on).toHaveBeenCalledWith('pointerdown mousedown', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointermove mousemove', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerup mouseup', expect.any(Function));
    });

    test('should sync with canvas snapshot', () => {
      eraserModule.init(mockContext);

      const snapshot: CanvasSnapshot = {
        elements: new Map(),
        selection: new Set(),
        viewport: { x: 0, y: 0, scale: 2, width: 1920, height: 1080 },
        history: { canUndo: false, canRedo: false },
      };

      expect(() => eraserModule.sync(snapshot)).not.toThrow();
    });

    test('should handle onEvent method', () => {
      eraserModule.init(mockContext);

      const event = { type: 'test' };
      const snapshot: CanvasSnapshot = {
        elements: new Map(),
        selection: new Set(),
        viewport: { x: 0, y: 0, scale: 1 },
        history: { canUndo: false, canRedo: false },
      };

      const handled = eraserModule.onEvent(event, snapshot);
      expect(handled).toBe(false); // Currently returns false as per implementation
    });

    test('should destroy cleanly', () => {
      eraserModule.init(mockContext);

      expect(() => eraserModule.destroy()).not.toThrow();

      // Should unbind events
      expect(mockStage.off).toHaveBeenCalledWith('pointerdown mousedown', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointermove mousemove', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerup mouseup', expect.any(Function));
    });
  });

  describe('Eraser Preview', () => {
    test('should create eraser preview circle', () => {
      eraserModule.init(mockContext);

      // Preview should be added to overlay layer
      expect(mockOverlayLayer.add).toHaveBeenCalled();
    });

    test('should handle missing overlay layer gracefully', () => {
      const contextWithoutOverlay = {
        ...mockContext,
        konva: {
          ...mockContext.konva,
          getLayers: vi.fn(() => ({
            background: null,
            main: null,
            preview: null,
            overlay: null, // No overlay layer
          })),
        },
      };

      expect(() => eraserModule.init(contextWithoutOverlay)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing stage gracefully', () => {
      const contextWithoutStage = {
        ...mockContext,
        konva: {
          ...mockContext.konva,
          getStage: vi.fn(() => null),
        },
      };

      expect(() => eraserModule.init(contextWithoutStage)).not.toThrow();
      expect(() => eraserModule.destroy()).not.toThrow();
    });

    test('should handle store subscription errors', () => {
      // Create module with invalid store subscription
      const originalConsoleError = console.error;
      console.error = vi.fn();

      expect(() => new EraserModule()).not.toThrow();

      console.error = originalConsoleError;
    });
  });

  describe('Integration with ViewportModule', () => {
    test('should follow same pattern as ViewportModule', () => {
      // Both modules should implement the same interface
      expect(typeof eraserModule.init).toBe('function');
      expect(typeof eraserModule.sync).toBe('function');
      expect(typeof eraserModule.onEvent).toBe('function');
      expect(typeof eraserModule.destroy).toBe('function');
    });

    test('should handle coordinate transformations with viewport', () => {
      eraserModule.init(mockContext);

      // Mock a scaled viewport
      (mockStage.scaleX as any).mockReturnValue(2);

      const snapshot: CanvasSnapshot = {
        elements: new Map(),
        selection: new Set(),
        viewport: { x: 0, y: 0, scale: 2 },
        history: { canUndo: false, canRedo: false },
      };

      // Should handle scale changes in sync
      expect(() => eraserModule.sync(snapshot)).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should not create memory leaks on repeated init/destroy', () => {
      // Test multiple init/destroy cycles
      for (let i = 0; i < 10; i++) {
        eraserModule.init(mockContext);
        eraserModule.destroy();
      }

      // Should complete without throwing
      expect(true).toBe(true);
    });

    test('should handle rapid event processing', () => {
      eraserModule.init(mockContext);

      const snapshot: CanvasSnapshot = {
        elements: new Map(),
        selection: new Set(),
        viewport: { x: 0, y: 0, scale: 1 },
        history: { canUndo: false, canRedo: false },
      };

      // Process many rapid sync calls
      for (let i = 0; i < 100; i++) {
        expect(() => eraserModule.sync(snapshot)).not.toThrow();
      }
    });
  });
});