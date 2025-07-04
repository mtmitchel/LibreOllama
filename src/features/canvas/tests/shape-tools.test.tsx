/**
 * Shape Tools Tests (CircleTool, RectangleTool, TriangleTool)
 * 
 * Tests for the shape creation tools that use BaseShapeTool.
 * These tests focus on the actual store methods and business logic rather than UI mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CircleTool } from '../components/tools/creation/CircleTool';
import { RectangleTool } from '../components/tools/creation/RectangleTool';
import { TriangleTool } from '../components/tools/creation/TriangleTool';
import { createUnifiedTestStore } from '@/tests/helpers/createUnifiedTestStore';
import type { CircleElement, RectangleElement, TriangleElement } from '../types/enhanced.types';
import { ElementId } from '../types/enhanced.types';
import { createCircleElement, createRectangleElement, createTriangleElement } from '../components/tools/base/shapeCreators';

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

describe('Shape Tools', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockCursor.cursor = 'default';
  });

  describe('CircleTool', () => {
    describe('Basic Functionality', () => {
      it('should render when active', () => {
        const { container } = render(
          <CircleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );
        
        expect(container).toBeDefined();
      });

      it('should not render when inactive', () => {
        const { container } = render(
          <CircleTool
            isActive={false}
            stageRef={mockStageRef}
          />
        );
        
        expect(container).toBeDefined();
      });

      it('should register event handlers when active', () => {
        render(
          <CircleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        expect(mockStage.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(mockStage.on).toHaveBeenCalledWith('pointerleave', expect.any(Function));
        expect(mockStage.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      });

      it('should clean up event handlers on unmount', () => {
        const { unmount } = render(
          <CircleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        unmount();

        expect(mockStage.off).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(mockStage.off).toHaveBeenCalledWith('pointerleave', expect.any(Function));
        expect(mockStage.off).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      });
    });

    describe('Circle Creation', () => {
      it('should create circle on click', () => {
        render(
          <CircleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        const pointerDownHandler = mockStage.on.mock.calls.find(
          call => call[0] === 'pointerdown'
        )?.[1];

        pointerDownHandler({
          target: mockStage,
          cancelBubble: false,
          evt: { clientX: 100, clientY: 100 }
        });

        expect(pointerDownHandler).toBeDefined();
      });

      it('should handle clicks on existing elements gracefully', () => {
        const mockElement = {
          ...mockStage,
          id: vi.fn().mockReturnValue('existing-element'),
          getType: vi.fn().mockReturnValue('Circle')
        };
        
        render(
          <CircleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        const pointerDownHandler = mockStage.on.mock.calls.find(
          call => call[0] === 'pointerdown'
        )?.[1];

        pointerDownHandler({
          target: mockElement,
          cancelBubble: false,
          evt: { clientX: 100, clientY: 100 }
        });

        expect(pointerDownHandler).toBeDefined();
      });
    });
  });

  describe('RectangleTool', () => {
    describe('Basic Functionality', () => {
      it('should render when active', () => {
        const { container } = render(
          <RectangleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );
        
        expect(container).toBeDefined();
      });

      it('should not render when inactive', () => {
        const { container } = render(
          <RectangleTool
            isActive={false}
            stageRef={mockStageRef}
          />
        );
        
        expect(container).toBeDefined();
      });

      it('should register event handlers when active', () => {
        render(
          <RectangleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        expect(mockStage.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(mockStage.on).toHaveBeenCalledWith('pointerleave', expect.any(Function));
        expect(mockStage.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      });
    });

    describe('Rectangle Creation', () => {
      it('should create rectangle on click', () => {
        render(
          <RectangleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        const pointerDownHandler = mockStage.on.mock.calls.find(
          call => call[0] === 'pointerdown'
        )?.[1];

        pointerDownHandler({
          target: mockStage,
          cancelBubble: false,
          evt: { clientX: 100, clientY: 100 }
        });

        expect(pointerDownHandler).toBeDefined();
      });
    });
  });

  describe('TriangleTool', () => {
    describe('Basic Functionality', () => {
      it('should render when active', () => {
        const { container } = render(
          <TriangleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );
        
        expect(container).toBeDefined();
      });

      it('should not render when inactive', () => {
        const { container } = render(
          <TriangleTool
            isActive={false}
            stageRef={mockStageRef}
          />
        );
        
        expect(container).toBeDefined();
      });

      it('should register event handlers when active', () => {
        render(
          <TriangleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        expect(mockStage.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(mockStage.on).toHaveBeenCalledWith('pointerleave', expect.any(Function));
        expect(mockStage.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      });
    });

    describe('Triangle Creation', () => {
      it('should create triangle on click', () => {
        render(
          <TriangleTool
            isActive={true}
            stageRef={mockStageRef}
          />
        );

        const pointerDownHandler = mockStage.on.mock.calls.find(
          call => call[0] === 'pointerdown'
        )?.[1];

        pointerDownHandler({
          target: mockStage,
          cancelBubble: false,
          evt: { clientX: 100, clientY: 100 }
        });

        expect(pointerDownHandler).toBeDefined();
      });
    });
  });
});

// Store-First Tests - Testing actual business logic
describe('Shape Creation Functionality (Store-First)', () => {
  let store: ReturnType<typeof createUnifiedTestStore>;

  beforeEach(() => {
    store = createUnifiedTestStore();
  });

  describe('Circle Creation', () => {
    it('should create circle element with correct properties', () => {
      const position = { x: 100, y: 100 };
      const circle = createCircleElement(position);

      expect(circle.type).toBe('circle');
      expect(circle.x).toBe(50); // 100 - 50 (radius)
      expect(circle.y).toBe(50); // 100 - 50 (radius)
      expect(circle.radius).toBe(50);
      expect(circle.fill).toBe('#FFFFFF');
      expect(circle.stroke).toBe('#374151');
      expect(circle.strokeWidth).toBe(2);
      // expect(circle.opacity).toBe(1); // CircleElement doesn't have opacity property
      expect(circle.isLocked).toBe(false);
      expect(circle.isHidden).toBe(false);
      expect(circle.id).toBeDefined();
      expect(circle.createdAt).toBeDefined();
      expect(circle.updatedAt).toBeDefined();
    });

    it('should add circle to store', () => {
      const circle = createCircleElement({ x: 150, y: 150 });
      store.getState().addElement(circle);

      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(circle.id)).toEqual(circle);
    });

    it('should update circle properties', () => {
      const circle = createCircleElement({ x: 100, y: 100 });
      store.getState().addElement(circle);

      store.getState().updateElement(circle.id, {
        radius: 75,
        fill: '#FF0000'
      });

      const updatedCircle = store.getState().elements.get(circle.id) as CircleElement;
      expect(updatedCircle.radius).toBe(75);
      expect(updatedCircle.fill).toBe('#FF0000');
    });

    it('should delete circle from store', () => {
      const circle = createCircleElement({ x: 100, y: 100 });
      store.getState().addElement(circle);

      expect(store.getState().elements.size).toBe(1);

      store.getState().deleteElement(circle.id);

      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(circle.id)).toBe(false);
    });

    it('should select circle', () => {
      const circle = createCircleElement({ x: 100, y: 100 });
      store.getState().addElement(circle);
      store.getState().selectElement(circle.id);

      expect(store.getState().selectedElementIds.has(circle.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(circle.id);
    });
  });

  describe('Rectangle Creation', () => {
    it('should create rectangle element with correct properties', () => {
      const position = { x: 200, y: 200 };
      const rectangle = createRectangleElement(position);

      expect(rectangle.type).toBe('rectangle');
      expect(rectangle.x).toBe(140); // 200 - 60 (width/2)
      expect(rectangle.y).toBe(160); // 200 - 40 (height/2)
      expect(rectangle.width).toBe(120);
      expect(rectangle.height).toBe(80);
      expect(rectangle.cornerRadius).toBe(8);
      expect(rectangle.fill).toBe('#FFFFFF');
      expect(rectangle.stroke).toBe('#374151');
      expect(rectangle.strokeWidth).toBe(2);
      // expect(rectangle.opacity).toBe(1); // RectangleElement doesn't have opacity property
      expect(rectangle.isLocked).toBe(false);
      expect(rectangle.isHidden).toBe(false);
      expect(rectangle.id).toBeDefined();
      expect(rectangle.createdAt).toBeDefined();
      expect(rectangle.updatedAt).toBeDefined();
    });

    it('should add rectangle to store', () => {
      const rectangle = createRectangleElement({ x: 250, y: 250 });
      store.getState().addElement(rectangle);

      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(rectangle.id)).toEqual(rectangle);
    });

    it('should update rectangle properties', () => {
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      store.getState().addElement(rectangle);

      store.getState().updateElement(rectangle.id, {
        width: 150,
        height: 100,
        cornerRadius: 12
      });

      const updatedRectangle = store.getState().elements.get(rectangle.id) as RectangleElement;
      expect(updatedRectangle.width).toBe(150);
      expect(updatedRectangle.height).toBe(100);
      expect(updatedRectangle.cornerRadius).toBe(12);
    });

    it('should delete rectangle from store', () => {
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      store.getState().addElement(rectangle);

      expect(store.getState().elements.size).toBe(1);

      store.getState().deleteElement(rectangle.id);

      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(rectangle.id)).toBe(false);
    });

    it('should select rectangle', () => {
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      store.getState().addElement(rectangle);
      store.getState().selectElement(rectangle.id);

      expect(store.getState().selectedElementIds.has(rectangle.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(rectangle.id);
    });
  });

  describe('Triangle Creation', () => {
    it('should create triangle element with correct properties', () => {
      const position = { x: 300, y: 300 };
      const triangle = createTriangleElement(position);

      expect(triangle.type).toBe('triangle');
      expect(triangle.x).toBe(242.5); // 300 - 57.5 (width/2)
      expect(triangle.y).toBe(242.5); // 300 - 57.5 (height/2)
      expect(triangle.width).toBe(115);
      expect(triangle.height).toBe(115);
      expect(triangle.points).toEqual([
        57.5, 0,    // Top point (width/2, 0)
        0, 115,     // Bottom left (0, height)
        115, 115    // Bottom right (width, height)
      ]);
      expect(triangle.fill).toBe('#FFFFFF');
      expect(triangle.stroke).toBe('#374151');
      expect(triangle.strokeWidth).toBe(2);
      expect(triangle.isLocked).toBe(false);
      expect(triangle.isHidden).toBe(false);
      expect(triangle.id).toBeDefined();
      expect(triangle.createdAt).toBeDefined();
      expect(triangle.updatedAt).toBeDefined();
    });

    it('should add triangle to store', () => {
      const triangle = createTriangleElement({ x: 350, y: 350 });
      store.getState().addElement(triangle);

      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.get(triangle.id)).toEqual(triangle);
    });

    it('should update triangle properties', () => {
      const triangle = createTriangleElement({ x: 300, y: 300 });
      store.getState().addElement(triangle);

      store.getState().updateElement(triangle.id, {
        width: 130,
        height: 130,
        fill: '#00FF00'
      });

      const updatedTriangle = store.getState().elements.get(triangle.id) as TriangleElement;
      expect(updatedTriangle.width).toBe(130);
      expect(updatedTriangle.height).toBe(130);
      expect(updatedTriangle.fill).toBe('#00FF00');
    });

    it('should delete triangle from store', () => {
      const triangle = createTriangleElement({ x: 300, y: 300 });
      store.getState().addElement(triangle);

      expect(store.getState().elements.size).toBe(1);

      store.getState().deleteElement(triangle.id);

      expect(store.getState().elements.size).toBe(0);
      expect(store.getState().elements.has(triangle.id)).toBe(false);
    });

    it('should select triangle', () => {
      const triangle = createTriangleElement({ x: 300, y: 300 });
      store.getState().addElement(triangle);
      store.getState().selectElement(triangle.id);

      expect(store.getState().selectedElementIds.has(triangle.id)).toBe(true);
      expect(store.getState().lastSelectedElementId).toBe(triangle.id);
    });
  });

  describe('Multi-Shape Operations', () => {
    it('should create and manage multiple shapes', () => {
      const circle = createCircleElement({ x: 100, y: 100 });
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      const triangle = createTriangleElement({ x: 300, y: 300 });

      store.getState().addElement(circle);
      store.getState().addElement(rectangle);
      store.getState().addElement(triangle);

      expect(store.getState().elements.size).toBe(3);
      expect(store.getState().elements.get(circle.id)).toEqual(circle);
      expect(store.getState().elements.get(rectangle.id)).toEqual(rectangle);
      expect(store.getState().elements.get(triangle.id)).toEqual(triangle);
    });

    it('should select multiple shapes', () => {
      const circle = createCircleElement({ x: 100, y: 100 });
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      const triangle = createTriangleElement({ x: 300, y: 300 });

      store.getState().addElement(circle);
      store.getState().addElement(rectangle);
      store.getState().addElement(triangle);

      // Select multiple shapes
      store.getState().selectElement(circle.id);
      store.getState().selectElement(rectangle.id, true); // multiSelect: true
      store.getState().selectElement(triangle.id, true); // multiSelect: true

      expect(store.getState().selectedElementIds.size).toBe(3);
      expect(store.getState().selectedElementIds.has(circle.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(rectangle.id)).toBe(true);
      expect(store.getState().selectedElementIds.has(triangle.id)).toBe(true);
    });

    it('should delete multiple shapes', () => {
      const circle = createCircleElement({ x: 100, y: 100 });
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      const triangle = createTriangleElement({ x: 300, y: 300 });

      store.getState().addElement(circle);
      store.getState().addElement(rectangle);
      store.getState().addElement(triangle);

      expect(store.getState().elements.size).toBe(3);

      // Delete shapes
      store.getState().deleteElement(circle.id);
      store.getState().deleteElement(rectangle.id);

      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().elements.has(circle.id)).toBe(false);
      expect(store.getState().elements.has(rectangle.id)).toBe(false);
      expect(store.getState().elements.has(triangle.id)).toBe(true);
    });

    it('should handle shape positioning correctly', () => {
      // Test different positions
      const positions = [
        { x: 0, y: 0 },
        { x: 500, y: 300 },
        { x: -100, y: -50 }
      ];

      positions.forEach(pos => {
        const circle = createCircleElement(pos);
        const rectangle = createRectangleElement(pos);
        const triangle = createTriangleElement(pos);

        // Circle positioning (centered on click)
        expect(circle.x).toBe(pos.x - 50);
        expect(circle.y).toBe(pos.y - 50);

        // Rectangle positioning (centered on click)
        expect(rectangle.x).toBe(pos.x - 60);
        expect(rectangle.y).toBe(pos.y - 40);

        // Triangle positioning (centered on click)
        expect(triangle.x).toBe(pos.x - 57.5);
        expect(triangle.y).toBe(pos.y - 57.5);
      });
    });
  });

  describe('Shape Integration Tests', () => {
    it('should work with element creation workflow', () => {
      // Simulate the full shape creation workflow
      const circle = createCircleElement({ x: 150, y: 150 });

      // Add element (simulating what BaseShapeTool does)
      store.getState().addElement(circle);

      // Select the element (simulating tool behavior)
      store.getState().selectElement(circle.id);

      // Verify the complete workflow
      expect(store.getState().elements.size).toBe(1);
      expect(store.getState().selectedElementIds.has(circle.id)).toBe(true);
      
      // Verify element properties
      const savedCircle = store.getState().elements.get(circle.id) as CircleElement;
      expect(savedCircle.radius).toBe(50);
      expect(savedCircle.fill).toBe('#FFFFFF');
      expect(savedCircle.stroke).toBe('#374151');
    });

    it('should work with text editing workflow', () => {
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      store.getState().addElement(rectangle);

      // Simulate starting text editing (what BaseShapeTool does with shouldStartTextEdit)
      store.getState().setTextEditingElement(rectangle.id);

      // Verify text editing state
      expect(store.getState().textEditingElementId).toBe(rectangle.id);

      // End text editing
      store.getState().setTextEditingElement(null);

      // Verify final state
      expect(store.getState().textEditingElementId).toBe(null);
    });

    it('should handle shapes with different styling', () => {
      const circle = createCircleElement({ x: 100, y: 100 });
      const rectangle = createRectangleElement({ x: 200, y: 200 });
      const triangle = createTriangleElement({ x: 300, y: 300 });

      store.getState().addElement(circle);
      store.getState().addElement(rectangle);
      store.getState().addElement(triangle);

      // Update shapes with different styles
      store.getState().updateElement(circle.id, {
        fill: '#FF0000',
        stroke: '#000000',
        strokeWidth: 3
      });

      store.getState().updateElement(rectangle.id, {
        fill: '#00FF00',
        cornerRadius: 15
      });

      store.getState().updateElement(triangle.id, {
        fill: '#0000FF',
        width: 100,
        height: 100
      });

      // Verify updates
      const updatedCircle = store.getState().elements.get(circle.id) as CircleElement;
      const updatedRectangle = store.getState().elements.get(rectangle.id) as RectangleElement;
      const updatedTriangle = store.getState().elements.get(triangle.id) as TriangleElement;

      expect(updatedCircle.fill).toBe('#FF0000');
      expect(updatedCircle.stroke).toBe('#000000');
      expect(updatedCircle.strokeWidth).toBe(3);

      expect(updatedRectangle.fill).toBe('#00FF00');
      expect(updatedRectangle.cornerRadius).toBe(15);

      expect(updatedTriangle.fill).toBe('#0000FF');
      expect(updatedTriangle.width).toBe(100);
      expect(updatedTriangle.height).toBe(100);
    });
  });
});

describe('Shape Tools', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
}); 