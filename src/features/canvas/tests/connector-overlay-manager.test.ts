import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectorOverlayManager, type ConnectorOverlayConfig, type ConnectorStoreAdapter } from '../renderer/connector/ConnectorOverlayManager';
import type { ElementId } from '../types/enhanced.types';

// Mock Konva objects
const createMockLayer = () => ({
  add: vi.fn(),
  batchDraw: vi.fn(),
  find: vi.fn(() => []),
  getAbsoluteTransform: vi.fn(() => ({
    copy: vi.fn(() => ({
      invert: vi.fn(() => ({
        point: vi.fn((pos: any) => pos)
      }))
    }))
  }))
} as any);

const createMockNode = () => ({
  strokeWidth: vi.fn(() => 2),
  points: vi.fn(() => [0, 0, 100, 100])
} as any);

const createMockCircle = () => ({
  on: vi.fn(),
  scale: vi.fn(),
  position: vi.fn(),
  getStage: vi.fn(() => ({
    container: vi.fn(() => ({
      style: {}
    }))
  })),
  getAbsolutePosition: vi.fn(() => ({ x: 50, y: 50 }))
} as any);

// Mock Konva globally
const createMockGroup = () => {
  let isVisible = false;
  let childCount = 0;
  
  return {
    add: vi.fn(() => childCount++),
    visible: vi.fn((val?: boolean) => {
      if (val !== undefined) {
        isVisible = val;
      }
      return isVisible;
    }),
    destroyChildren: vi.fn(() => childCount = 0),
    destroy: vi.fn(),
    hasChildren: vi.fn(() => childCount > 0),
    name: vi.fn(),
    listening: vi.fn()
  };
};

global.Konva = {
  Group: vi.fn(() => createMockGroup()),
  Line: vi.fn(() => ({
    name: vi.fn(),
    points: vi.fn(),
    stroke: vi.fn(),
    strokeWidth: vi.fn(),
    lineCap: vi.fn(),
    lineJoin: vi.fn(),
    listening: vi.fn(),
    strokeScaleEnabled: vi.fn()
  })),
  Circle: vi.fn(() => createMockCircle())
} as any;

// Mock store adapter
class MockConnectorStoreAdapter implements ConnectorStoreAdapter {
  private elements = new Map<string, any>();
  private selectedIds = new Set<ElementId>();
  private draft: any = null;

  saveSnapshot = vi.fn();
  beginEndpointDrag = vi.fn();
  updateEndpointDrag = vi.fn();
  commitEndpointDrag = vi.fn();

  getSelectedElementIds(): Set<ElementId> {
    return this.selectedIds;
  }

  getElement(id: ElementId): any {
    return this.elements.get(String(id));
  }

  getDraft(): any {
    return this.draft;
  }

  // Test helpers
  setElement(id: ElementId, element: any): void {
    this.elements.set(String(id), element);
  }

  setSelectedIds(ids: ElementId[]): void {
    this.selectedIds = new Set(ids);
  }

  setDraft(draft: any): void {
    this.draft = draft;
  }

  reset(): void {
    this.elements.clear();
    this.selectedIds.clear();
    this.draft = null;
    this.saveSnapshot.mockClear();
    this.beginEndpointDrag.mockClear();
    this.updateEndpointDrag.mockClear();
    this.commitEndpointDrag.mockClear();
  }
}

