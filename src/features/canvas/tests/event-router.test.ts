/**
 * Tests for EventRouter
 * Comprehensive test coverage for stage event handling and delegation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Konva from 'konva';
import { EventRouter, type EventRouterConfig, type EventRouterStoreAdapter, type EventContext } from '../renderer/events/EventRouter';
import type { ElementId } from '../types/enhanced.types';

describe('EventRouter', () => {
  let stage: Konva.Stage;
  let nodeMap: Map<string, Konva.Node>;
  let storeAdapter: EventRouterStoreAdapter;
  let config: EventRouterConfig;
  let container: HTMLDivElement;
  let mockCallbacks: {
    onTextEditorOpen: ReturnType<typeof vi.fn>;
    onTableCellEdit: ReturnType<typeof vi.fn>;
    onSelectionChange: ReturnType<typeof vi.fn>;
    onDragStart: ReturnType<typeof vi.fn>;
    onDragEnd: ReturnType<typeof vi.fn>;
    onGroupDragMove: ReturnType<typeof vi.fn>;
    onConnectorHover: ReturnType<typeof vi.fn>;
    scheduleDraw: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create Konva stage
    stage = new Konva.Stage({
      container,
      width: 800,
      height: 600
    });

    // Setup node map with test elements
    nodeMap = new Map();
    
    const layer = new Konva.Layer();
    stage.add(layer);

    // Create test elements
    const rectGroup = new Konva.Group({ id: 'rect1', name: 'rectangle', draggable: true });
    const rect = new Konva.Rect({ x: 0, y: 0, width: 100, height: 50, fill: 'red' });
    rectGroup.add(rect);
    rectGroup.position({ x: 100, y: 100 });
    layer.add(rectGroup);

    const circleGroup = new Konva.Group({ id: 'circle1', name: 'circle', draggable: true });
    const circle = new Konva.Circle({ x: 0, y: 0, radius: 30, fill: 'blue' });
    circleGroup.add(circle);
    circleGroup.position({ x: 300, y: 200 });
    layer.add(circleGroup);

    const textGroup = new Konva.Group({ id: 'text1', name: 'text', draggable: true });
    const text = new Konva.Text({ x: 0, y: 0, text: 'Test Text', fontSize: 16 });
    textGroup.add(text);
    textGroup.position({ x: 500, y: 300 });
    layer.add(textGroup);

    const tableGroup = new Konva.Group({ id: 'table1', name: 'table', draggable: true });
    const tableRect = new Konva.Rect({ x: 0, y: 0, width: 200, height: 120, fill: 'yellow' });
    tableGroup.add(tableRect);
    tableGroup.position({ x: 200, y: 400 });
    layer.add(tableGroup);

    const connectorLine = new Konva.Line({ 
      id: 'line1', 
      name: 'connector', 
      points: [0, 0, 100, 50], 
      stroke: 'green'
    });
    layer.add(connectorLine);

    nodeMap.set('rect1', rectGroup);
    nodeMap.set('circle1', circleGroup);
    nodeMap.set('text1', textGroup);
    nodeMap.set('table1', tableGroup);
    nodeMap.set('line1', connectorLine);

    // Setup mock store adapter
    const selectedIds = new Set<ElementId>();
    storeAdapter = {
      getSelectedElementIds: vi.fn().mockReturnValue(selectedIds),
      setSelectedElementIds: vi.fn().mockImplementation((ids: Set<ElementId>) => {
        selectedIds.clear();
        ids.forEach(id => selectedIds.add(id));
      }),
      addToSelection: vi.fn().mockImplementation((id: ElementId) => selectedIds.add(id)),
      removeFromSelection: vi.fn().mockImplementation((id: ElementId) => selectedIds.delete(id)),
      clearSelection: vi.fn().mockImplementation(() => selectedIds.clear()),
      getElement: vi.fn().mockImplementation((id: ElementId) => {
        const mockElements = {
          'rect1': { id: 'rect1', type: 'rectangle', x: 100, y: 100 },
          'circle1': { id: 'circle1', type: 'circle', x: 300, y: 200 },
          'text1': { id: 'text1', type: 'text', x: 500, y: 300 },
          'table1': { id: 'table1', type: 'table', x: 200, y: 400, rows: 3, cols: 2, cellWidth: 100, cellHeight: 40 },
          'line1': { id: 'line1', type: 'connector', points: [0, 0, 100, 50] }
        };
        return mockElements[id as keyof typeof mockElements];
      }),
      getGroupMembers: vi.fn().mockReturnValue([]),
      saveSnapshot: vi.fn()
    };

    // Setup mock callbacks
    mockCallbacks = {
      onTextEditorOpen: vi.fn(),
      onTableCellEdit: vi.fn(),
      onSelectionChange: vi.fn(),
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onGroupDragMove: vi.fn(),
      onConnectorHover: vi.fn(),
      scheduleDraw: vi.fn()
    };

    // Create config
    config = {
      stage,
      nodeMap,
      storeAdapter,
      ...mockCallbacks,
      debug: { log: false }
    };
  });

  afterEach(() => {
    // Cleanup DOM
    stage.destroy();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize event router with default config', () => {
      const router = new EventRouter(config);
      
      expect(router).toBeDefined();
      expect(router.isShiftPressed()).toBe(false);
      
      router.destroy();
    });

    it('should setup keyboard event handlers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      const router = new EventRouter(config);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      
      router.destroy();
      addEventListenerSpy.mockRestore();
    });

    it('should initialize with debug logging enabled', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugConfig = { ...config, debug: { log: true } };
      
      const router = new EventRouter(debugConfig);
      
      expect(consoleSpy).toHaveBeenCalledWith('[EventRouter] Event router initialized');
      
      router.destroy();
      consoleSpy.mockRestore();
    });
  });

  describe('Keyboard Event Handling', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should handle shift key press', () => {
      expect(router.isShiftPressed()).toBe(false);
      
      // Simulate shift key press
      const event = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(event);
      
      expect(router.isShiftPressed()).toBe(true);
    });

    it('should handle shift key release', () => {
      // First press shift
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(keydownEvent);
      expect(router.isShiftPressed()).toBe(true);
      
      // Then release shift
      const keyupEvent = new KeyboardEvent('keyup', { key: 'Shift' });
      window.dispatchEvent(keyupEvent);
      
      expect(router.isShiftPressed()).toBe(false);
    });

    it('should ignore non-shift keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'A' });
      window.dispatchEvent(event);
      
      expect(router.isShiftPressed()).toBe(false);
    });
  });

  describe('Mouse Down Events', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should select element on single click', () => {
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      
      // Simulate mouse down on rectangle without namespace
      stage.fire('mousedown', {
        target: rectGroup,
        evt: { shiftKey: false, ctrlKey: false, metaKey: false }
      });
      
      expect(storeAdapter.setSelectedElementIds).toHaveBeenCalledWith(new Set(['rect1']));
      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(new Set(['rect1']));
    });

    it('should add to selection with shift+click', () => {
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      const circleGroup = nodeMap.get('circle1') as Konva.Group;
      
      // First select rectangle
      stage.fire('mousedown', {
        target: rectGroup,
        evt: { shiftKey: false, ctrlKey: false, metaKey: false }
      });
      
      // Then shift+click circle to add to selection
      stage.fire('mousedown', {
        target: circleGroup,
        evt: { shiftKey: true, ctrlKey: false, metaKey: false }
      });
      
      expect(storeAdapter.addToSelection).toHaveBeenCalledWith('circle1');
    });

    it('should remove from selection with shift+click on selected element', () => {
      // Setup initial selection
      const selectedIds = new Set(['rect1', 'circle1'] as ElementId[]);
      storeAdapter.getSelectedElementIds = vi.fn().mockReturnValue(selectedIds);
      
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      
      // Shift+click on already selected element
      stage.fire('mousedown', {
        target: rectGroup,
        evt: { shiftKey: true, ctrlKey: false, metaKey: false }
      });
      
      expect(storeAdapter.removeFromSelection).toHaveBeenCalledWith('rect1');
    });

    it('should clear selection on background click', () => {
      // Click on stage/layer (background)
      stage.fire('mousedown', {
        target: stage,
        evt: { shiftKey: false, ctrlKey: false, metaKey: false }
      });
      
      expect(storeAdapter.clearSelection).toHaveBeenCalled();
      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(new Set());
    });

    it('should ignore transformer clicks', () => {
      const mockTransformer = {
        getClassName: vi.fn().mockReturnValue('Transformer'),
        name: vi.fn().mockReturnValue('transformer')
      };
      
      stage.fire('mousedown', {
        target: mockTransformer,
        evt: { shiftKey: false, ctrlKey: false, metaKey: false }
      });
      
      expect(storeAdapter.setSelectedElementIds).not.toHaveBeenCalled();
      expect(mockCallbacks.onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('Drag Events', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should handle drag start', () => {
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      
      stage.fire('dragstart', {
        target: rectGroup,
        evt: {}
      });
      
      expect(mockCallbacks.onDragStart).toHaveBeenCalledWith('rect1');
    });

    it('should handle drag end with position commit', () => {
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      rectGroup.position({ x: 150, y: 120 }); // Simulate dragged position
      
      stage.fire('dragend', {
        target: rectGroup,
        evt: {}
      });
      
      expect(mockCallbacks.onDragEnd).toHaveBeenCalledWith('rect1', { x: 150, y: 120 });
    });

    it('should handle group drag coordination', () => {
      // Setup group element
      const groupElement = { id: 'rect1', type: 'rectangle', groupId: 'group1' };
      storeAdapter.getElement = vi.fn().mockReturnValue(groupElement);
      storeAdapter.getGroupMembers = vi.fn().mockReturnValue(['rect1', 'circle1']);
      
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      
      // Start drag to initialize group data
      stage.fire('dragstart', {
        target: rectGroup,
        evt: {}
      });
      
      // Move drag to trigger group coordination
      rectGroup.position({ x: 150, y: 120 });
      stage.fire('dragmove', {
        target: rectGroup,
        evt: {}
      });
      
      expect(mockCallbacks.onGroupDragMove).toHaveBeenCalledWith('group1', { dx: 50, dy: 20 });
    });
  });

  describe('Double-Click Events', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should open text editor on double-click text elements', () => {
      const textGroup = nodeMap.get('text1') as Konva.Group;
      
      stage.fire('dblclick', {
        target: textGroup,
        evt: { detail: 2 } // Double-click
      });
      
      expect(mockCallbacks.onTextEditorOpen).toHaveBeenCalledWith('text1', textGroup);
    });

    it('should open text editor on double-click rectangle', () => {
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      
      stage.fire('dblclick', {
        target: rectGroup,
        evt: { detail: 2 }
      });
      
      expect(mockCallbacks.onTextEditorOpen).toHaveBeenCalledWith('rect1', rectGroup);
    });

    it('should handle table cell editing on double-click', () => {
      const tableGroup = nodeMap.get('table1') as Konva.Group;
      
      // Mock stage pointer position to simulate click at specific cell
      vi.spyOn(stage, 'getPointerPosition').mockReturnValue({ x: 250, y: 420 });
      
      stage.fire('dblclick', {
        target: tableGroup,
        evt: { detail: 2 }
      });
      
      expect(mockCallbacks.onTableCellEdit).toHaveBeenCalledWith('table1', 0, 0);
    });

    it('should ignore single clicks', () => {
      const textGroup = nodeMap.get('text1') as Konva.Group;
      
      stage.fire('dblclick', {
        target: textGroup,
        evt: { detail: 1 } // Single click
      });
      
      expect(mockCallbacks.onTextEditorOpen).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Move Events', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should handle connector hover', () => {
      const connectorLine = nodeMap.get('line1') as Konva.Line;
      
      stage.fire('mousemove', {
        target: connectorLine,
        evt: {}
      });
      
      expect(mockCallbacks.onConnectorHover).toHaveBeenCalledWith('line1');
    });

    it('should clear connector hover when moving away', () => {
      const connectorLine = nodeMap.get('line1') as Konva.Line;
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      
      // First hover over connector
      stage.fire('mousemove', {
        target: connectorLine,
        evt: {}
      });
      
      // Then move to non-connector
      stage.fire('mousemove', {
        target: rectGroup,
        evt: {}
      });
      
      expect(mockCallbacks.onConnectorHover).toHaveBeenCalledWith(null);
    });
  });

  describe('Wheel Events', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should handle wheel events for overlay coordination', () => {
      stage.fire('wheel', {
        evt: { deltaY: 100 }
      });
      
      expect(mockCallbacks.scheduleDraw).toHaveBeenCalledWith('overlay');
    });
  });

  describe('Error Handling', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should handle mouse down errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const debugConfig = { ...config, debug: { log: true } };
      const debugRouter = new EventRouter(debugConfig);
      
      // Mock store adapter to throw error
      storeAdapter.getSelectedElementIds = vi.fn().mockImplementation(() => {
        throw new Error('Store error');
      });
      
      // Should not throw
      expect(() => {
        stage.fire('mousedown', {
          target: nodeMap.get('rect1'),
          evt: { shiftKey: false, ctrlKey: false, metaKey: false }
        });
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('[EventRouter] Mouse down error:', expect.any(Error));
      
      debugRouter.destroy();
      consoleSpy.mockRestore();
    });

    it('should handle invalid event targets', () => {
      expect(() => {
        stage.fire('mousedown', {
          target: null,
          evt: { shiftKey: false, ctrlKey: false, metaKey: false }
        });
      }).not.toThrow();
      
      expect(storeAdapter.clearSelection).toHaveBeenCalled();
    });

    it('should handle missing stage pointer position', () => {
      vi.spyOn(stage, 'getPointerPosition').mockReturnValue(null);
      
      expect(() => {
        stage.fire('dblclick', {
          target: nodeMap.get('table1'),
          evt: { detail: 2 }
        });
      }).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should update configuration', () => {
      const newCallback = vi.fn();
      
      router.updateConfig({
        onTextEditorOpen: newCallback,
        debug: { log: true }
      });
      
      // Configuration update doesn't throw
      expect(() => router.updateConfig({})).not.toThrow();
    });
  });

  describe('Element Node Resolution', () => {
    let router: EventRouter;

    beforeEach(() => {
      router = new EventRouter(config);
    });

    afterEach(() => {
      router.destroy();
    });

    it('should resolve element node from direct target', () => {
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      
      stage.fire('mousedown', {
        target: rectGroup,
        evt: { shiftKey: false, ctrlKey: false, metaKey: false }
      });
      
      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(new Set(['rect1']));
    });

    it('should resolve element node from child element', () => {
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      const rectChild = rectGroup.children[0]; // The actual rectangle shape
      
      stage.fire('mousedown', {
        target: rectChild,
        evt: { shiftKey: false, ctrlKey: false, metaKey: false }
      });
      
      expect(mockCallbacks.onSelectionChange).toHaveBeenCalledWith(new Set(['rect1']));
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should remove all event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const stageOffSpy = vi.spyOn(stage, 'off');
      
      const router = new EventRouter(config);
      router.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(stageOffSpy).toHaveBeenCalledWith('mousedown.eventrouter');
      expect(stageOffSpy).toHaveBeenCalledWith('dragstart.eventrouter');
      expect(stageOffSpy).toHaveBeenCalledWith('dragmove.eventrouter');
      expect(stageOffSpy).toHaveBeenCalledWith('dragend.eventrouter');
      expect(stageOffSpy).toHaveBeenCalledWith('dblclick.eventrouter');
      expect(stageOffSpy).toHaveBeenCalledWith('mousemove.eventrouter');
      expect(stageOffSpy).toHaveBeenCalledWith('wheel.eventrouter');
      
      removeEventListenerSpy.mockRestore();
    });

    it('should handle destroy errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const debugConfig = { ...config, debug: { log: true } };
      const router = new EventRouter(debugConfig);
      
      // Mock stage.off to throw error
      vi.spyOn(stage, 'off').mockImplementation(() => {
        throw new Error('Cleanup error');
      });
      
      expect(() => router.destroy()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('[EventRouter] Destroy error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should be safe to call destroy multiple times', () => {
      const router = new EventRouter(config);
      
      expect(() => {
        router.destroy();
        router.destroy();
      }).not.toThrow();
    });
  });

  describe('Debug Logging', () => {
    it('should log events when debug enabled', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugConfig = { ...config, debug: { log: true } };
      
      const router = new EventRouter(debugConfig);
      
      // Trigger some events
      const rectGroup = nodeMap.get('rect1') as Konva.Group;
      stage.fire('mousedown', {
        target: rectGroup,
        evt: { shiftKey: false, ctrlKey: false, metaKey: false }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('[EventRouter] Event router initialized');
      expect(consoleSpy).toHaveBeenCalledWith('[EventRouter] Mouse down:', expect.any(Object));
      
      router.destroy();
      consoleSpy.mockRestore();
    });
  });
});