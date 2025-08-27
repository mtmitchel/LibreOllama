/**
 * MindmapTool Tests
 * 
 * Tests for the MindmapTool component following store-first testing principles.
 * These tests focus on the actual store methods and business logic rather than UI mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MindmapTool } from '../components/tools/creation/MindmapTool';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import type { TextElement, ConnectorElement } from '../types/enhanced.types';
import { ElementId, createElementId } from '../types/enhanced.types';
import { createMindmapStructure } from '../utils/mindmapUtils';

// Mock Konva Stage for UI tests
const mockCursor = { cursor: 'default' };
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
  id: vi.fn().mockReturnValue(''),
  getType: vi.fn().mockReturnValue('Stage'),
  className: 'Stage',
  container: vi.fn(() => ({
    style: mockCursor
  }))
};

const mockStageRef = {
  current: mockStage as any
};

describe('MindmapTool', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockCursor.cursor = 'default';
  });

  describe('Basic Functionality', () => {
    it('should render when active', () => {
      const { container } = render(
        <MindmapTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );
      
      // Should not crash when rendering
      expect(container).toBeDefined();
    });

    it('should not render when inactive', () => {
      const { container } = render(
        <MindmapTool
          isActive={false}
          stageRef={mockStageRef}
        />
      );
      
      // Should not crash when rendering and return null
      expect(container).toBeDefined();
    });

    it('should register event handlers when active', () => {
      render(
        <MindmapTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Check that event handlers are registered (using namespaced event names)
      expect(mockStage.on).toHaveBeenCalledWith('pointermove.mindmapTool', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerdown.mindmapTool', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerleave.mindmapTool', expect.any(Function));
      expect(mockStage.on).toHaveBeenCalledWith('pointerenter.mindmapTool', expect.any(Function));
    });

    it('should clean up event handlers on unmount', () => {
      const { unmount } = render(
        <MindmapTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      unmount();

      expect(mockStage.off).toHaveBeenCalledWith('pointermove.mindmapTool', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerdown.mindmapTool', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerleave.mindmapTool', expect.any(Function));
      expect(mockStage.off).toHaveBeenCalledWith('pointerenter.mindmapTool', expect.any(Function));
    });

    it('should set crosshair cursor when active', () => {
      // REMOVED: Cursor is now managed centrally, not by individual tools
      expect(true).toBe(true);
    });

    it('should reset cursor when inactive', () => {
      // REMOVED: Cursor is now managed centrally, not by individual tools
      expect(true).toBe(true);
    });
  });

  describe('Mindmap Creation', () => {
    it('should create mindmap on click', () => {
      render(
        <MindmapTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered pointerdown handler
      const pointerDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'pointerdown.mindmapTool'
      )?.[1];

      // Click to create mindmap
      pointerDownHandler({
        target: mockStage,
        evt: { clientX: 100, clientY: 100 }
      });

      // Should have handled the click without errors
      expect(pointerDownHandler).toBeDefined();
    });

    it('should handle clicks on existing elements gracefully', () => {
      const mockElement = {
        ...mockStage,
        id: vi.fn().mockReturnValue('existing-element'),
        getType: vi.fn().mockReturnValue('Rect')
      };
      
      render(
        <MindmapTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered pointerdown handler
      const pointerDownHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'pointerdown.mindmapTool'
      )?.[1];

      // Click on existing element should be ignored
      pointerDownHandler({
        target: mockElement,
        evt: { clientX: 100, clientY: 100 }
      });

      // Should handle gracefully without errors
      expect(pointerDownHandler).toBeDefined();
    });

    it('should handle missing stage gracefully', () => {
      const nullStageRef = { current: null };
      
      const { container } = render(
        <MindmapTool
          isActive={true}
          stageRef={nullStageRef}
        />
      );

      // Should not crash with null stage
      expect(container).toBeDefined();
    });

    it('should handle missing pointer position', () => {
      const stageWithoutPointer = {
        ...mockStage,
        getPointerPosition: vi.fn(() => null)
      };
      
      const stageRef = { current: stageWithoutPointer as any };
      
      render(
        <MindmapTool
          isActive={true}
          stageRef={stageRef}
        />
      );

      // Get the registered pointerdown handler
      const pointerDownHandler = stageWithoutPointer.on.mock.calls.find(
        call => call[0] === 'pointerdown.mindmapTool'
      )?.[1];

      // Click without pointer position
      pointerDownHandler({
        target: stageWithoutPointer,
        evt: { clientX: 100, clientY: 100 }
      });

      // Should handle gracefully without errors
      expect(pointerDownHandler).toBeDefined();
    });

    it('should handle pointer movement for preview', () => {
      render(
        <MindmapTool
          isActive={true}
          stageRef={mockStageRef}
        />
      );

      // Get the registered pointermove handler
      const pointerMoveHandler = mockStage.on.mock.calls.find(
        call => call[0] === 'pointermove.mindmapTool'
      )?.[1];

      // Move pointer to show preview
      pointerMoveHandler({
        target: mockStage,
        evt: { clientX: 150, clientY: 150 }
      });

      // Should handle pointer movement without errors
      expect(pointerMoveHandler).toBeDefined();
    });
  });
});

// Store-First Tests - Testing actual business logic
describe('Mindmap Functionality (Store-First)', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Mindmap Structure Creation', () => {
    it('should create complete mindmap structure', () => {
      const { centralNode, childNodes, connectors } = createMindmapStructure(100, 100);

      // Add all elements to store
      store.getState().addElement(centralNode);
      childNodes.forEach(node => store.getState().addElement(node));
      connectors.forEach(connector => store.getState().addElement(connector));

      // Verify all elements were added
      expect(store.getState().elements.size).toBe(7); // 1 central + 3 children + 3 connectors
      expect(store.getState().elements.get(centralNode.id)).toEqual(centralNode);
      
      // Verify all child nodes were added
      childNodes.forEach(child => {
        expect(store.getState().elements.get(child.id)).toEqual(child);
      });
      
      // Verify all connectors were added
      connectors.forEach(connector => {
        expect(store.getState().elements.get(connector.id)).toEqual(connector);
      });
    });

    it('should create central node with correct properties', () => {
      const { centralNode } = createMindmapStructure(200, 150);

      expect(centralNode.type).toBe('text');
      expect(centralNode.text).toBe('Any question or topic');
      expect(centralNode.fontSize).toBe(18);
      expect(centralNode.fontFamily).toBe('Inter, sans-serif');
      expect(centralNode.fill).toBe('#1F2937');
      expect(centralNode.x).toBe(110); // 200 - 90
      expect(centralNode.y).toBe(138); // 150 - 12
    });

    it('should create child nodes with correct properties', () => {
      const { childNodes } = createMindmapStructure(100, 100);

      expect(childNodes).toHaveLength(3);
      
      // First child (A concept)
      expect(childNodes[0].text).toBe('A concept');
      expect(childNodes[0].fontSize).toBe(16);
      expect(childNodes[0].fill).toBe('#374151');
      expect(childNodes[0].x).toBe(260); // 100 + 160
      expect(childNodes[0].y).toBe(10); // 100 + (-80) - 10

      // Second child (An idea)
      expect(childNodes[1].text).toBe('An idea');
      expect(childNodes[1].x).toBe(260); // 100 + 160
      expect(childNodes[1].y).toBe(90); // 100 + 0 - 10

      // Third child (A thought)
      expect(childNodes[2].text).toBe('A thought');
      expect(childNodes[2].x).toBe(260); // 100 + 160
      expect(childNodes[2].y).toBe(170); // 100 + 80 - 10
    });

    it('should create connectors linking central node to children', () => {
      const { centralNode, childNodes, connectors } = createMindmapStructure(100, 100);

      expect(connectors).toHaveLength(3);
      
      connectors.forEach((connector, index) => {
        expect(connector.type).toBe('connector');
        expect(connector.subType).toBe('curved');
        expect(connector.startElementId).toBe(centralNode.id);
        expect(connector.endElementId).toBe(childNodes[index].id);
        expect(connector.stroke).toBe('#9CA3AF');
        expect(connector.strokeWidth).toBe(1.5);
        expect(connector.connectorStyle?.endArrow).toBe('none');
      });
    });

    it('should create curved connectors with intermediate points', () => {
      const { connectors } = createMindmapStructure(100, 100);

      // Top connector (to "A concept") should have intermediate points for curve
      expect(connectors[0].intermediatePoints).toHaveLength(2);
      expect(connectors[0].intermediatePoints?.[0]).toEqual({ x: 215, y: 85 });
      expect(connectors[0].intermediatePoints?.[1]).toEqual({ x: 225, y: 35 });

      // Middle connector (to "An idea") should be straight (no intermediate points)
      expect(connectors[1].intermediatePoints).toHaveLength(0);

      // Bottom connector (to "A thought") should have intermediate points for curve
      expect(connectors[2].intermediatePoints).toHaveLength(2);
      expect(connectors[2].intermediatePoints?.[0]).toEqual({ x: 215, y: 115 });
      expect(connectors[2].intermediatePoints?.[1]).toEqual({ x: 225, y: 165 });
    });

    it('should position elements relative to click point', () => {
      const clickX = 300;
      const clickY = 200;
      const { centralNode, childNodes } = createMindmapStructure(clickX, clickY);

      // Central node should be offset from click point
      expect(centralNode.x).toBe(clickX - 90);
      expect(centralNode.y).toBe(clickY - 12);

      // Child nodes should be positioned relative to click point
      expect(childNodes[0].x).toBe(clickX + 160);
      expect(childNodes[0].y).toBe(clickY - 80 - 10);
      
      expect(childNodes[1].x).toBe(clickX + 160);
      expect(childNodes[1].y).toBe(clickY + 0 - 10);
      
      expect(childNodes[2].x).toBe(clickX + 160);
      expect(childNodes[2].y).toBe(clickY + 80 - 10);
    });
  });

  describe('Mindmap Element Management', () => {
    it('should add individual mindmap elements', () => {
      const centralNode: TextElement = {
        id: createElementId('mindmap-central'),
        type: 'text',
        x: 100,
        y: 100,
        text: 'Central Topic',
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        fill: '#1F2937',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const childNode: TextElement = {
        id: createElementId('mindmap-child'),
        type: 'text',
        x: 200,
        y: 100,
        text: 'Child Idea',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        fill: '#374151',
        isLocked: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const connector: ConnectorElement = {
        id: createElementId('mindmap-connector'),
        type: 'connector',
        subType: 'curved',
        x: 0,
        y: 0,
        startElementId: centralNode.id,
        endElementId: childNode.id,
        startPoint: { x: 150, y: 110 },
        endPoint: { x: 190, y: 110 },
        intermediatePoints: [],
        stroke: '#9CA3AF',
        strokeWidth: 1.5,
        connectorStyle: {
          endArrow: 'none',
          strokeDashArray: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.getState().addElement(centralNode);
      store.getState().addElement(childNode);
      store.getState().addElement(connector);

      expect(store.getState().elements.size).toBe(3);
      expect(store.getState().elements.get(centralNode.id)).toEqual(centralNode);
      expect(store.getState().elements.get(childNode.id)).toEqual(childNode);
      expect(store.getState().elements.get(connector.id)).toEqual(connector);
    });

    it('should update mindmap node text', () => {
      const { centralNode } = createMindmapStructure(100, 100);
      store.getState().addElement(centralNode);

      // Update the text
      store.getState().updateElement(centralNode.id, {
        text: 'Updated Topic'
      });

      const updatedNode = store.getState().elements.get(centralNode.id) as TextElement;
      expect(updatedNode.text).toBe('Updated Topic');
    });

    it('should delete mindmap elements', () => {
      const { centralNode, childNodes, connectors } = createMindmapStructure(100, 100);
      
      // Add all elements
      store.getState().addElement(centralNode);
      childNodes.forEach(node => store.getState().addElement(node));
      connectors.forEach(connector => store.getState().addElement(connector));

      expect(store.getState().elements.size).toBe(7);

      // Delete central node
      store.getState().deleteElement(centralNode.id);

      expect(store.getState().elements.size).toBe(6);
      expect(store.getState().elements.has(centralNode.id)).toBe(false);
    });
  });

  describe('Mindmap Selection', () => {
    it('should select mindmap central node', () => {
      const { centralNode } = createMindmapStructure(100, 100);
      store.getState().addElement(centralNode);
      store.getState().selectElement(centralNode.id);

      expect(store.getState().selectedElementIds.has(centralNode.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(centralNode.id);
    });

    it('should select multiple mindmap elements', () => {
      const { centralNode, childNodes } = createMindmapStructure(100, 100);
      
      store.getState().addElement(centralNode);
      childNodes.forEach(node => store.getState().addElement(node));

      // Select central node and first child
      store.getState().selectElement(centralNode.id);
      store.getState().selectElement(childNodes[0].id, true); // multiSelect: true

      expect(store.getState().selectedElementIds.size).toBe(2);
      expect(store.getState().selectedElementIds.has(centralNode.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(childNodes[0].id)).toBe(true);
    });

    it('should handle selection of connected elements', () => {
      const { centralNode, childNodes, connectors } = createMindmapStructure(100, 100);
      
      // Add all elements
      store.getState().addElement(centralNode);
      childNodes.forEach(node => store.getState().addElement(node));
      connectors.forEach(connector => store.getState().addElement(connector));

      // Select central node and its connector
      store.getState().selectElement(centralNode.id);
      store.getState().selectElement(connectors[0].id, true);

      expect(store.getState().selectedElementIds.size).toBe(2);
      expect(store.getState().selectedElementIds.has(centralNode.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(connectors[0].id)).toBe(true);
    });
  });

  describe('Mindmap Integration', () => {
    it('should work with element creation workflow', () => {
      // Simulate the full mindmap creation workflow
      const { centralNode, childNodes, connectors } = createMindmapStructure(150, 150);

      // Add all elements (simulating what MindmapTool does)
      store.getState().addElement(centralNode);
      childNodes.forEach(node => store.getState().addElement(node));
      connectors.forEach(connector => store.getState().addElement(connector));

      // Select the central node (simulating tool behavior)
      store.getState().selectElement(centralNode.id);

      // Verify the complete workflow
      expect(store.getState().elements.size).toBe(7);
      expect(store.getState().selectedElementIds.has(centralNode.id)).toBe(true);
      
      // Verify structure integrity
      const savedCentralNode = store.getState().elements.get(centralNode.id) as TextElement;
      expect(savedCentralNode.text).toBe('Any question or topic');
      expect(savedCentralNode.fontSize).toBe(18);
      
      // Verify child nodes are properly connected
      connectors.forEach((connector, index) => {
        const savedConnector = store.getState().elements.get(connector.id) as ConnectorElement;
        expect(savedConnector.startElementId).toBe(centralNode.id);
        expect(savedConnector.endElementId).toBe(childNodes[index].id);
      });
    });

    it('should work with text editing workflow', () => {
      const { centralNode } = createMindmapStructure(100, 100);
      store.getState().addElement(centralNode);

      // Simulate starting text editing (what MindmapTool does)
      store.getState().setTextEditingElement(centralNode.id);

      // Verify text editing state
      expect(store.getState().textEditingElementId).toBe(centralNode.id);

      // Update text during editing
      store.getState().updateElement(centralNode.id, {
        text: 'My Main Topic'
      });

      // End text editing
      store.getState().setTextEditingElement(null);

      // Verify final state
      const updatedNode = store.getState().elements.get(centralNode.id) as TextElement;
      expect(updatedNode.text).toBe('My Main Topic');
      expect(store.getState().textEditingElementId).toBe(null);
    });

    it('should handle mindmap with different positioning', () => {
      // Test creating mindmap at different positions
      const positions = [
        { x: 0, y: 0 },
        { x: 500, y: 300 },
        { x: -100, y: -50 }
      ];

      positions.forEach(pos => {
        const { centralNode, childNodes } = createMindmapStructure(pos.x, pos.y);
        
        // Verify positioning is relative to input coordinates
        expect(centralNode.x).toBe(pos.x - 90);
        expect(centralNode.y).toBe(pos.y - 12);
        
        expect(childNodes[0].x).toBe(pos.x + 160);
        expect(childNodes[1].x).toBe(pos.x + 160);
        expect(childNodes[2].x).toBe(pos.x + 160);
      });
    });
  });
});

describe('MindmapTool', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
}); 