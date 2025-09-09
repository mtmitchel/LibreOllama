import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Konva from 'konva';
import { SelectionManager, type SelectionManagerStoreAdapter, type SelectionManagerConfig } from '../renderer/selection/SelectionManager';
import type { ElementId } from '../types/enhanced.types';

// Mock store adapter
const createMockStoreAdapter = (): SelectionManagerStoreAdapter => ({
  updateElement: vi.fn(),
  getSelectedElementIds: vi.fn(() => new Set<ElementId>()),
  saveSnapshot: vi.fn(),
});

// Create mock Konva nodes with proper typing
const createMockNode = (
  type: string,
  id: string,
  props: Partial<Konva.NodeConfig> = {}
): Konva.Group => {
  const group = new Konva.Group({
    id,
    x: 100,
    y: 100,
    name: type, // Use name for connector filtering
    ...props,
  });
  
  // Add a shape to the group
  const rect = new Konva.Rect({
    width: 200,
    height: 100,
    fill: 'blue',
  });
  group.add(rect);
  
  // Add custom properties for element type identification
  (group as any).elementType = type;
  (group as any).elementId = id;
  
  return group;
};

describe('SelectionManager', () => {
  let stage: Konva.Stage;
  let overlayLayer: Konva.Layer;
  let selectionManager: SelectionManager;
  let mockStoreAdapter: SelectionManagerStoreAdapter;
  let nodeMap: Map<string, Konva.Node>;

  beforeEach(() => {
    // Create container for stage
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create Konva stage and layer
    stage = new Konva.Stage({
      container: 'test-container',
      width: 800,
      height: 600,
    });
    overlayLayer = new Konva.Layer();
    stage.add(overlayLayer);

    // Create node map and mock store
    nodeMap = new Map();
    mockStoreAdapter = createMockStoreAdapter();

    // Create selection manager
    const config: SelectionManagerConfig = {
      overlayLayer,
      nodeMap,
      storeAdapter: mockStoreAdapter,
      debug: { log: false },
    };
    selectionManager = new SelectionManager(config);

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    selectionManager.destroy();
    stage.destroy();
    const container = document.getElementById('test-container');
    if (container) {
      document.body.removeChild(container);
    }
  });

  describe('initialization', () => {
    it('should initialize with proper configuration', () => {
      expect(selectionManager).toBeDefined();
      expect(selectionManager.getTransformer()).toBeInstanceOf(Konva.Transformer);
    });

    it('should create transformer with default configuration', () => {
      const transformer = selectionManager.getTransformer();
      expect(transformer).toBeInstanceOf(Konva.Transformer);
      expect(transformer?.anchorSize()).toBe(8);
      expect(transformer?.borderStroke()).toBe('#007AFF');
      expect(transformer?.borderStrokeWidth()).toBe(1);
      expect(transformer?.anchorFill()).toBe('#007AFF');
      expect(transformer?.anchorStroke()).toBe('#ffffff');
      expect(transformer?.anchorStrokeWidth()).toBe(1);
    });

    it('should be added to overlay layer', () => {
      const transformer = selectionManager.getTransformer();
      expect(overlayLayer.findOne('Transformer')).toBe(transformer);
    });
  });

  describe('selection syncing', () => {
    it('should sync empty selection', () => {
      const selectedIds = new Set<ElementId>();
      selectionManager.syncSelection(selectedIds);
      
      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes()).toHaveLength(0);
    });

    it('should sync single element selection', () => {
      const node = createMockNode('rectangle', 'rect-1');
      nodeMap.set('rect-1', node);
      overlayLayer.add(node);

      const selectedIds = new Set<ElementId>(['rect-1' as ElementId]);
      selectionManager.syncSelection(selectedIds);

      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes()).toHaveLength(1);
      expect(transformer?.nodes()[0]).toBe(node);
    });

    it('should sync multiple element selection', () => {
      const node1 = createMockNode('rectangle', 'rect-1');
      const node2 = createMockNode('circle', 'circle-1');
      nodeMap.set('rect-1', node1);
      nodeMap.set('circle-1', node2);
      overlayLayer.add(node1);
      overlayLayer.add(node2);

      const selectedIds = new Set<ElementId>(['rect-1' as ElementId, 'circle-1' as ElementId]);
      selectionManager.syncSelection(selectedIds);

      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes()).toHaveLength(2);
      expect(transformer?.nodes()).toContain(node1);
      expect(transformer?.nodes()).toContain(node2);
    });

    it('should filter out connector elements from selection', () => {
      const rectNode = createMockNode('rectangle', 'rect-1');
      const connectorNode = createMockNode('connector', 'conn-1');
      nodeMap.set('rect-1', rectNode);
      nodeMap.set('conn-1', connectorNode);
      overlayLayer.add(rectNode);
      overlayLayer.add(connectorNode);

      const selectedIds = new Set<ElementId>(['rect-1' as ElementId, 'conn-1' as ElementId]);
      selectionManager.syncSelection(selectedIds);

      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes()).toHaveLength(1);
      expect(transformer?.nodes()[0]).toBe(rectNode);
    });

    it('should filter out non-existent nodes', () => {
      const node = createMockNode('rectangle', 'rect-1');
      nodeMap.set('rect-1', node);
      overlayLayer.add(node);

      const selectedIds = new Set<ElementId>(['rect-1' as ElementId, 'non-existent' as ElementId]);
      selectionManager.syncSelection(selectedIds);

      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes()).toHaveLength(1);
      expect(transformer?.nodes()[0]).toBe(node);
    });
  });

  describe('transformer properties', () => {
    it('should have transformer visible property', () => {
      expect(typeof selectionManager.isTransformerVisible()).toBe('boolean');
    });

    it('should start with transformer visible', () => {
      expect(selectionManager.isTransformerVisible()).toBe(true);
    });

    it('should show transformer when nodes are selected', () => {
      const node = createMockNode('rectangle', 'rect-1');
      nodeMap.set('rect-1', node);
      overlayLayer.add(node);

      selectionManager.syncSelection(new Set(['rect-1' as ElementId]));
      
      // After sync, transformer should have nodes
      const transformer = selectionManager.getTransformer();
      expect(transformer?.nodes().length).toBeGreaterThan(0);
    });
  });

  describe('refresh functionality', () => {
    it('should refresh transformer', () => {
      expect(() => {
        selectionManager.refreshTransformer();
      }).not.toThrow();
    });

    it('should refresh transformer for specific element', () => {
      const node = createMockNode('rectangle', 'rect-1');
      nodeMap.set('rect-1', node);
      overlayLayer.add(node);

      expect(() => {
        selectionManager.refreshTransformer('rect-1' as ElementId);
      }).not.toThrow();
    });
  });

  describe('configuration updates', () => {
    it('should update transformer policies', () => {
      const newPolicies = {
        'custom-type': {
          enabledAnchors: ['top-left', 'bottom-right'],
          keepRatio: true,
          rotateEnabled: false,
        }
      };

      expect(() => {
        selectionManager.updateTransformerPolicies(newPolicies);
      }).not.toThrow();
    });

    it('should update configuration', () => {
      const newConfig = {
        debug: { log: true }
      };

      expect(() => {
        selectionManager.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('keyboard handling', () => {
    it('should handle shift key events without errors', () => {
      const keyDownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
      const keyUpEvent = new KeyboardEvent('keyup', { key: 'Shift' });
      
      expect(() => {
        document.dispatchEvent(keyDownEvent);
        document.dispatchEvent(keyUpEvent);
      }).not.toThrow();
    });

    it('should ignore non-shift keys', () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      expect(() => {
        document.dispatchEvent(keyEvent);
      }).not.toThrow();
    });
  });

  describe('transform events', () => {
    it('should handle transform events', () => {
      const node = createMockNode('rectangle', 'rect-1');
      nodeMap.set('rect-1', node);
      overlayLayer.add(node);

      selectionManager.syncSelection(new Set(['rect-1' as ElementId]));

      const transformer = selectionManager.getTransformer();
      
      expect(() => {
        transformer?.fire('transformstart');
        transformer?.fire('transformend');
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should remove transformer from layer on destroy', () => {
      const transformer = selectionManager.getTransformer();
      expect(overlayLayer.findOne('Transformer')).toBe(transformer);
      
      selectionManager.destroy();
      
      expect(overlayLayer.findOne('Transformer')).toBeUndefined();
    });

    it('should handle multiple destroy calls gracefully', () => {
      expect(() => {
        selectionManager.destroy();
        selectionManager.destroy();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle missing nodes gracefully', () => {
      const selectedIds = new Set<ElementId>(['non-existent' as ElementId]);
      
      expect(() => {
        selectionManager.syncSelection(selectedIds);
      }).not.toThrow();
    });

    it('should handle store adapter errors gracefully', () => {
      // Make updateElement throw an error
      mockStoreAdapter.updateElement = vi.fn(() => {
        throw new Error('Store update failed');
      });
      
      const node = createMockNode('rectangle', 'rect-1');
      nodeMap.set('rect-1', node);
      overlayLayer.add(node);

      expect(() => {
        selectionManager.syncSelection(new Set(['rect-1' as ElementId]));
        // Trigger transform end event
        const transformer = selectionManager.getTransformer();
        transformer?.fire('transformend');
      }).not.toThrow();
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig: Partial<SelectionManagerConfig> = {
        overlayLayer: undefined as any,
      };
      
      expect(() => {
        new SelectionManager(invalidConfig as SelectionManagerConfig);
      }).not.toThrow();
    });
  });

  describe('store integration', () => {
    it('should call store methods during transforms', () => {
      const node = createMockNode('rectangle', 'rect-1');
      nodeMap.set('rect-1', node);
      overlayLayer.add(node);
      
      // Set the node to have some scale
      node.scaleX(1.5);
      node.scaleY(1.2);

      selectionManager.syncSelection(new Set(['rect-1' as ElementId]));

      const transformer = selectionManager.getTransformer();
      transformer?.fire('transformend');

      // Should call updateElement during normalization if scales changed
      expect(mockStoreAdapter.updateElement).toHaveBeenCalled();
    });
  });
});