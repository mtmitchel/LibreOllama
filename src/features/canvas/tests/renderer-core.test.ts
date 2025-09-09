import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Konva from 'konva';
import { RendererCore, createRendererCore, RendererLifecycleState, type RendererCoreConfig, type RendererLayers } from '../renderer/core/RendererCore';
import type { ElementId, CanvasElement } from '../types/enhanced.types';

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };

// Create mock Konva layers
const createMockLayer = (name: string): Konva.Layer => {
  const layer = new Konva.Layer({ name });
  layer.moveToBottom = vi.fn().mockReturnValue(layer);
  layer.moveUp = vi.fn().mockReturnValue(layer);
  layer.moveToTop = vi.fn().mockReturnValue(layer);
  layer.add = vi.fn();
  return layer;
};

// Create mock stage
const createMockStage = (): Konva.Stage => {
  const stage = new Konva.Stage({
    container: document.createElement('div'),
    width: 800,
    height: 600,
  });

  // Mock layer finding
  stage.findOne = vi.fn((selector: string) => {
    if (selector === '.background-layer') return createMockLayer('background-layer');
    if (selector === '.main-layer') return createMockLayer('main-layer');
    if (selector === '.preview-layer') return createMockLayer('preview-layer');
    if (selector === '.preview-fast-layer') return createMockLayer('preview-fast-layer');
    if (selector === '.overlay-layer') return createMockLayer('overlay-layer');
    return null;
  });

  stage.add = vi.fn();
  return stage;
};

// Create mock node
const createMockNode = (id: string, type: string): Konva.Group => {
  const node = new Konva.Group({ id, name: type });
  node.getClientRect = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 }));
  node.destroy = vi.fn();
  return node;
};

