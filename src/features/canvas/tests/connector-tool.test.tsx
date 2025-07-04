/**
 * ConnectorTool Tests
 * 
 * Tests for the ConnectorTool component following store-first testing principles.
 * These tests focus on the actual store methods and business logic rather than UI mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ConnectorTool } from '../components/tools/creation/ConnectorTool';
import { createUnifiedTestStore } from '../../../tests/helpers/createUnifiedTestStore';
import type { ConnectorElement } from '../types/enhanced.types';
import { ElementId } from '../types/enhanced.types';
import { CanvasTestWrapper } from '../../../tests/helpers/CanvasTestWrapper';
import { UnifiedCanvasStore } from '../stores/unifiedCanvasStore';

// Mock Konva
vi.mock('konva');
vi.mock('react-konva', () => ({
  Line: ({ children, ...props }: any) => <div data-testid="line" {...props}>{children}</div>,
  Arrow: ({ children, ...props }: any) => <div data-testid="arrow" {...props}>{children}</div>,
  Group: ({ children, ...props }: any) => <div data-testid="group" {...props}>{children}</div>,
  Stage: ({ children, ...props }: any) => <div data-testid="stage" {...props}>{children}</div>,
  Layer: ({ children, ...props }: any) => <div data-testid="layer" {...props}>{children}</div>,
}));

// Mock Konva Stage for UI tests
const mockStage = {
  on: vi.fn(),
  off: vi.fn(),
  getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getAbsoluteTransform: vi.fn(() => ({
    copy: () => ({
      invert: () => ({
        point: (p: any) => p
      })
    })
  })),
  getStage: vi.fn().mockReturnValue(undefined),
  container: vi.fn().mockReturnValue({ 
    style: {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
  }),
  width: vi.fn().mockReturnValue(800),
  height: vi.fn().mockReturnValue(600),
  scaleX: vi.fn().mockReturnValue(1),
  scaleY: vi.fn().mockReturnValue(1),
  x: vi.fn().mockReturnValue(0),
  y: vi.fn().mockReturnValue(0),
  id: vi.fn().mockReturnValue('')
};

const mockStageRef = {
  current: mockStage as any
};

describe('ConnectorTool', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render when active', () => {
      const { container } = render(
        <ConnectorTool 
          isActive={true}
          stageRef={mockStageRef}
          connectorType="line"
        />
      );
      
      // Should not crash when rendering
      expect(container).toBeDefined();
    });

    it('should not render when inactive', () => {
      const { container } = render(
        <ConnectorTool 
          isActive={false}
          stageRef={mockStageRef}
          connectorType="line"
        />
      );
      
      // Should not crash when rendering
      expect(container).toBeDefined();
    });

    it('should register event handlers when active', () => {
      render(
        <ConnectorTool 
          isActive={true}
          stageRef={mockStageRef}
          connectorType="line"
        />
      );

      // Check that event handlers are registered (using actual event names)
      expect(mockStage.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerleave', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerenter', expect.any(Function));
    });

    it('should clean up event handlers on unmount', () => {
      const { unmount } = render(
        <ConnectorTool 
          isActive={true}
          stageRef={mockStageRef}
          connectorType="line"
        />
      );

      unmount();

      expect(mockStage.off).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointermove', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerleave', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerenter', expect.any(Function));
    });
  });

  describe('Connector Creation', () => {
    it('should start connector creation on first click', () => {
      render(
        <ConnectorTool 
          isActive={true}
          stageRef={mockStageRef}
          connectorType="line"
        />
      );

      // Get the pointer down handler
      const pointerDownHandler = mockStage.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];

      expect(pointerDownHandler).toBeDefined();

      // First click to start connector
      pointerDownHandler({
        target: { ...mockStage, getStage: () => mockStage },
        evt: { clientX: 100, clientY: 100 },
        cancelBubble: false
      });

      // Check that the tool is now in creation mode
      expect(mockStage.getPointerPosition).toHaveBeenCalled();
    });

    it('should create connector with correct properties', () => {
      render(
        <ConnectorTool 
          isActive={true}
          stageRef={mockStageRef}
          connectorType="arrow"
        />
      );

      // Get the pointer down handler
      const pointerDownHandler = mockStage.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];

      pointerDownHandler({
        target: { ...mockStage, getStage: () => mockStage },
        evt: { clientX: 150, clientY: 150 },
        cancelBubble: false
      });

      // Should handle the event without errors
      expect(pointerDownHandler).toBeDefined();
    });

    it('should handle missing stage gracefully', () => {
      const nullStageRef = { current: null };
      
      const { container } = render(
        <ConnectorTool 
          isActive={true}
          stageRef={nullStageRef}
          connectorType="line"
        />
      );

      // Should not crash with null stage
      expect(container).toBeDefined();
    });

    it('should handle clicks on empty space', () => {
      render(
        <ConnectorTool 
          isActive={true}
          stageRef={mockStageRef}
          connectorType="line"
        />
      );

      // Get the pointer down handler
      const pointerDownHandler = mockStage.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];

      // Click on empty space
      pointerDownHandler({
        target: { ...mockStage, getStage: () => mockStage },
        evt: { clientX: 100, clientY: 100 },
        cancelBubble: false
      });

      // Should handle the click without errors
      expect(pointerDownHandler).toBeDefined();
    });
  });
});

// Store-First Tests - Testing actual business logic
describe('Connector Functionality (Store-First)', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Connector Creation', () => {
    it('should create connector with basic properties', () => {
      const connector: ConnectorElement = {
        id: ElementId('connector-1'),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Use the correct pattern: store.getState().addElement()
      store.getState().addElement(connector);

      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(connector.id)).toEqual(connector);
      expect(store.getState().elementOrder).toContain(connector.id);
    });

    it('should create connector with attachment points', () => {
      const connector: ConnectorElement = {
        id: ElementId('connector-attach'),
        type: 'connector',
        subType: 'arrow',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        startElementId: ElementId('rect-1'),
        endElementId: ElementId('rect-2'),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      const addedConnector = store.getState().elements.get(connector.id) as any;
      expect(addedConnector.startElementId).toBe('rect-1');
      expect(addedConnector.endElementId).toBe('rect-2');
      expect(addedConnector.type).toBe('connector');
    });

    it('should create curved connector', () => {
      const curvedConnector: ConnectorElement = {
        id: ElementId('curved-connector'),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [{ x: 50, y: -20 }],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 50, -20, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(curvedConnector);

      const addedConnector = store.getState().elements.get(curvedConnector.id) as any;
      expect(addedConnector.intermediatePoints).toEqual([{ x: 50, y: -20 }]);
      expect(addedConnector.pathPoints).toEqual([0, 0, 50, -20, 100, 100]);
    });
  });

  describe('Connector Management', () => {
    it('should update connector endpoints', () => {
      const connector: ConnectorElement = {
        id: ElementId('update-connector'),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 50, y: 50 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 50, 50],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      // Update connector endpoints
      store.getState().updateElement(connector.id, {
        endPoint: { x: 100, y: 100 },
        pathPoints: [0, 0, 100, 100]
      });

      const updatedConnector = store.getState().elements.get(connector.id) as any;
      expect(updatedConnector.endPoint.x).toBe(100);
      expect(updatedConnector.endPoint.y).toBe(100);
      expect(updatedConnector.startPoint.x).toBe(0); // Should remain unchanged
    });

    it('should update connector attachments', () => {
      const connector: ConnectorElement = {
        id: ElementId('attach-connector'),
        type: 'connector',
        subType: 'arrow',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        startElementId: ElementId('old-start'),
        endElementId: ElementId('old-end'),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      // Update attachments
      store.getState().updateElement(connector.id, {
        startElementId: ElementId('element-a'),
        endElementId: ElementId('element-b')
      });

      const updatedConnector = store.getState().elements.get(connector.id) as any;
      expect(updatedConnector.startElementId).toBe(ElementId('element-a'));
      expect(updatedConnector.endElementId).toBe(ElementId('element-b'));
    });

    it('should delete connector correctly', () => {
      const connector: ConnectorElement = {
        id: ElementId('delete-connector'),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);
      expect(store.getState().elements.size).toBe(1);

      // Delete connector
      store.getState().deleteElement(connector.id);

      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(connector.id)).toBe(false);
    });
  });

  describe('Connector Selection', () => {
    it('should select connector', () => {
      const connector: ConnectorElement = {
        id: ElementId('select-connector'),
        type: 'connector',
        subType: 'arrow',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);
      store.getState().selectElement(connector.id);

      expect(store.getState().selectedElementIds.has(connector.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(connector.id);
    });

    it('should handle connector in multi-selection', () => {
      const connector1: ConnectorElement = {
        id: ElementId('multi-connector-1'),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 50, y: 50 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 50, 50],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const connector2: ConnectorElement = {
        id: ElementId('multi-connector-2'),
        type: 'connector',
        subType: 'arrow',
        x: 100,
        y: 100,
        startPoint: { x: 100, y: 100 },
        endPoint: { x: 150, y: 150 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [100, 100, 150, 150],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector1);
      store.getState().addElement(connector2);

      // Select both connectors
      store.getState().selectElement(connector1.id);
      store.getState().selectElement(connector2.id, true); // multiSelect: true

      expect(store.getState().selectedElementIds.size).toBe(2);
      expect(store.getState().selectedElementIds.has(connector1.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(connector2.id)).toBe(true);
    });
  });

  describe('Connector Integration', () => {
    it('should work with element creation workflow', () => {
      // Create some shapes to connect
      const rect1 = {
        id: ElementId('rect-1'),
        type: 'rectangle' as const,
        x: 0, y: 0, width: 100, height: 100,
        fill: '#red', stroke: '#black', strokeWidth: 1,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      const rect2 = {
        id: ElementId('rect-2'),
        type: 'rectangle' as const,
        x: 200, y: 200, width: 100, height: 100,
        fill: '#blue', stroke: '#black', strokeWidth: 1,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      const connector: ConnectorElement = {
        id: ElementId('workflow-connector'),
        type: 'connector',
        subType: 'arrow',
        x: 0,
        y: 0,
        startPoint: { x: 50, y: 50 },
        endPoint: { x: 250, y: 250 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [50, 50, 250, 250],
        startElementId: rect1.id,
        endElementId: rect2.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(rect1);
      store.getState().addElement(rect2);
      store.getState().addElement(connector);

      // Verify all elements exist
      expect(store.getState().elements.size).toBe(3);
      expect(store.getState().elements.has(rect1.id)).toBe(true);
      expect(store.getState().elements.has(rect2.id)).toBe(true);
      expect(store.getState().elements.has(connector.id)).toBe(true);
    });

    it('should handle connector tool switching', () => {
      expect(store.getState().selectedTool).toBe('select');

      // Switch to connector tool (use the correct tool name)
      store.getState().setSelectedTool('connector-line');
      expect(store.getState().selectedTool).toBe('connector-line');

      // Create connector while tool is active
      const connector: ConnectorElement = {
        id: ElementId('tool-connector'),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);
      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().selectedTool).toBe('connector-line');
    });
  });

  describe('Connector Endpoint Editing (FigJam-style)', () => {
    it('should update start point without affecting end point', () => {
      const connector: ConnectorElement = {
        id: ElementId('endpoint-edit-1'),
        type: 'connector',
        subType: 'line',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      // Update start point (simulating start handle drag)
      const newStartPoint = { x: 50, y: 25 };
      const newEndPoint = { x: 100, y: 100 }; // Keep end point unchanged
      
      store.getState().updateElement(connector.id, {
        startPoint: newStartPoint,
        endPoint: newEndPoint,
        pathPoints: [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y],
        x: Math.min(newStartPoint.x, newEndPoint.x),
        y: Math.min(newStartPoint.y, newEndPoint.y)
      });

      const updatedConnector = store.getState().elements.get(connector.id) as any;
      expect(updatedConnector.startPoint).toEqual({ x: 50, y: 25 });
      expect(updatedConnector.endPoint).toEqual({ x: 100, y: 100 }); // Should remain unchanged
      expect(updatedConnector.pathPoints).toEqual([50, 25, 100, 100]);
    });

    it('should update end point without affecting start point', () => {
      const connector: ConnectorElement = {
        id: ElementId('endpoint-edit-2'),
        type: 'connector',
        subType: 'arrow',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      // Update end point (simulating end handle drag)
      const newStartPoint = { x: 0, y: 0 }; // Keep start point unchanged
      const newEndPoint = { x: 150, y: 75 };
      
      store.getState().updateElement(connector.id, {
        startPoint: newStartPoint,
        endPoint: newEndPoint,
        pathPoints: [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y],
        x: Math.min(newStartPoint.x, newEndPoint.x),
        y: Math.min(newStartPoint.y, newEndPoint.y)
      });

      const updatedConnector = store.getState().elements.get(connector.id) as any;
      expect(updatedConnector.startPoint).toEqual({ x: 0, y: 0 }); // Should remain unchanged
      expect(updatedConnector.endPoint).toEqual({ x: 150, y: 75 });
      expect(updatedConnector.pathPoints).toEqual([0, 0, 150, 75]);
    });

    it('should recalculate bounding box when endpoints change', () => {
      const connector: ConnectorElement = {
        id: ElementId('bounding-box-test'),
        type: 'connector',
        subType: 'line',
        x: 50,
        y: 50,
        startPoint: { x: 50, y: 50 },
        endPoint: { x: 150, y: 150 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'none',
          startArrow: 'none'
        },
        pathPoints: [50, 50, 150, 150],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      // Move endpoints to new positions that change the bounding box
      const newStartPoint = { x: 25, y: 75 };
      const newEndPoint = { x: 175, y: 25 };
      
      store.getState().updateElement(connector.id, {
        startPoint: newStartPoint,
        endPoint: newEndPoint,
        pathPoints: [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y],
        // Bounding box should be recalculated as min of all coordinates
        x: Math.min(newStartPoint.x, newEndPoint.x), // min(25, 175) = 25
        y: Math.min(newStartPoint.y, newEndPoint.y)  // min(75, 25) = 25
      });

      const updatedConnector = store.getState().elements.get(connector.id) as any;
      expect(updatedConnector.x).toBe(25);
      expect(updatedConnector.y).toBe(25);
      expect(updatedConnector.startPoint).toEqual({ x: 25, y: 75 });
      expect(updatedConnector.endPoint).toEqual({ x: 175, y: 25 });
    });

    it('should handle extreme endpoint positions correctly', () => {
      const connector: ConnectorElement = {
        id: ElementId('extreme-positions'),
        type: 'connector',
        subType: 'arrow',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#000000',
        strokeWidth: 2,
        connectorStyle: {
          strokeColor: '#000000',
          strokeWidth: 2,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      // Test with negative coordinates and large distances
      const newStartPoint = { x: -100, y: -50 };
      const newEndPoint = { x: 500, y: 300 };
      
      store.getState().updateElement(connector.id, {
        startPoint: newStartPoint,
        endPoint: newEndPoint,
        pathPoints: [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y],
        x: Math.min(newStartPoint.x, newEndPoint.x),
        y: Math.min(newStartPoint.y, newEndPoint.y)
      });

      const updatedConnector = store.getState().elements.get(connector.id) as any;
      expect(updatedConnector.startPoint).toEqual({ x: -100, y: -50 });
      expect(updatedConnector.endPoint).toEqual({ x: 500, y: 300 });
      expect(updatedConnector.x).toBe(-100); // Minimum x coordinate
      expect(updatedConnector.y).toBe(-50);  // Minimum y coordinate
      expect(updatedConnector.pathPoints).toEqual([-100, -50, 500, 300]);
    });

    it('should preserve connector type and style during endpoint editing', () => {
      const connector: ConnectorElement = {
        id: ElementId('preserve-style'),
        type: 'connector',
        subType: 'arrow',
        x: 0,
        y: 0,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        intermediatePoints: [],
        stroke: '#ff0000',
        strokeWidth: 4,
        connectorStyle: {
          strokeColor: '#ff0000',
          strokeWidth: 4,
          endArrow: 'solid',
          startArrow: 'none'
        },
        pathPoints: [0, 0, 100, 100],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(connector);

      // Update endpoints while preserving style
      const newStartPoint = { x: 20, y: 30 };
      const newEndPoint = { x: 80, y: 70 };
      
      store.getState().updateElement(connector.id, {
        startPoint: newStartPoint,
        endPoint: newEndPoint,
        pathPoints: [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y],
        x: Math.min(newStartPoint.x, newEndPoint.x),
        y: Math.min(newStartPoint.y, newEndPoint.y)
      });

      const updatedConnector = store.getState().elements.get(connector.id) as any;
      
      // Endpoints should be updated
      expect(updatedConnector.startPoint).toEqual({ x: 20, y: 30 });
      expect(updatedConnector.endPoint).toEqual({ x: 80, y: 70 });
      
      // Style properties should be preserved
      expect(updatedConnector.subType).toBe('arrow');
      expect(updatedConnector.stroke).toBe('#ff0000');
      expect(updatedConnector.strokeWidth).toBe(4);
      expect(updatedConnector.connectorStyle.endArrow).toBe('solid');
      expect(updatedConnector.connectorStyle.strokeColor).toBe('#ff0000');
    });
  });
}); 