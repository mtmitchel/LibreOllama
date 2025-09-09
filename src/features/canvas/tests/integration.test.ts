import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Konva from 'konva';
import { RendererCore } from '../renderer/core/RendererCore';
import { DrawBatcher } from '../renderer/drawing/DrawBatcher';
import { EventRouter } from '../renderer/events/EventRouter';
import { SelectionManager } from '../renderer/selection/SelectionManager';
import type { ElementId, CanvasElement } from '../types/enhanced.types';

/**
 * Comprehensive Integration Tests
 * Tests the complete modular canvas renderer architecture
 * Validates that all extracted systems work together properly
 */

// Mock DOM for canvas container
const createCanvasContainer = () => {
  const container = document.createElement('div');
  container.id = 'integration-test-container';
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);
  return container;
};

// Mock store adapter for testing
const createMockStoreAdapter = () => ({
  updateElement: vi.fn(),
  getSelectedElementIds: vi.fn(() => new Set<ElementId>()),
  saveSnapshot: vi.fn(),
  getElement: vi.fn((id: ElementId) => ({
    id,
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
  } as CanvasElement)),
});

// Create test elements
const createTestElements = (): CanvasElement[] => [
  {
    id: 'rect-1' as ElementId,
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as CanvasElement,
  {
    id: 'circle-1' as ElementId,
    type: 'circle',
    x: 300,
    y: 200,
    radius: 50,
    width: 100,
    height: 100,
    fill: '#00ff00',
    stroke: '#000000',
    strokeWidth: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as CanvasElement,
  {
    id: 'text-1' as ElementId,
    type: 'text',
    x: 500,
    y: 300,
    width: 150,
    height: 30,
    text: 'Test Text',
    fontSize: 16,
    fill: '#0000ff',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as CanvasElement,
];

describe('Canvas Renderer Integration Tests', () => {
  let container: HTMLDivElement;
  let stage: Konva.Stage;
  let rendererCore: RendererCore;
  let drawBatcher: DrawBatcher;
  let eventRouter: EventRouter;
  let selectionManager: SelectionManager;
  let mockStoreAdapter: ReturnType<typeof createMockStoreAdapter>;

  beforeEach(async () => {
    // Create DOM container
    container = createCanvasContainer();

    // Create Konva stage with layers
    stage = new Konva.Stage({
      container: container.id,
      width: 800,
      height: 600,
    });

    const backgroundLayer = new Konva.Layer({ name: 'background-layer', listening: false });
    const mainLayer = new Konva.Layer({ name: 'main-layer', listening: true });
    const previewLayer = new Konva.Layer({ name: 'preview-layer', listening: false });
    const overlayLayer = new Konva.Layer({ name: 'overlay-layer', listening: true });

    stage.add(backgroundLayer);
    stage.add(mainLayer);
    stage.add(previewLayer);
    stage.add(overlayLayer);

    // Create mock store adapter
    mockStoreAdapter = createMockStoreAdapter();

    // Initialize modular systems
    rendererCore = new RendererCore({
      stage,
      onUpdateElement: mockStoreAdapter.updateElement,
      enablePerformanceTracking: true,
      debug: { log: false },
    });

    await rendererCore.init();

    const layers = rendererCore.getLayers()!;
    
    drawBatcher = new DrawBatcher({
      layers: {
        main: layers.main,
        overlay: layers.overlay,
        preview: layers.preview,
      },
      debug: { log: false },
    });

    eventRouter = new EventRouter({
      stage,
      nodeMap: new Map(),
      storeAdapter: {
        getSelectedElementIds: mockStoreAdapter.getSelectedElementIds,
        updateSelection: vi.fn(),
        updateElement: mockStoreAdapter.updateElement,
      },
      debug: { log: false },
    });

    selectionManager = new SelectionManager({
      overlayLayer: layers.overlay,
      nodeMap: new Map(),
      storeAdapter: mockStoreAdapter,
      debug: { log: false },
    });
  });

  afterEach(async () => {
    // Clean up systems
    if (rendererCore) await rendererCore.destroy();
    if (drawBatcher) drawBatcher.destroy();
    if (eventRouter) eventRouter.destroy();
    if (selectionManager) selectionManager.destroy();
    
    // Clean up stage
    if (stage) stage.destroy();
    
    // Clean up DOM
    if (container) document.body.removeChild(container);
  });

  describe('System Initialization', () => {
    it('should initialize all systems successfully', () => {
      expect(rendererCore.isReady()).toBe(true);
      expect(rendererCore.getLayers()).toBeDefined();
      expect(drawBatcher).toBeDefined();
      expect(eventRouter).toBeDefined();
      expect(selectionManager.getTransformer()).toBeInstanceOf(Konva.Transformer);
    });

    it('should have proper layer structure', () => {
      const layers = rendererCore.getLayers()!;
      
      expect(layers.background).toBeInstanceOf(Konva.Layer);
      expect(layers.main).toBeInstanceOf(Konva.Layer);
      expect(layers.preview).toBeInstanceOf(Konva.Layer);
      expect(layers.overlay).toBeInstanceOf(Konva.Layer);
      
      // Check layer hierarchy
      const stageChildren = stage.getChildren();
      expect(stageChildren.length).toBe(4);
      expect(stageChildren[0].name()).toBe('background-layer');
      expect(stageChildren[3].name()).toBe('overlay-layer');
    });
  });

  describe('Element Management Integration', () => {
    it('should create and register elements', () => {
      const testElement = createTestElements()[0];
      const mockNode = new Konva.Group({ id: testElement.id, name: testElement.type });
      
      // Register element in core
      rendererCore.registerNode(testElement.id, mockNode, testElement.type);
      
      // Verify registration
      expect(rendererCore.getNode(testElement.id)).toBe(mockNode);
      
      const stats = rendererCore.getRegistryStats();
      expect(stats.totalNodes).toBe(1);
      expect(stats.nodesByType[testElement.type]).toBe(1);
    });

    it('should handle element synchronization', () => {
      const elements = createTestElements();
      
      expect(() => {
        rendererCore.syncElements(elements);
      }).not.toThrow();
      
      const metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.syncOperations).toBeGreaterThan(0);
    });

    it('should manage multiple element types', () => {
      const elements = createTestElements();
      
      elements.forEach((element, index) => {
        const mockNode = new Konva.Group({ 
          id: element.id, 
          name: element.type,
          x: element.x,
          y: element.y,
        });
        rendererCore.registerNode(element.id, mockNode, element.type);
      });
      
      const stats = rendererCore.getRegistryStats();
      expect(stats.totalNodes).toBe(3);
      expect(stats.nodesByType.rectangle).toBe(1);
      expect(stats.nodesByType.circle).toBe(1);
      expect(stats.nodesByType.text).toBe(1);
    });
  });

  describe('Drawing and Rendering Integration', () => {
    it('should coordinate drawing operations', () => {
      // Schedule draws for different layers
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');
      
      expect(drawBatcher.isDrawScheduled()).toBe(true);
      expect(drawBatcher.getDirtyLayers()).toEqual(['main', 'overlay']);
    });

    it('should handle force drawing', () => {
      const layers = rendererCore.getLayers()!;
      const batchDrawSpy = vi.spyOn(layers.main, 'batchDraw');
      
      drawBatcher.forceDraw('main');
      
      expect(batchDrawSpy).toHaveBeenCalled();
    });

    it('should invalidate all layers', () => {
      drawBatcher.invalidateAll();
      
      expect(drawBatcher.getDirtyLayers()).toEqual(['main', 'overlay', 'preview']);
      expect(drawBatcher.isDrawScheduled()).toBe(true);
    });
  });

  describe('Event Handling Integration', () => {
    it('should handle stage events', () => {
      const mockNode = new Konva.Group({ id: 'test-1', name: 'rectangle' });
      rendererCore.registerNode('test-1' as ElementId, mockNode, 'rectangle');
      eventRouter['config'].nodeMap.set('test-1', mockNode);
      
      // Simulate mouse event
      const mockEvent = {
        target: mockNode,
        evt: new MouseEvent('mousedown'),
        currentTarget: stage,
      };
      
      expect(() => {
        stage.fire('mousedown', mockEvent);
      }).not.toThrow();
    });

    it('should handle element selection events', () => {
      const mockNode = new Konva.Group({ id: 'test-1', name: 'rectangle' });
      rendererCore.registerNode('test-1' as ElementId, mockNode, 'rectangle');
      selectionManager['config'].nodeMap.set('test-1', mockNode);
      
      // Test selection
      selectionManager.syncSelection(new Set(['test-1' as ElementId]));
      
      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes()).toContain(mockNode);
    });

    it('should coordinate between event router and selection manager', () => {
      const mockNode = new Konva.Group({ id: 'test-1', name: 'rectangle' });
      rendererCore.registerNode('test-1' as ElementId, mockNode, 'rectangle');
      
      // Add to both systems
      eventRouter['config'].nodeMap.set('test-1', mockNode);
      selectionManager['config'].nodeMap.set('test-1', mockNode);
      
      // Simulate selection through event router
      mockStoreAdapter.getSelectedElementIds.mockReturnValue(new Set(['test-1' as ElementId]));
      selectionManager.syncSelection(new Set(['test-1' as ElementId]));
      
      expect(selectionManager.getTransformer()?.nodes()).toHaveLength(1);
    });
  });

  describe('Performance Integration', () => {
    it('should track performance metrics across systems', () => {
      const elements = createTestElements();
      
      // Register elements
      elements.forEach((element) => {
        const mockNode = new Konva.Group({ id: element.id, name: element.type });
        rendererCore.registerNode(element.id, mockNode, element.type);
      });
      
      // Sync elements
      rendererCore.syncElements(elements);
      
      // Draw operations
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');
      
      const metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.nodesCreated).toBe(3);
      expect(metrics.syncOperations).toBeGreaterThan(0);
      
      const drawStats = drawBatcher.getStats();
      expect(drawStats.dirtyLayerCount).toBeGreaterThan(0);
    });

    it('should handle memory management', () => {
      const elements = createTestElements();
      
      // Add many elements
      elements.forEach((element) => {
        const mockNode = new Konva.Group({ id: element.id, name: element.type });
        rendererCore.registerNode(element.id, mockNode, element.type);
      });
      
      let initialStats = rendererCore.getRegistryStats();
      expect(initialStats.totalNodes).toBe(3);
      
      // Clear all
      rendererCore.clearAllNodes();
      
      const finalStats = rendererCore.getRegistryStats();
      expect(finalStats.totalNodes).toBe(0);
      
      const metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.nodesDestroyed).toBe(3);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle system failures gracefully', () => {
      // Test with invalid data - our system handles this gracefully rather than throwing
      const invalidElements = [null, undefined, {}] as any[];
      
      expect(() => {
        rendererCore.syncElements(invalidElements);
      }).not.toThrow(); // Our system handles invalid input gracefully
      
      // Other systems should still work
      expect(rendererCore.isReady()).toBe(true);
      expect(drawBatcher.isDrawScheduled()).toBe(false);
    });

    it('should handle partial system failures', () => {
      const mockNode = new Konva.Group({ id: 'test-1', name: 'rectangle' });
      
      // Make node.destroy throw an error
      mockNode.destroy = vi.fn(() => {
        throw new Error('Destroy failed');
      });
      
      rendererCore.registerNode('test-1' as ElementId, mockNode, 'rectangle');
      
      // Should not crash the system
      expect(() => {
        rendererCore.clearAllNodes();
      }).not.toThrow();
    });

    it('should recover from drawing errors', () => {
      // Create a fresh DrawBatcher with a mock layer that throws
      const mockLayer = {
        batchDraw: vi.fn(() => {
          throw new Error('Draw failed');
        }),
      };
      
      const errorDrawBatcher = new DrawBatcher({
        layers: { main: mockLayer as any },
        debug: { log: false },
      });
      
      // Should handle the error gracefully
      expect(() => {
        errorDrawBatcher.forceDraw('main');
      }).not.toThrow();
      
      errorDrawBatcher.destroy();
    });
  });

  describe('Complex Workflow Integration', () => {
    it('should handle complete element lifecycle', async () => {
      const element = createTestElements()[0];
      
      // 1. Create and register element
      const mockNode = new Konva.Group({ 
        id: element.id, 
        name: element.type,
        x: element.x,
        y: element.y,
      });
      rendererCore.registerNode(element.id, mockNode, element.type);
      
      // 2. Add to layers and draw
      rendererCore.getLayers()!.main.add(mockNode);
      drawBatcher.scheduleDraw('main');
      
      // 3. Select element
      eventRouter['config'].nodeMap.set(element.id, mockNode);
      selectionManager['config'].nodeMap.set(element.id, mockNode);
      selectionManager.syncSelection(new Set([element.id]));
      
      // 4. Update element
      mockNode.x(element.x + 50);
      mockNode.y(element.y + 50);
      rendererCore.updateNodeMetadata(element.id, { elementType: element.type });
      drawBatcher.scheduleDraw('main');
      
      // 5. Verify state
      expect(rendererCore.getNode(element.id)).toBe(mockNode);
      expect(selectionManager.getTransformer()?.nodes()).toContain(mockNode);
      expect(drawBatcher.isLayerDirty('main')).toBe(true);
      
      // 6. Cleanup
      selectionManager.syncSelection(new Set());
      rendererCore.unregisterNode(element.id);
      
      expect(rendererCore.getNode(element.id)).toBeUndefined();
      expect(selectionManager.getTransformer()?.nodes()).toHaveLength(0);
    });

    it('should handle multi-element selection and manipulation', () => {
      const elements = createTestElements();
      const mockNodes: Konva.Group[] = [];
      
      // Create and register multiple elements
      elements.forEach((element) => {
        const mockNode = new Konva.Group({ 
          id: element.id, 
          name: element.type,
          x: element.x,
          y: element.y,
        });
        mockNodes.push(mockNode);
        
        rendererCore.registerNode(element.id, mockNode, element.type);
        eventRouter['config'].nodeMap.set(element.id, mockNode);
        selectionManager['config'].nodeMap.set(element.id, mockNode);
        rendererCore.getLayers()!.main.add(mockNode);
      });
      
      // Select all elements
      const allIds = new Set(elements.map(e => e.id));
      selectionManager.syncSelection(allIds);
      
      // Verify multi-selection
      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes()).toHaveLength(3);
      mockNodes.forEach(node => {
        expect(transformer?.nodes()).toContain(node);
      });
      
      // Update all selected elements
      drawBatcher.scheduleDraw('main');
      drawBatcher.scheduleDraw('overlay');
      
      expect(drawBatcher.getDirtyLayers()).toEqual(['main', 'overlay']);
    });

    it('should maintain system consistency during rapid operations', () => {
      const element = createTestElements()[0];
      const mockNode = new Konva.Group({ id: element.id, name: element.type });
      
      // Rapid operations
      for (let i = 0; i < 10; i++) {
        rendererCore.registerNode(element.id, mockNode, element.type);
        selectionManager['config'].nodeMap.set(element.id, mockNode);
        selectionManager.syncSelection(new Set([element.id]));
        drawBatcher.scheduleDraw('main');
        drawBatcher.scheduleDraw('overlay');
        selectionManager.syncSelection(new Set());
        drawBatcher.cancelScheduledDraw();
      }
      
      // System should remain stable
      expect(rendererCore.isReady()).toBe(true);
      expect(rendererCore.getNode(element.id)).toBe(mockNode);
      expect(selectionManager.getTransformer()?.nodes()).toHaveLength(0);
      expect(drawBatcher.hasAnyDirtyLayers()).toBe(false);
    });
  });

  describe('System Coordination', () => {
    it('should coordinate updates across all systems', () => {
      const elements = createTestElements();
      const mockNodes: Konva.Group[] = [];
      
      // Setup all systems with elements
      elements.forEach((element) => {
        const mockNode = new Konva.Group({ id: element.id, name: element.type });
        mockNodes.push(mockNode);
        
        // Register in all relevant systems
        rendererCore.registerNode(element.id, mockNode, element.type);
        eventRouter['config'].nodeMap.set(element.id, mockNode);
        selectionManager['config'].nodeMap.set(element.id, mockNode);
        rendererCore.getLayers()!.main.add(mockNode);
      });
      
      // Coordinate updates
      rendererCore.syncElements(elements);
      selectionManager.syncSelection(new Set([elements[0].id]));
      drawBatcher.invalidateAll();
      
      // Verify coordination
      expect(rendererCore.getRegistryStats().totalNodes).toBe(3);
      expect(selectionManager.getTransformer()?.nodes()).toHaveLength(1);
      expect(drawBatcher.getDirtyLayers()).toEqual(['main', 'overlay', 'preview']);
      
      // Performance metrics should reflect all operations
      const metrics = rendererCore.getPerformanceMetrics();
      expect(metrics.syncOperations).toBeGreaterThan(0);
      expect(metrics.nodesCreated).toBe(3);
    });
  });
});