describe('RendererCore', () => {
  let rendererCore: RendererCore;
  let mockStage: Konva.Stage;
  let mockLayers: RendererLayers;
  let mockUpdateCallback: vi.Mock;
  let config: RendererCoreConfig;

  beforeEach(() => {
    // Mock console to reduce noise
    console.info = vi.fn();
    console.warn = vi.fn();
    console.debug = vi.fn();
    console.error = vi.fn();

    // Create mock objects
    mockStage = createMockStage();
    mockLayers = {
      background: createMockLayer('background-layer'),
      main: createMockLayer('main-layer'),
      preview: createMockLayer('preview-layer'),
      overlay: createMockLayer('overlay-layer'),
    };
    mockUpdateCallback = vi.fn();

    // Create configuration
    config = {
      stage: mockStage,
      layers: mockLayers,
      onUpdateElement: mockUpdateCallback,
      debug: { log: false },
    };

    rendererCore = new RendererCore(config);
  });

  afterEach(async () => {
    if (rendererCore.getLifecycleState() !== RendererLifecycleState.DESTROYED) {
      await rendererCore.destroy();
    }
    
    // Restore console
    Object.assign(console, originalConsole);
  });

  describe('initialization', () => {
    it('should create with uninitialized state', () => {
      expect(rendererCore.getLifecycleState()).toBe(RendererLifecycleState.UNINITIALIZED);
      expect(rendererCore.isReady()).toBe(false);
    });

    it('should initialize successfully with provided layers', async () => {
      await rendererCore.init();

      expect(rendererCore.getLifecycleState()).toBe(RendererLifecycleState.READY);
      expect(rendererCore.isReady()).toBe(true);
      expect(rendererCore.getLayers()).toBe(mockLayers);
      expect(rendererCore.getStage()).toBe(mockStage);
    });

    it('should initialize with auto-discovered layers', async () => {
      const configWithoutLayers: RendererCoreConfig = {
        stage: mockStage,
        onUpdateElement: mockUpdateCallback,
        debug: { log: false },
      };
      
      const coreWithoutLayers = new RendererCore(configWithoutLayers);
      await coreWithoutLayers.init();

      expect(coreWithoutLayers.isReady()).toBe(true);
      expect(coreWithoutLayers.getLayers()).toBeDefined();
      
      await coreWithoutLayers.destroy();
    });

    it('should create fallback layers when missing', async () => {
      mockStage.findOne = vi.fn(() => null); // No layers found

      const configWithoutLayers: RendererCoreConfig = {
        stage: mockStage,
        debug: { log: false },
      };
      
      const coreWithFallbacks = new RendererCore(configWithoutLayers);
      await coreWithFallbacks.init();

      expect(console.warn).toHaveBeenCalledWith('[RendererCore] Missing required layers; creating fallbacks');
      expect(coreWithFallbacks.getLayers()).toBeDefined();
      
      await coreWithFallbacks.destroy();
    });

    it('should throw error when initializing without stage', async () => {
      const invalidConfig: RendererCoreConfig = {
        stage: undefined as any,
      };
      
      const invalidCore = new RendererCore(invalidConfig);
      
      await expect(invalidCore.init()).rejects.toThrow('Stage is required for renderer initialization');
    });

    it('should not allow double initialization', async () => {
      await rendererCore.init();
      
      await expect(rendererCore.init()).rejects.toThrow('Cannot initialize renderer in state: ready');
    });

    it('should initialize with performance tracking', async () => {
      const perfConfig: RendererCoreConfig = {
        stage: mockStage,
        layers: mockLayers,
        enablePerformanceTracking: true,
        debug: { log: false, logPerformance: true },
      };
      
      const perfCore = new RendererCore(perfConfig);
      await perfCore.init();

      const metrics = perfCore.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.nodesCreated).toBe('number');
      
      await perfCore.destroy();
    });

    it('should initialize with spatial indexing', async () => {
      const spatialConfig: RendererCoreConfig = {
        stage: mockStage,
        layers: mockLayers,
        spatialIndexing: true,
        debug: { log: false },
      };
      
      const spatialCore = new RendererCore(spatialConfig);
      await spatialCore.init();

      expect(spatialCore.isReady()).toBe(true);
      
      await spatialCore.destroy();
    });
  });

  describe('node registry', () => {
    beforeEach(async () => {
      await rendererCore.init();
    });

    it('should register nodes correctly', () => {
      const node = createMockNode('test-1', 'rectangle');
      const elementId = 'test-1' as ElementId;

      rendererCore.registerNode(elementId, node, 'rectangle');

      expect(rendererCore.getNode(elementId)).toBe(node);
      const entry = rendererCore.getNodeEntry(elementId);
      expect(entry?.elementId).toBe(elementId);
      expect(entry?.elementType).toBe('rectangle');
      expect(entry?.node).toBe(node);
    });

    it('should unregister nodes correctly', () => {
      const node = createMockNode('test-1', 'rectangle');
      const elementId = 'test-1' as ElementId;

      rendererCore.registerNode(elementId, node, 'rectangle');
      const unregistered = rendererCore.unregisterNode(elementId);

      expect(unregistered).toBe(true);
      expect(rendererCore.getNode(elementId)).toBeUndefined();
      expect(node.destroy).toHaveBeenCalled();
    });

    it('should handle unregistering non-existent nodes', () => {
      const result = rendererCore.unregisterNode('non-existent' as ElementId);
      expect(result).toBe(false);
    });

    it('should replace existing nodes when registering same ID', () => {
      const node1 = createMockNode('test-1', 'rectangle');
      const node2 = createMockNode('test-1', 'circle');
      const elementId = 'test-1' as ElementId;

      rendererCore.registerNode(elementId, node1, 'rectangle');
      rendererCore.registerNode(elementId, node2, 'circle');

      expect(rendererCore.getNode(elementId)).toBe(node2);
      expect(node1.destroy).toHaveBeenCalled();
    });

    it('should get nodes by type', () => {
      const rect1 = createMockNode('rect-1', 'rectangle');
      const rect2 = createMockNode('rect-2', 'rectangle');
      const circle = createMockNode('circle-1', 'circle');

      rendererCore.registerNode('rect-1' as ElementId, rect1, 'rectangle');
      rendererCore.registerNode('rect-2' as ElementId, rect2, 'rectangle');
      rendererCore.registerNode('circle-1' as ElementId, circle, 'circle');

      const rectangles = rendererCore.getNodesByType('rectangle');
      const circles = rendererCore.getNodesByType('circle');

      expect(rectangles).toHaveLength(2);
      expect(rectangles).toContain(rect1);
      expect(rectangles).toContain(rect2);
      expect(circles).toHaveLength(1);
      expect(circles).toContain(circle);
    });

    it('should update node metadata', async () => {
      const node = createMockNode('test-1', 'rectangle');
      const elementId = 'test-1' as ElementId;

      rendererCore.registerNode(elementId, node, 'rectangle');
      
      const originalEntry = rendererCore.getNodeEntry(elementId);
      const originalTime = originalEntry?.lastUpdated || 0;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));

      // Update metadata
      rendererCore.updateNodeMetadata(elementId, { elementType: 'square' });
      
      const updatedEntry = rendererCore.getNodeEntry(elementId);
      expect(updatedEntry?.elementType).toBe('square');
      expect(updatedEntry?.lastUpdated).toBeGreaterThan(originalTime);
    });

    it('should provide registry statistics', () => {
      rendererCore.registerNode('rect-1' as ElementId, createMockNode('rect-1', 'rectangle'), 'rectangle');
      rendererCore.registerNode('rect-2' as ElementId, createMockNode('rect-2', 'rectangle'), 'rectangle');
      rendererCore.registerNode('circle-1' as ElementId, createMockNode('circle-1', 'circle'), 'circle');

      const stats = rendererCore.getRegistryStats();

      expect(stats.totalNodes).toBe(3);
      expect(stats.nodesByType.rectangle).toBe(2);
      expect(stats.nodesByType.circle).toBe(1);
      expect(stats.oldestNode).toBeGreaterThan(0);
      expect(stats.newestNode).toBeGreaterThan(0);
    });

    it('should clear all nodes', () => {
      const node1 = createMockNode('test-1', 'rectangle');
      const node2 = createMockNode('test-2', 'circle');

      rendererCore.registerNode('test-1' as ElementId, node1, 'rectangle');
      rendererCore.registerNode('test-2' as ElementId, node2, 'circle');

      rendererCore.clearAllNodes();

      expect(rendererCore.getRegistryStats().totalNodes).toBe(0);
      expect(node1.destroy).toHaveBeenCalled();
      expect(node2.destroy).toHaveBeenCalled();
    });
  });

  describe('element synchronization', () => {
    beforeEach(async () => {
      await rendererCore.init();
    });

    it('should sync array of elements', () => {
      const elements: CanvasElement[] = [
        { id: '1' as ElementId, type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } as any,
        { id: '2' as ElementId, type: 'circle', x: 50, y: 50, radius: 25 } as any,
      ];

      expect(() => {
        rendererCore.syncElements(elements);
      }).not.toThrow();

      const metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.syncOperations).toBe(1);
    });

    it('should sync map of elements', () => {
      const elementsMap = new Map<ElementId, CanvasElement>([
        ['1' as ElementId, { id: '1' as ElementId, type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } as any],
        ['2' as ElementId, { id: '2' as ElementId, type: 'circle', x: 50, y: 50, radius: 25 } as any],
      ]);

      expect(() => {
        rendererCore.syncElements(elementsMap);
      }).not.toThrow();

      const metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.syncOperations).toBe(1);
    });

    it('should handle sync errors gracefully', () => {
      // Create elements that will cause the syncSingleElement to fail
      const invalidElements: any[] = [{}, { invalid: true }];

      // Should not throw - errors are handled internally
      expect(() => {
        rendererCore.syncElements(invalidElements);
      }).not.toThrow();

      const metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.syncOperations).toBeGreaterThan(0);
    });

    it('should reject sync when not ready', () => {
      const notReadyCore = new RendererCore(config);
      const elements: CanvasElement[] = [];

      expect(() => {
        notReadyCore.syncElements(elements);
      }).toThrow('Renderer not ready');
    });
  });

  describe('configuration updates', () => {
    beforeEach(async () => {
      await rendererCore.init();
    });

    it('should update configuration', () => {
      const newCallback = vi.fn();
      
      rendererCore.updateConfig({
        onUpdateElement: newCallback,
        debug: { log: true },
      });

      // Configuration should be updated (though we can't directly test private config)
      expect(() => rendererCore.updateConfig({})).not.toThrow();
    });

    it('should handle empty config updates', () => {
      expect(() => {
        rendererCore.updateConfig({});
      }).not.toThrow();
    });
  });

  describe('performance metrics', () => {
    beforeEach(async () => {
      await rendererCore.init();
    });

    it('should track node creation and destruction', () => {
      const node = createMockNode('test-1', 'rectangle');
      
      let metrics = rendererCore.getPerformanceMetrics();
      const initialCreated = metrics.nodesCreated;
      const initialDestroyed = metrics.nodesDestroyed;

      rendererCore.registerNode('test-1' as ElementId, node, 'rectangle');
      metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.nodesCreated).toBe(initialCreated + 1);

      rendererCore.unregisterNode('test-1' as ElementId);
      metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.nodesDestroyed).toBe(initialDestroyed + 1);
    });

    it('should track sync operations', () => {
      const elements: CanvasElement[] = [
        { id: '1' as ElementId, type: 'rectangle', x: 0, y: 0, width: 100, height: 100 } as any,
      ];

      const initialMetrics = rendererCore.getPerformanceMetrics();
      rendererCore.syncElements(elements);
      const finalMetrics = rendererCore.getPerformanceMetrics();

      expect(finalMetrics.syncOperations).toBe(initialMetrics.syncOperations + 1);
      expect(finalMetrics.lastSyncDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return metrics copy', () => {
      const metrics1 = rendererCore.getPerformanceMetrics();
      const metrics2 = rendererCore.getPerformanceMetrics();

      expect(metrics1).toEqual(metrics2);
      expect(metrics1).not.toBe(metrics2); // Different objects
    });
  });

  describe('lifecycle management', () => {
    it('should handle destroy when not initialized', async () => {
      const core = new RendererCore(config);
      
      await expect(core.destroy()).resolves.not.toThrow();
      expect(core.getLifecycleState()).toBe(RendererLifecycleState.DESTROYED);
    });

    it('should destroy properly when initialized', async () => {
      await rendererCore.init();
      
      const node = createMockNode('test-1', 'rectangle');
      rendererCore.registerNode('test-1' as ElementId, node, 'rectangle');
      
      await rendererCore.destroy();
      
      expect(rendererCore.getLifecycleState()).toBe(RendererLifecycleState.DESTROYED);
      expect(node.destroy).toHaveBeenCalled();
      expect(rendererCore.getLayers()).toBeUndefined();
      expect(rendererCore.getStage()).toBeUndefined();
    });

    it('should handle multiple destroy calls', async () => {
      await rendererCore.init();
      
      await rendererCore.destroy();
      await expect(rendererCore.destroy()).resolves.not.toThrow();
      
      expect(rendererCore.getLifecycleState()).toBe(RendererLifecycleState.DESTROYED);
    });

    it('should run cleanup tasks on destroy', async () => {
      const cleanupTask = vi.fn();
      
      await rendererCore.init();
      
      // Access private cleanupTasks array (for testing purposes)
      (rendererCore as any).cleanupTasks.push(cleanupTask);
      
      await rendererCore.destroy();
      
      expect(cleanupTask).toHaveBeenCalled();
    });

    it('should handle cleanup task errors gracefully', async () => {
      const failingTask = vi.fn(() => { throw new Error('Cleanup failed'); });
      
      await rendererCore.init();
      (rendererCore as any).cleanupTasks.push(failingTask);
      
      await expect(rendererCore.destroy()).resolves.not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('[RendererCore] Cleanup task failed:', expect.any(Error));
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await rendererCore.init();
    });

    it('should handle node destruction errors gracefully', () => {
      const faultyNode = createMockNode('test-1', 'rectangle');
      faultyNode.destroy = vi.fn(() => { throw new Error('Destroy failed'); });

      rendererCore.registerNode('test-1' as ElementId, faultyNode, 'rectangle');
      
      expect(() => {
        rendererCore.unregisterNode('test-1' as ElementId);
      }).not.toThrow();
      
      expect(console.warn).toHaveBeenCalledWith(
        '[RendererCore] Failed to destroy node test-1:',
        expect.any(Error)
      );
    });

    it('should handle spatial index errors gracefully', () => {
      // Create node with faulty getClientRect
      const faultyNode = createMockNode('test-1', 'rectangle');
      faultyNode.getClientRect = vi.fn(() => { throw new Error('getClientRect failed'); });

      // Enable spatial indexing for this test
      (rendererCore as any).spatialIndex = {
        insert: vi.fn(() => { throw new Error('Spatial insert failed'); }),
        remove: vi.fn(),
        clear: vi.fn(),
      };

      expect(() => {
        rendererCore.registerNode('test-1' as ElementId, faultyNode, 'rectangle');
      }).not.toThrow();
    });
  });

  describe('createRendererCore utility', () => {
    it('should create RendererCore with utility function', async () => {
      const utilityCore = createRendererCore(mockStage, {
        layers: mockLayers,
        onUpdateElement: mockUpdateCallback,
        enablePerformanceTracking: true,
        spatialIndexing: true,
        debug: true,
      });

      expect(utilityCore).toBeInstanceOf(RendererCore);
      
      await utilityCore.init();
      expect(utilityCore.isReady()).toBe(true);
      
      await utilityCore.destroy();
    });

    it('should create RendererCore without options', async () => {
      const simpleCore = createRendererCore(mockStage);

      expect(simpleCore).toBeInstanceOf(RendererCore);
      
      await simpleCore.init();
      expect(simpleCore.isReady()).toBe(true);
      
      await simpleCore.destroy();
    });
  });

  describe('layer management', () => {
    beforeEach(async () => {
      await rendererCore.init();
    });

    it('should ensure proper layer ordering', () => {
      const layers = rendererCore.getLayers();
      
      expect(layers?.background.moveToBottom).toHaveBeenCalled();
      expect(layers?.main.moveUp).toHaveBeenCalled();
      expect(layers?.preview.moveUp).toHaveBeenCalled();
      expect(layers?.overlay.moveToTop).toHaveBeenCalled();
    });

    it('should return layer references', () => {
      const layers = rendererCore.getLayers();
      
      expect(layers).toBeDefined();
      expect(layers?.background).toBeDefined();
      expect(layers?.main).toBeDefined();
      expect(layers?.preview).toBeDefined();
      expect(layers?.overlay).toBeDefined();
    });
  });

  describe('state validation', () => {
    it('should enforce ready state for operations', () => {
      const notReadyCore = new RendererCore(config);
      const node = createMockNode('test-1', 'rectangle');

      expect(() => {
        notReadyCore.registerNode('test-1' as ElementId, node, 'rectangle');
      }).toThrow('Renderer not ready');

      expect(() => {
        notReadyCore.syncElements([]);
      }).toThrow('Renderer not ready');
    });

    it('should provide accurate ready state', async () => {
      expect(rendererCore.isReady()).toBe(false);
      
      await rendererCore.init();
      expect(rendererCore.isReady()).toBe(true);
      
      await rendererCore.destroy();
      expect(rendererCore.isReady()).toBe(false);
    });
  });
});