describe('Connector Overlay System', () => {
  describe('ConnectorOverlayManager', () => {
    let overlayManager: ConnectorOverlayManager;
    let mockLayer: any;
    let mockNodeMap: Map<string, any>;
    let mockStoreAdapter: MockConnectorStoreAdapter;
    let config: ConnectorOverlayConfig;

    beforeEach(() => {
      mockLayer = createMockLayer();
      mockNodeMap = new Map();
      mockStoreAdapter = new MockConnectorStoreAdapter();

      config = {
        overlayLayer: mockLayer,
        nodeMap: mockNodeMap,
        storeAdapter: mockStoreAdapter,
        scheduleDraw: vi.fn(),
        debug: { log: true }
      };

      overlayManager = new ConnectorOverlayManager(config);
    });

    afterEach(() => {
      overlayManager.destroy();
      mockStoreAdapter.reset();
    });

    it('creates overlay manager with proper initialization', () => {
      expect(overlayManager).toBeDefined();
      expect(overlayManager.hasActiveConnectors()).toBe(false);
      expect(global.Konva.Group).toHaveBeenCalledWith({
        name: 'connector-overlay-group',
        listening: false,
        visible: false
      });
      expect(mockLayer.add).toHaveBeenCalled();
    });

    it('clears connector overlay properly', () => {
      overlayManager.clearConnectorOverlay();
      
      expect(mockLayer.batchDraw).toHaveBeenCalled();
      expect(mockLayer.find).toHaveBeenCalledWith('.edge-highlight');
      expect(mockLayer.find).toHaveBeenCalledWith('.edge-handle');
    });

    it('renders connector handles for valid connectors', () => {
      // Set up connector element in store
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [10, 20, 90, 80]
      });

      // Set up connector node
      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      // Render handles
      overlayManager.renderConnectorHandles([connectorId]);

      expect(overlayManager.hasActiveConnectors()).toBe(true);
      expect(global.Konva.Circle).toHaveBeenCalledTimes(2); // Source + target handles
      expect(global.Konva.Line).toHaveBeenCalledTimes(1); // Highlight line
      expect(config.scheduleDraw).toHaveBeenCalledWith('overlay');
    });

    it('handles connectors with startPoint/endPoint format', () => {
      const connectorId = 'connector-2' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'edge',
        startPoint: { x: 15, y: 25 },
        endPoint: { x: 85, y: 75 }
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      expect(overlayManager.hasActiveConnectors()).toBe(true);
      expect(global.Konva.Circle).toHaveBeenCalledTimes(2);
    });

    it('ignores connectors without valid points', () => {
      const connectorId = 'connector-invalid' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector'
        // No points or startPoint/endPoint
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      expect(global.Konva.Circle).not.toHaveBeenCalled();
      expect(global.Konva.Line).not.toHaveBeenCalled();
    });

    it('ignores connectors without corresponding nodes', () => {
      const connectorId = 'connector-missing' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      // Don't add to nodeMap

      overlayManager.renderConnectorHandles([connectorId]);

      expect(global.Konva.Circle).not.toHaveBeenCalled();
      expect(global.Konva.Line).not.toHaveBeenCalled();
    });

    it('handles draft connector points correctly', () => {
      const connectorId = 'connector-draft' as ElementId;
      
      // Set up draft
      mockStoreAdapter.setDraft({
        edgeId: String(connectorId),
        from: { elementId: 'elem-1' },
        toWorld: { x: 50, y: 60 }
      });
      
      mockStoreAdapter.setElement('elem-1' as ElementId, {
        type: 'rectangle',
        x: 10,
        y: 20
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      expect(global.Konva.Circle).toHaveBeenCalledTimes(2);
    });

    it('updates handle styles correctly', () => {
      const newStyles = {
        radius: 10,
        fill: '#ff0000'
      };

      overlayManager.updateStyles(newStyles);

      // Render a connector to test new styles
      const connectorId = 'connector-styled' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      expect(global.Konva.Circle).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 10,
          fill: '#ff0000'
        })
      );
    });

    it('handles multiple connectors correctly', () => {
      const connector1 = 'connector-1' as ElementId;
      const connector2 = 'connector-2' as ElementId;

      // Set up first connector
      mockStoreAdapter.setElement(connector1, {
        type: 'connector',
        points: [0, 0, 50, 50]
      });
      mockNodeMap.set(String(connector1), createMockNode());

      // Set up second connector
      mockStoreAdapter.setElement(connector2, {
        type: 'connector',
        points: [50, 50, 100, 100]
      });
      mockNodeMap.set(String(connector2), createMockNode());

      overlayManager.renderConnectorHandles([connector1, connector2]);

      expect(overlayManager.hasActiveConnectors()).toBe(true);
      expect(global.Konva.Circle).toHaveBeenCalledTimes(4); // 2 connectors × 2 handles each
      expect(global.Konva.Line).toHaveBeenCalledTimes(2); // 2 highlight lines
    });

    it('clears handles when rendering empty connector list', () => {
      // First render some connectors
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });
      mockNodeMap.set(String(connectorId), createMockNode());
      overlayManager.renderConnectorHandles([connectorId]);

      // Then render empty list
      overlayManager.renderConnectorHandles([]);

      expect(overlayManager.hasActiveConnectors()).toBe(false);
    });

    it('properly destroys resources on cleanup', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });
      mockNodeMap.set(String(connectorId), createMockNode());
      overlayManager.renderConnectorHandles([connectorId]);

      expect(overlayManager.hasActiveConnectors()).toBe(true);

      overlayManager.destroy();

      expect(overlayManager.hasActiveConnectors()).toBe(false);
    });

    it('handles store adapter errors gracefully', () => {
      // Create adapter that throws errors
      const errorAdapter: ConnectorStoreAdapter = {
        saveSnapshot: vi.fn(() => { throw new Error('Store error'); }),
        beginEndpointDrag: vi.fn(() => { throw new Error('Store error'); }),
        updateEndpointDrag: vi.fn(() => { throw new Error('Store error'); }),
        commitEndpointDrag: vi.fn(() => { throw new Error('Store error'); }),
        getSelectedElementIds: vi.fn(() => { throw new Error('Store error'); }),
        getElement: vi.fn(() => { throw new Error('Store error'); }),
        getDraft: vi.fn(() => { throw new Error('Store error'); })
      };

      const errorConfig = { ...config, storeAdapter: errorAdapter };
      const errorManager = new ConnectorOverlayManager(errorConfig);

      // Should not throw
      expect(() => {
        errorManager.renderConnectorHandles(['connector-1'] as ElementId[]);
        errorManager.clearConnectorOverlay();
        errorManager.destroy();
      }).not.toThrow();
    });
  });

  describe('Connector Handle Events', () => {
    let overlayManager: ConnectorOverlayManager;
    let mockLayer: any;
    let mockNodeMap: Map<string, any>;
    let mockStoreAdapter: MockConnectorStoreAdapter;
    let config: ConnectorOverlayConfig;

    beforeEach(() => {
      mockLayer = createMockLayer();
      mockNodeMap = new Map();
      mockStoreAdapter = new MockConnectorStoreAdapter();

      config = {
        overlayLayer: mockLayer,
        nodeMap: mockNodeMap,
        storeAdapter: mockStoreAdapter,
        scheduleDraw: vi.fn(),
        debug: { log: true }
      };

      overlayManager = new ConnectorOverlayManager(config);
    });

    afterEach(() => {
      overlayManager.destroy();
    });

    it('creates handles with proper event listeners', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      // Verify that event listeners were set up
      const mockCircleInstance = global.Konva.Circle.mock.results[0].value;
      expect(mockCircleInstance.on).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(mockCircleInstance.on).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(mockCircleInstance.on).toHaveBeenCalledWith('dragstart', expect.any(Function));
      expect(mockCircleInstance.on).toHaveBeenCalledWith('dragmove', expect.any(Function));
      expect(mockCircleInstance.on).toHaveBeenCalledWith('dragend', expect.any(Function));
    });

    it('handles mouse enter events correctly', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      // Get the mouseenter handler
      const mockCircleInstance = global.Konva.Circle.mock.results[0].value;
      const mouseenterHandler = mockCircleInstance.on.mock.calls.find(
        call => call[0] === 'mouseenter'
      )[1];

      // Create mock event
      const mockEvent = {
        target: mockCircleInstance
      };

      // Execute handler
      mouseenterHandler(mockEvent);

      expect(mockCircleInstance.scale).toHaveBeenCalledWith({ x: 1.2, y: 1.2 });
      expect(config.scheduleDraw).toHaveBeenCalledWith('overlay');
    });

    it('handles mouse leave events correctly', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      // Get the mouseleave handler
      const mockCircleInstance = global.Konva.Circle.mock.results[0].value;
      const mouseleaveHandler = mockCircleInstance.on.mock.calls.find(
        call => call[0] === 'mouseleave'
      )[1];

      // Create mock event
      const mockEvent = {
        target: mockCircleInstance
      };

      // Execute handler
      mouseleaveHandler(mockEvent);

      expect(mockCircleInstance.scale).toHaveBeenCalledWith({ x: 1, y: 1 });
      expect(config.scheduleDraw).toHaveBeenCalledWith('overlay');
    });

    it('handles drag start events correctly', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      // Get the dragstart handler for first handle (start endpoint)
      const mockCircleInstance = global.Konva.Circle.mock.results[0].value;
      const dragstartHandler = mockCircleInstance.on.mock.calls.find(
        call => call[0] === 'dragstart'
      )[1];

      // Create mock event
      const mockEvent = {
        cancelBubble: false
      };

      // Execute handler
      dragstartHandler(mockEvent);

      expect(mockEvent.cancelBubble).toBe(true);
      expect(mockStoreAdapter.saveSnapshot).toHaveBeenCalled();
      expect(mockStoreAdapter.beginEndpointDrag).toHaveBeenCalledWith(connectorId, 'start');
    });

    it('handles drag move events correctly', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      // Get the dragmove handler
      const mockCircleInstance = global.Konva.Circle.mock.results[0].value;
      const dragmoveHandler = mockCircleInstance.on.mock.calls.find(
        call => call[0] === 'dragmove'
      )[1];

      // Create mock event
      const mockEvent = {
        cancelBubble: false,
        target: mockCircleInstance
      };

      // Execute handler
      dragmoveHandler(mockEvent);

      expect(mockEvent.cancelBubble).toBe(true);
      expect(mockStoreAdapter.updateEndpointDrag).toHaveBeenCalled();
      expect(mockCircleInstance.position).toHaveBeenCalled();
      expect(config.scheduleDraw).toHaveBeenCalledWith('main');
      expect(config.scheduleDraw).toHaveBeenCalledWith('overlay');
    });

    it('handles drag end events correctly', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });
      mockStoreAdapter.setSelectedIds([connectorId]);

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      // Get the dragend handler
      const mockCircleInstance = global.Konva.Circle.mock.results[0].value;
      const dragendHandler = mockCircleInstance.on.mock.calls.find(
        call => call[0] === 'dragend'
      )[1];

      // Create mock event
      const mockEvent = {
        cancelBubble: false
      };

      // Execute handler
      dragendHandler(mockEvent);

      expect(mockEvent.cancelBubble).toBe(true);
      expect(mockStoreAdapter.commitEndpointDrag).toHaveBeenCalled();
    });

    it('handles event errors gracefully', () => {
      const connectorId = 'connector-1' as ElementId;
      mockStoreAdapter.setElement(connectorId, {
        type: 'connector',
        points: [0, 0, 100, 100]
      });

      // Make store adapter throw errors
      mockStoreAdapter.saveSnapshot.mockImplementation(() => { throw new Error('Store error'); });

      const mockConnectorNode = createMockNode();
      mockNodeMap.set(String(connectorId), mockConnectorNode);

      overlayManager.renderConnectorHandles([connectorId]);

      // Get the dragstart handler
      const mockCircleInstance = global.Konva.Circle.mock.results[0].value;
      const dragstartHandler = mockCircleInstance.on.mock.calls.find(
        call => call[0] === 'dragstart'
      )[1];

      // Should not throw despite store error
      expect(() => {
        dragstartHandler({ cancelBubble: false });
      }).not.toThrow();
    });
  });
});