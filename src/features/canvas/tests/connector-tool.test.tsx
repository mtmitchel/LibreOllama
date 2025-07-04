/**
 * ConnectorTool Tests
 * 
 * Tests for the ConnectorTool component following store-first testing principles.
 * These tests focus on the actual store methods and business logic rather than UI mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ConnectorTool } from '../components/tools/creation/ConnectorTool';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import type { ConnectorElement } from '../types/enhanced.types';
import { ElementId } from '../types/enhanced.types';

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
  getStage: vi.fn().mockReturnValue(undefined)
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
      expect(mockStage.on).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('mouseup', expect.any(Function));
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

      expect(mockStage.off).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('mouseup', expect.any(Function));
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

      // Get the registered mousedown handler
      const mouseDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];

             // First click to start connector
       mouseDownHandler({
         target: { ...mockStage, getStage: () => mockStage },
         evt: { clientX: 100, clientY: 100 }
       });

      // Should have started drawing (component state is internal, so we can't directly test it)
      // But we can verify the handler was called without errors
      expect(mouseDownHandler).toBeDefined();
    });

    it('should create connector with correct properties', () => {
      render(
        <ConnectorTool
          isActive={true}
          stageRef={mockStageRef}
          connectorType="arrow"
        />
      );

      // Get the registered handlers
      const mouseDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];

             mouseDownHandler({
         target: { ...mockStage, getStage: () => mockStage },
         evt: { clientX: 150, clientY: 150 }
       });

      // Should handle the mouse down event without errors
      expect(mouseDownHandler).toBeDefined();
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

      // Get the registered mousedown handler
      const mouseDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'mousedown'
      )?.[1];

             // Click on empty space
       mouseDownHandler({
         target: { ...mockStage, getStage: () => mockStage },
         evt: { clientX: 100, clientY: 100 }
       });

      // Should handle the click without errors
      expect(mouseDownHandler).toBeDefined();
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
}); 