/**
 * Performance Integration Manager Tests
 * Comprehensive testing of performance optimization integrations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceIntegrationManager } from '../renderer/performance/PerformanceIntegrationManager';
import { DrawBatcher } from '../renderer/drawing/DrawBatcher';
import { RendererCore } from '../renderer/core/RendererCore';
import { EventRouter } from '../renderer/events/EventRouter';
import { SelectionManager } from '../renderer/selection/SelectionManager';
import { CanvasElement, ElementId } from '../types/enhanced.types';
import Konva from 'konva';

// Mock Konva
vi.mock('konva', () => ({
  default: {
    Stage: vi.fn(() => ({
      container: vi.fn(),
      add: vi.fn(),
      draw: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      fire: vi.fn(),
      getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
    })),
    Layer: vi.fn(() => ({
      add: vi.fn(),
      draw: vi.fn(),
      batchDraw: vi.fn(),
      getChildren: vi.fn(() => []),
    })),
    Group: vi.fn(() => ({
      add: vi.fn(),
      getChildren: vi.fn(() => []),
      cache: vi.fn(),
      clearCache: vi.fn(),
    })),
    Rect: vi.fn(() => ({
      cache: vi.fn(),
      clearCache: vi.fn(),
      width: vi.fn().mockReturnValue(100),
      height: vi.fn().mockReturnValue(100),
    })),
    Circle: vi.fn(() => ({
      cache: vi.fn(),
      clearCache: vi.fn(),
      radius: vi.fn().mockReturnValue(50),
    })),
    Text: vi.fn(() => ({
      cache: vi.fn(),
      clearCache: vi.fn(),
      width: vi.fn().mockReturnValue(200),
      height: vi.fn().mockReturnValue(50),
    })),
    Transformer: vi.fn(() => ({
      nodes: vi.fn(),
      moveToTop: vi.fn(),
    })),
  }
}));

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50000000,
      jsHeapSizeLimit: 100000000,
    }
  }
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

describe('PerformanceIntegrationManager', () => {
  let performanceManager: PerformanceIntegrationManager;
  let mockStage: any;
  let mockLayer: any;
  let drawBatcher: DrawBatcher;
  let rendererCore: RendererCore;
  let eventRouter: EventRouter;
  let selectionManager: SelectionManager;

  beforeEach(() => {
    // Setup mocks
    mockStage = new Konva.Stage({
      container: document.createElement('div'),
      width: 800,
      height: 600
    });
    mockLayer = new Konva.Layer();

    // Create component instances
    drawBatcher = new DrawBatcher({
      layers: {
        main: mockLayer,
        overlay: mockLayer,
        preview: mockLayer
      },
      debug: { log: false }
    });
    rendererCore = new RendererCore({
      stage: mockStage,
      nodeMap: new Map(),
      onError: vi.fn()
    });
    eventRouter = new EventRouter({
      stage: mockStage,
      nodeMap: new Map(),
      storeAdapter: {
        updateElement: vi.fn(),
        getElements: vi.fn(() => new Map()),
        getSelectedElementIds: vi.fn(() => new Set()),
        setSelectedElementIds: vi.fn(),
        addToSelection: vi.fn(),
        removeFromSelection: vi.fn()
      }
    });
    selectionManager = new SelectionManager({
      stage: mockStage,
      nodeMap: new Map(),
      transformer: new Konva.Transformer()
    });

    performanceManager = new PerformanceIntegrationManager({
      enableShapeCaching: true,
      enableProgressiveRender: true,
      enableMemoryPressure: true,
      enableCircuitBreakers: true,
      enablePerformanceMonitoring: true
    });
  });

  afterEach(() => {
    performanceManager.destroy();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const manager = new PerformanceIntegrationManager();
      expect(manager).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const config = {
        enableShapeCaching: false,
        maxElements: 1000,
        targetFPS: 30
      };
      const manager = new PerformanceIntegrationManager(config);
      expect(manager).toBeDefined();
    });

    it('should initialize performance systems with components', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 Performance Integration Manager initialized',
        expect.objectContaining({
          shapeCaching: true,
          progressiveRender: true,
          memoryPressure: true,
          monitoring: true
        })
      );
    });
  });

  describe('Shape Caching Integration', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should apply caching to complex elements', () => {
      const complexElement: CanvasElement = {
        id: 'test-1',
        type: 'enhanced-table',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 2,
        rotation: 0,
        isLocked: false
      };

      const mockNode = new Konva.Group();
      const cacheSpy = vi.spyOn(mockNode, 'cache');
      
      // Simulate node creation with caching
      performanceManager['applyCachingToNode'](mockNode, complexElement);

      // Should schedule caching
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should not cache simple elements', () => {
      const simpleElement: CanvasElement = {
        id: 'test-2',
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 50,
        height: 50,
        rotation: 0,
        isLocked: false
      };

      const shouldCache = performanceManager['shouldCacheElement'](simpleElement);
      expect(shouldCache).toBe(false);
    });

    it('should cache large elements', () => {
      const largeElement: CanvasElement = {
        id: 'test-3',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 500,
        height: 500, // 250,000 pixels > 10,000 threshold
        rotation: 0,
        isLocked: false
      };

      const shouldCache = performanceManager['shouldCacheElement'](largeElement);
      expect(shouldCache).toBe(true);
    });

    it('should calculate element complexity correctly', () => {
      const complexElement: CanvasElement = {
        id: 'test-4',
        type: 'enhanced-table',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 3,
        rotation: 45,
        isLocked: false
      };

      const complexity = performanceManager['calculateElementComplexity'](complexElement);
      expect(complexity).toBeGreaterThan(5); // Should be high complexity
    });

    it('should generate consistent cache keys', () => {
      const element: CanvasElement = {
        id: 'test-5',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 0,
        isLocked: false
      };

      const key1 = performanceManager['generateCacheKey'](element);
      const key2 = performanceManager['generateCacheKey'](element);
      
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(16);
    });
  });

  describe('Progressive Rendering Integration', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should detect when progressive rendering is needed', () => {
      // Set high element count
      performanceManager.updateElementCount(2000);
      
      const shouldUse = performanceManager['shouldUseProgressiveRender']();
      expect(shouldUse).toBe(true);
    });

    it('should not use progressive rendering for small canvases', () => {
      // Set low element count
      performanceManager.updateElementCount(100);
      performanceManager['performanceMetrics'].frameRate = 60;
      
      const shouldUse = performanceManager['shouldUseProgressiveRender']();
      expect(shouldUse).toBe(false);
    });

    it('should adapt chunk size based on performance', () => {
      // High performance
      performanceManager['performanceMetrics'].frameRate = 60;
      let chunkSize = performanceManager['getAdaptiveChunkSize']();
      expect(chunkSize).toBe(100); // 50 * 2

      // Low performance
      performanceManager['performanceMetrics'].frameRate = 20;
      chunkSize = performanceManager['getAdaptiveChunkSize']();
      expect(chunkSize).toBe(25); // max(50 / 2, 10)

      // Very low performance
      performanceManager['performanceMetrics'].frameRate = 10;
      chunkSize = performanceManager['getAdaptiveChunkSize']();
      expect(chunkSize).toBe(25);
    });
  });

  describe('Memory Pressure Detection', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should detect memory pressure', () => {
      // Mock high memory usage
      (global.performance as any).memory.usedJSHeapSize = 90000000;
      (global.performance as any).memory.jsHeapSizeLimit = 100000000;
      
      const isUnderPressure = performanceManager['isUnderMemoryPressure']();
      expect(isUnderPressure).toBe(true);
    });

    it('should not detect memory pressure when memory is available', () => {
      // Mock low memory usage
      (global.performance as any).memory.usedJSHeapSize = 30000000;
      (global.performance as any).memory.jsHeapSizeLimit = 100000000;
      
      const isUnderPressure = performanceManager['isUnderMemoryPressure']();
      expect(isUnderPressure).toBe(false);
    });

    it('should cache more aggressively under memory pressure', () => {
      // Mock memory pressure
      (global.performance as any).memory.usedJSHeapSize = 90000000;
      
      const moderateElement: CanvasElement = {
        id: 'test-6',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fill: '#ff0000',
        stroke: '#000000',
        rotation: 0,
        isLocked: false
      };

      const shouldCache = performanceManager['shouldCacheElement'](moderateElement);
      expect(shouldCache).toBe(true); // Should cache under pressure
    });
  });

  describe('Circuit Breaker Protection', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should protect operations with circuit breaker', () => {
      const operation = vi.fn().mockReturnValue('success');
      
      const result = performanceManager['executeWithCircuitBreaker'](operation, 'test');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle circuit breaker failures', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => {
        performanceManager['executeWithCircuitBreaker'](operation, 'test');
      }).toThrow('Test error');

      const metrics = performanceManager.getMetrics();
      expect(metrics.circuitBreakerTriggered).toBe(1);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should track performance metrics', () => {
      const metrics = performanceManager.getMetrics();
      
      expect(metrics).toEqual(expect.objectContaining({
        frameRate: expect.any(Number),
        memoryUsage: expect.any(Number),
        elementCount: expect.any(Number),
        cachedElements: expect.any(Number),
        renderTime: expect.any(Number),
        batchedDraws: expect.any(Number),
        circuitBreakerTriggered: expect.any(Number),
        progressiveRenderProgress: expect.any(Number)
      }));
    });

    it('should update element count', () => {
      performanceManager.updateElementCount(500);
      
      const metrics = performanceManager.getMetrics();
      expect(metrics.elementCount).toBe(500);
    });

    it('should cleanup cached nodes', () => {
      const element: CanvasElement = {
        id: 'cleanup-test',
        type: 'enhanced-table',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
        isLocked: false
      };

      const mockNode = new Konva.Group();
      const clearCacheSpy = vi.spyOn(mockNode, 'clearCache');
      
      // Add node to cache
      performanceManager['cachedNodes'].set('cleanup-test' as ElementId, {
        node: mockNode,
        cacheKey: 'test-key',
        isCached: true,
        lastUsed: Date.now() - 400000, // 6 minutes ago (stale)
        complexity: 5
      });

      // Trigger cleanup
      performanceManager['cleanupCachedNodes']();

      expect(clearCacheSpy).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should clear all cached nodes', () => {
      const mockNode1 = new Konva.Group();
      const mockNode2 = new Konva.Group();
      const clearCacheSpy1 = vi.spyOn(mockNode1, 'clearCache');
      const clearCacheSpy2 = vi.spyOn(mockNode2, 'clearCache');

      // Add nodes to cache
      performanceManager['cachedNodes'].set('test-1' as ElementId, {
        node: mockNode1,
        cacheKey: 'key1',
        isCached: true,
        lastUsed: Date.now(),
        complexity: 3
      });

      performanceManager['cachedNodes'].set('test-2' as ElementId, {
        node: mockNode2,
        cacheKey: 'key2',
        isCached: true,
        lastUsed: Date.now(),
        complexity: 4
      });

      performanceManager.clearCache();

      expect(clearCacheSpy1).toHaveBeenCalled();
      expect(clearCacheSpy2).toHaveBeenCalled();
      expect(performanceManager['cachedNodes'].size).toBe(0);
      
      const metrics = performanceManager.getMetrics();
      expect(metrics.cachedElements).toBe(0);
    });
  });

  describe('Integration with DrawBatcher', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should enhance DrawBatcher with performance tracking', () => {
      const originalScheduleDraw = drawBatcher.scheduleDraw;
      
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
      
      // Should have been wrapped after initialization
      expect(drawBatcher.scheduleDraw).not.toBe(originalScheduleDraw);
    });
  });

  describe('Integration with SelectionManager', () => {
    beforeEach(() => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });
    });

    it('should limit selection size under memory pressure', () => {
      // Mock memory pressure
      (global.performance as any).memory.usedJSHeapSize = 95000000;
      
      const largeSelection = new Set<ElementId>();
      for (let i = 0; i < 200; i++) {
        largeSelection.add(`element-${i}` as ElementId);
      }

      const originalSyncSelection = selectionManager.syncSelection;
      const consoleSpy = vi.spyOn(console, 'warn');
      
      selectionManager.syncSelection(largeSelection);

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Limiting selection size due to memory pressure'
      );
    });
  });

  describe('Destruction', () => {
    it('should clean up resources on destroy', () => {
      performanceManager.initialize({
        drawBatcher,
        rendererCore,
        eventRouter,
        selectionManager
      });

      const clearCacheSpy = vi.spyOn(performanceManager, 'clearCache');
      const consoleSpy = vi.spyOn(console, 'log');

      performanceManager.destroy();

      expect(clearCacheSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔄 Performance Integration Manager destroyed'
      );
    });
  });
});